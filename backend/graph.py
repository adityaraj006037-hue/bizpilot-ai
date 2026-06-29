"""LangGraph state graph for the BizPilot pipeline.

State machine
-------------
    run_scout -> check_scout -> (run_scout | run_craft)
    run_craft -> check_craft -> (run_craft | run_pulse)
    run_pulse -> save_results -> END

Retry rules
-----------
    - If Scout's output contains no parseable email, retry Scout up to 3 times
      (so up to 4 total attempts).
    - If Craft's output is under 50 words, regenerate Craft exactly once.

After each agent finishes, a row is written to the `agent_logs` table so the
frontend's Supabase Realtime channel can stream the activity feed.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Literal, Optional, TypedDict

from crewai import Crew, Process
from langgraph.graph import END, StateGraph

from agents import (
    make_craft,
    make_email_task,
    make_pulse,
    make_research_task,
    make_scout,
    make_tracking_task,
)

logger = logging.getLogger("bizpilot.graph")


SCOUT_MAX_RETRIES = 3
CRAFT_MAX_RETRIES = 1
CRAFT_MIN_WORDS = 50


class AgentState(TypedDict, total=False):
    company: str
    industry: str
    user_id: str
    run_id: str
    scout_output: Optional[str]
    craft_output: Optional[str]
    pulse_output: Optional[str]
    retry_count: int
    lead_id: Optional[str]
    emails: list
    followups: list
    error: Optional[str]


# --------------------------------------------------------------------------- #
# Logging helper
# --------------------------------------------------------------------------- #

def _log(supabase, run_id: str, agent: str, message: str) -> None:
    """Insert a row into agent_logs so the frontend Realtime channel picks it up."""
    try:
        supabase.table("agent_logs").insert({
            "run_id": run_id,
            "agent": agent,
            "message": (message or "")[:2000],
        }).execute()
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Failed to insert agent log: %s", exc)


# --------------------------------------------------------------------------- #
# Parsers
# --------------------------------------------------------------------------- #

_EMAIL_RE = re.compile(r"[\w\.\+\-]+@[\w\-]+\.[\w\.\-]+")


def _has_email(output: str) -> bool:
    if not output:
        return False
    m = re.search(r"EMAIL:\s*(\S+)", output, re.IGNORECASE)
    if not m:
        return False
    addr = (m.group(1) or "").strip().rstrip(".,;")
    if "@" not in addr or "." not in addr.split("@")[-1]:
        return False
    lower = addr.lower()
    if any(bad in lower for bad in ("n/a", "unknown", "tbd", "example.com", "[email")):
        return False
    return True


def _word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text or ""))


def _parse_research(output: str) -> dict:
    if not output:
        return {}
    out: dict = {}
    patterns = {
        "company":    r"COMPANY:\s*(.+?)(?=\n[A-Z][A-Z_]*:|\Z)",
        "contact":    r"CONTACT:\s*(.+?)(?=\n[A-Z][A-Z_]*:|\Z)",
        "email":      r"EMAIL:\s*(\S+)",
        "pain_point": r"PAIN_POINT:\s*(.+?)(?=\n[A-Z][A-Z_]*:|\Z)",
        "evidence":   r"EVIDENCE:\s*(.+?)(?=\n[A-Z][A-Z_]*:|\Z)",
    }
    for key, pat in patterns.items():
        m = re.search(pat, output, re.DOTALL | re.IGNORECASE)
        if not m:
            continue
        val = m.group(1).strip().rstrip(".,;")
        if key == "email":
            email_m = _EMAIL_RE.search(val)
            if email_m:
                val = email_m.group(0)
        out[key] = val
    return out


def _parse_emails(output: str) -> list:
    """Return 3 normalized email dicts in [Direct, Story, Value-First] order."""
    canonical = ["Direct", "Story", "Value-First"]
    by_variant: dict = {}
    if output:
        chunks = re.split(r"VARIANT:\s*", output, flags=re.IGNORECASE)
        for chunk in chunks[1:]:
            first_line, _, rest = chunk.partition("\n")
            name = first_line.strip()
            subject_m = re.search(
                r"SUBJECT:\s*(.+?)(?=\nBODY:|\Z)", rest, re.DOTALL | re.IGNORECASE
            )
            body_m = re.search(
                r"BODY:\s*(.+?)(?=\nVARIANT:|\Z)", rest, re.DOTALL | re.IGNORECASE
            )
            target = name
            for c in canonical:
                if c.lower() in name.lower():
                    target = c
                    break
            by_variant[target] = {
                "variant": target,
                "subject": (subject_m.group(1).strip() if subject_m else ""),
                "body": (body_m.group(1).strip() if body_m else ""),
            }
    out = []
    for c in canonical:
        entry = by_variant.get(c)
        if entry and (entry["subject"] or entry["body"]):
            out.append(entry)
        else:
            out.append({
                "variant": c,
                "subject": f"Quick thought for {c.lower()} outreach",
                "body": "",
            })
    return out


def _parse_followups(output: str) -> list:
    out: list = []
    pat = r"DAY\s*(\d+)\s*:\s*([^|\n]+?)\s*\|\s*(.+?)(?=\nDAY\s*\d+:|\Z)"
    for m in re.finditer(pat, output or "", re.DOTALL | re.IGNORECASE):
        try:
            day = int(m.group(1))
        except (TypeError, ValueError):
            continue
        out.append({
            "day": day,
            "title": m.group(2).strip(),
            "body": m.group(3).strip(),
        })
    # Sort and de-duplicate by day
    out.sort(key=lambda x: x["day"])
    seen: set = set()
    deduped = []
    for item in out:
        if item["day"] in seen:
            continue
        seen.add(item["day"])
        deduped.append(item)
    # Pad to 10
    cursor = 1
    while len(deduped) < 10:
        deduped.append({
            "day": cursor,
            "title": f"Follow-up touch {cursor}",
            "body": "Share a new insight, case study, or resource to revive the thread.",
        })
        cursor += 1
    return deduped[:10]


# --------------------------------------------------------------------------- #
# Crew runners
# --------------------------------------------------------------------------- #

def _kickoff_scout(state: AgentState) -> str:
    scout = make_scout()
    research_task = make_research_task(scout, state["company"], state["industry"])
    crew = Crew(
        agents=[scout],
        tasks=[research_task],
        process=Process.sequential,
        verbose=False,
    )
    return str(crew.kickoff() or "")


def _kickoff_craft(state: AgentState) -> str:
    # Reuse a scout agent just to create a research_task we can prime with
    # the prior scout output, then pass it to Craft as context.
    research_task = make_research_task(
        make_scout(), state["company"], state["industry"]
    )
    research_task.output = state.get("scout_output") or ""

    craft = make_craft()
    email_task = make_email_task(craft, context_tasks=[research_task])
    crew = Crew(
        agents=[craft],
        tasks=[email_task],
        process=Process.sequential,
        verbose=False,
    )
    return str(crew.kickoff() or "")


def _kickoff_pulse(state: AgentState) -> str:
    # Build a synthetic research + email context carrying the prior outputs.
    research_task = make_research_task(
        make_scout(), state["company"], state["industry"]
    )
    research_task.output = state.get("scout_output") or ""

    email_task = make_email_task(
        make_craft(), context_tasks=[research_task]
    )
    email_task.output = state.get("craft_output") or ""

    pulse = make_pulse()
    tracking_task = make_tracking_task(
        pulse, context_tasks=[research_task, email_task]
    )
    crew = Crew(
        agents=[pulse],
        tasks=[tracking_task],
        process=Process.sequential,
        verbose=False,
    )
    return str(crew.kickoff() or "")


# --------------------------------------------------------------------------- #
# Persist results to Supabase
# --------------------------------------------------------------------------- #

def _save_results(state: AgentState, supabase) -> AgentState:
    _log(supabase, state["run_id"], "Pulse", "Persisting lead, emails, and follow-ups…")

    research = _parse_research(state.get("scout_output") or "")
    emails = _parse_emails(state.get("craft_output") or "")
    followups = _parse_followups(state.get("pulse_output") or "")

    now = datetime.now(timezone.utc).isoformat()
    try:
        lead_row = {
            "user_id": state["user_id"],
            "company": research.get("company") or state["company"],
            "industry": state["industry"],
            "contact": research.get("contact"),
            "email": research.get("email"),
            "pain_point": research.get("pain_point"),
            "evidence": research.get("evidence"),
            "status": "new",
            "created_at": now,
        }
        res = supabase.table("leads").insert(lead_row).execute()
        if not res.data:
            raise RuntimeError("Lead insert returned no data")
        lead_id = res.data[0]["id"]
        state["lead_id"] = lead_id

        email_rows = [
            {**email, "lead_id": lead_id, "user_id": state["user_id"], "created_at": now}
            for email in emails
        ]
        supabase.table("emails").insert(email_rows).execute()

        followup_rows = [
            {**fu, "lead_id": lead_id, "user_id": state["user_id"], "created_at": now}
            for fu in followups
        ]
        supabase.table("followups").insert(followup_rows).execute()

        state["emails"] = email_rows
        state["followups"] = followup_rows
        _log(supabase, state["run_id"], "Pulse", f"Saved. Lead ID: {lead_id}")
    except Exception as exc:
        logger.exception("Save failed")
        state["error"] = str(exc)
        _log(supabase, state["run_id"], "Pulse", f"Save error: {exc}")
    return state


# --------------------------------------------------------------------------- #
# Graph construction
# --------------------------------------------------------------------------- #

def _build_graph(supabase):
    """Build and compile the LangGraph state graph."""

    def run_scout(state: AgentState) -> AgentState:
        _log(supabase, state["run_id"], "Scout",
             f"Researching {state['company']} ({state['industry']})…")
        _log(supabase, state["run_id"], "Scout",
             "Querying web sources and compiling a structured brief…")
        try:
            state["scout_output"] = _kickoff_scout(state)
            _log(supabase, state["run_id"], "Scout", "Research brief ready.")
        except Exception as exc:
            logger.exception("Scout failed")
            state["scout_output"] = ""
            _log(supabase, state["run_id"], "Scout", f"Research error: {exc}")
        return state

    def check_scout(state: AgentState) -> AgentState:
        if not _has_email(state.get("scout_output") or ""):
            rc = state.get("retry_count", 0) + 1
            state["retry_count"] = rc
            if rc <= SCOUT_MAX_RETRIES:
                _log(
                    supabase,
                    state["run_id"],
                    "Scout",
                    f"No email found. Retry {rc}/{SCOUT_MAX_RETRIES}…",
                )
        return state

    def route_scout(state: AgentState) -> Literal["run_scout", "run_craft"]:
        rc = state.get("retry_count", 0)
        if (
            not _has_email(state.get("scout_output") or "")
            and rc <= SCOUT_MAX_RETRIES
        ):
            return "run_scout"
        state["retry_count"] = 0
        return "run_craft"

    def run_craft(state: AgentState) -> AgentState:
        _log(supabase, state["run_id"], "Craft", "Drafting three email variants…")
        _log(supabase, state["run_id"], "Craft",
             "Calibrating tone, length, and CTA…")
        try:
            state["craft_output"] = _kickoff_craft(state)
            wc = _word_count(state["craft_output"])
            _log(supabase, state["run_id"], "Craft",
                 f"Email variants ready ({wc} words).")
        except Exception as exc:
            logger.exception("Craft failed")
            state["craft_output"] = ""
            _log(supabase, state["run_id"], "Craft", f"Drafting error: {exc}")
        return state

    def check_craft(state: AgentState) -> AgentState:
        if _word_count(state.get("craft_output") or "") < CRAFT_MIN_WORDS:
            state["retry_count"] = state.get("retry_count", 0) + 1
        return state

    def route_craft(state: AgentState) -> Literal["run_craft", "run_pulse"]:
        rc = state.get("retry_count", 0)
        if (
            rc == CRAFT_MAX_RETRIES
            and _word_count(state.get("craft_output") or "") < CRAFT_MIN_WORDS
        ):
            return "run_craft"
        state["retry_count"] = 0
        return "run_pulse"

    def run_pulse(state: AgentState) -> AgentState:
        _log(supabase, state["run_id"], "Pulse",
             "Designing 10-day follow-up cadence…")
        _log(supabase, state["run_id"], "Pulse",
             "Mapping touchpoints to intent signals…")
        try:
            state["pulse_output"] = _kickoff_pulse(state)
            _log(supabase, state["run_id"], "Pulse", "Cadence locked.")
        except Exception as exc:
            logger.exception("Pulse failed")
            state["pulse_output"] = ""
            _log(supabase, state["run_id"], "Pulse", f"Cadence error: {exc}")
        return state

    def save_results(state: AgentState) -> AgentState:
        return _save_results(state, supabase)

    workflow = StateGraph(AgentState)
    workflow.add_node("run_scout", run_scout)
    workflow.add_node("check_scout", check_scout)
    workflow.add_node("run_craft", run_craft)
    workflow.add_node("check_craft", check_craft)
    workflow.add_node("run_pulse", run_pulse)
    workflow.add_node("save_results", save_results)

    workflow.set_entry_point("run_scout")
    workflow.add_edge("run_scout", "check_scout")
    workflow.add_conditional_edges(
        "check_scout",
        route_scout,
        {"run_scout": "run_scout", "run_craft": "run_craft"},
    )
    workflow.add_edge("run_craft", "check_craft")
    workflow.add_conditional_edges(
        "check_craft",
        route_craft,
        {"run_craft": "run_craft", "run_pulse": "run_pulse"},
    )
    workflow.add_edge("run_pulse", "save_results")
    workflow.add_edge("save_results", END)

    return workflow.compile()


# Compiled graph instance, lazy-initialised on first use.
_graph = None


def get_graph(supabase):
    """Return a compiled LangGraph bound to the given Supabase client."""
    global _graph
    if _graph is None:
        _graph = _build_graph(supabase)
    return _graph


async def run_pipeline(
    company: str,
    industry: str,
    user_id: str,
    run_id: str,
    supabase,
) -> dict:
    """Public entrypoint. Invokes the graph and returns the API response payload."""
    graph = get_graph(supabase)
    initial: AgentState = {
        "company": company,
        "industry": industry,
        "user_id": user_id,
        "run_id": run_id,
        "scout_output": None,
        "craft_output": None,
        "pulse_output": None,
        "retry_count": 0,
        "lead_id": None,
        "emails": [],
        "followups": [],
        "error": None,
    }

    final = await graph.ainvoke(initial)

    if final.get("error"):
        raise RuntimeError(final["error"])
    if not final.get("lead_id"):
        raise RuntimeError("Pipeline did not produce a lead_id")

    return {
        "success": True,
        "lead_id": final["lead_id"],
    }
