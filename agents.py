"""CrewAI agent and task definitions for the BizPilot pipeline.

Three agents:
    - Scout : Research with SerperDevTool + WebsiteSearchTool
    - Craft : Cold-email copywriter
    - Pulse : 10-day follow-up cadence designer

All three share a single Groq LLaMA 3.1 8B model, configured via GROQ_API_KEY
and overridable via GROQ_MODEL.
"""
from __future__ import annotations

import os
from typing import List, Optional

from crewai import Agent, LLM, Task


GROQ_MODEL = os.environ.get("GROQ_MODEL", "groq/llama-3.1-8b-instant")


def get_llm() -> LLM:
    """Return the shared Groq-backed LLM used by every agent."""
    return LLM(
        model=GROQ_MODEL,
        api_key=os.environ["GROQ_API_KEY"],
        temperature=0.4,
    )


def _scout_tools() -> list:
    """Lazily build the Scout's toolset so missing keys fail loudly per-agent."""
    tools = []
    if os.environ.get("SERPER_API_KEY"):
        try:
            from crewai_tools import SerperDevTool
            tools.append(SerperDevTool())
        except Exception:
            # Tool import failure is non-fatal — Scout just runs without it.
            pass
    if os.environ.get("OPENAI_API_KEY"):
        try:
            from crewai_tools import WebsiteSearchTool
            tools.append(WebsiteSearchTool())
        except Exception:
            pass
    return tools


# --------------------------------------------------------------------------- #
# Agents
# --------------------------------------------------------------------------- #

def make_scout() -> Agent:
    return Agent(
        role="Research Scout",
        goal=(
            "Find the most relevant decision-maker, a verified business email, "
            "and one specific operational pain point for the target company. "
            "Always return a structured, citation-backed brief."
        ),
        backstory=(
            "You are a veteran B2B sales researcher with 10 years of experience "
            "using public web data to identify high-fit prospects. You are "
            "precise, evidence-based, and always cite the source URL behind "
            "every claim you make."
        ),
        tools=_scout_tools(),
        llm=get_llm(),
        verbose=True,
        allow_delegation=False,
    )


def make_craft() -> Agent:
    return Agent(
        role="Cold Email Copywriter",
        goal=(
            "Write three distinct cold-email variants (Direct, Story, Value-First) "
            "that reference the prospect's specific pain point. Each variant "
            "must have a subject line under 60 characters and a body of 80 to 130 "
            "words. Never use generic openers like 'I hope this finds you well'."
        ),
        backstory=(
            "You are a conversion copywriter who has written millions of dollars "
            "worth of B2B cold email. You know that every line must earn the next "
            "line. You are allergic to fluff."
        ),
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False,
    )


def make_pulse() -> Agent:
    return Agent(
        role="Follow-up Strategist",
        goal=(
            "Design a 10-touch follow-up sequence that re-engages prospects who "
            "did not reply to the initial outreach. Each touch should add new "
            "value, not just 'bump' the previous email. Space the touches across "
            "10 days with increasing channel variety."
        ),
        backstory=(
            "You are a sales operations expert who has built follow-up cadences "
            "for high-velocity outbound teams. You understand timing, channel "
            "mix, and how to revive a dead thread without being annoying."
        ),
        tools=[],
        llm=get_llm(),
        verbose=True,
        allow_delegation=False,
    )


# --------------------------------------------------------------------------- #
# Tasks
# --------------------------------------------------------------------------- #

def make_research_task(agent: Agent, company: str, industry: str) -> Task:
    return Task(
        description=(
            f"Research the company '{company}' in the '{industry}' industry.\n\n"
            "Produce a structured brief with these exact section headings, in "
            "this order:\n\n"
            "COMPANY: one-sentence description of what they do.\n"
            "CONTACT: full name and job title of the most relevant "
            "decision-maker.\n"
            "EMAIL: a verified or best-guess business email for that contact "
            "(format name@domain.com).\n"
            "PAIN_POINT: one specific operational pain point this company "
            "likely has that an outreach automation product could solve.\n"
            "EVIDENCE: 1-2 source URLs that back up the above claims.\n"
        ),
        expected_output=(
            "A text brief with the exact headings COMPANY, CONTACT, EMAIL, "
            "PAIN_POINT, EVIDENCE on separate lines. No other prose."
        ),
        agent=agent,
    )


def make_email_task(agent: Agent, context_tasks: Optional[List[Task]] = None) -> Task:
    return Task(
        description=(
            "Using the research brief above as context, write three cold-email "
            "variants tailored to the prospect.\n\n"
            "Output format MUST be exactly:\n\n"
            "VARIANT: Direct\n"
            "SUBJECT: <subject line, max 60 chars>\n"
            "BODY: <body, 80-130 words, no generic openers, ends with a soft "
            "CTA>\n\n"
            "VARIANT: Story\n"
            "SUBJECT: <...>\n"
            "BODY: <...>\n\n"
            "VARIANT: Value-First\n"
            "SUBJECT: <...>\n"
            "BODY: <...>\n"
        ),
        expected_output=(
            "Three labelled email variants, each with a SUBJECT and BODY. "
            "The first word of each variant block must be 'VARIANT:'."
        ),
        agent=agent,
        context=context_tasks or [],
    )


def make_tracking_task(
    agent: Agent, context_tasks: Optional[List[Task]] = None
) -> Task:
    return Task(
        description=(
            "Using the research brief and the three email variants above as "
            "context, design a 10-day follow-up cadence.\n\n"
            "Output format MUST be exactly 10 lines, one per day, in order:\n\n"
            "DAY 1: <short title> | <body angle, 1 sentence>\n"
            "DAY 2: <short title> | <body angle, 1 sentence>\n"
            "...continuing through DAY 10\n"
        ),
        expected_output=(
            "Exactly 10 lines, one per day (DAY 1 through DAY 10), each with a "
            "title and a one-sentence body angle separated by a pipe character."
        ),
        agent=agent,
        context=context_tasks or [],
    )
