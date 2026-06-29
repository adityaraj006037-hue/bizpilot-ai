"""
BizPilot AI — FastAPI backend
==============================

Endpoints
---------
GET  /                          → health check
GET  /health                    → health check (alias)
POST /api/run                   → run the full Scout → Craft → Pulse pipeline
                                 (Part 5 — CrewAI + LangGraph, kept intact)
GET  /api/test-keys             → validate a Groq API key with a 1-token call
                                 (Part 6 — graceful failure, never 500)

All pipeline work is delegated to `agents.py` and `graph.py`.
"""

from __future__ import annotations

import os
import time
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from pydantic import BaseModel, Field

# Local pipeline modules (Part 5)
from agents import run_crew           # noqa: E402
from graph import run_pipeline        # noqa: E402

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
load_dotenv()

GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
SERPER_API_KEY  = os.getenv("SERPER_API_KEY", "")
SUPABASE_URL    = os.getenv("SUPABASE_URL", "")
FRONTEND_ORIGIN = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")

logger = logging.getLogger("bizpilot")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")


def _parse_origins(value: str) -> List[str]:
    """Comma-separated list → list, trimmed, no empties."""
    return [o.strip() for o in value.split(",") if o.strip()]


# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("BizPilot backend starting — origins=%s", _parse_origins(FRONTEND_ORIGIN))
    yield
    logger.info("BizPilot backend shutting down")


app = FastAPI(
    title="BizPilot AI API",
    version="1.0.0",
    description="Autonomous B2B outreach pipeline.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_origins(FRONTEND_ORIGIN),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------
class RunRequest(BaseModel):
    workspace_id: str = Field(..., description="Supabase workspace_id (UUID)")
    user_id: str      = Field(..., description="Supabase auth user_id (UUID)")
    query: str        = Field(..., min_length=2, description="Natural-language lead search query")
    limit: int        = Field(10, ge=1, le=50, description="Max leads to process")


class RunResponse(BaseModel):
    success: bool
    workspace_id: str
    leads: int
    emails: int
    followups: int
    duration_ms: int
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"status": "ok", "service": "bizpilot-api", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "groq_configured":    bool(GROQ_API_KEY),
        "serper_configured":  bool(SERPER_API_KEY),
        "supabase_configured": bool(SUPABASE_URL),
    }


# ---------------------------------------------------------------------------
# POST /api/run   (Part 5 — kept intact)
# ---------------------------------------------------------------------------
# Runs the Scout → Craft → Pulse agents via LangGraph. The graph itself
# handles the per-agent retries (Scout: up to 3, Craft: 1, Pulse: 0) and
# streams agent_logs into Supabase. We time the whole run and return a
# compact summary; the full pipeline state is in graph.py.
# ---------------------------------------------------------------------------
@app.post("/api/run", response_model=RunResponse)
async def run_pipeline_endpoint(req: RunRequest) -> RunResponse:
    started = time.time()
    logger.info(
        "POST /api/run — workspace=%s user=%s query=%r limit=%d",
        req.workspace_id, req.user_id, req.query, req.limit,
    )
    try:
        # graph.run_pipeline owns the orchestration + retry policy
        state = await run_pipeline(
            workspace_id=req.workspace_id,
            user_id=req.user_id,
            query=req.query,
            limit=req.limit,
        )
        duration_ms = int((time.time() - started) * 1000)

        return RunResponse(
            success=True,
            workspace_id=req.workspace_id,
            leads=int(state.get("lead_count", 0)),
            emails=int(state.get("email_count", 0)),
            followups=int(state.get("followup_count", 0)),
            duration_ms=duration_ms,
            result={
                "scout":  state.get("scout_result"),
                "craft":  state.get("craft_result"),
                "pulse":  state.get("pulse_result"),
            },
        )
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001 — surface a clean 500, not a stack trace
        logger.exception("Pipeline run failed")
        duration_ms = int((time.time() - started) * 1000)
        return RunResponse(
            success=False,
            workspace_id=req.workspace_id,
            leads=0, emails=0, followups=0,
            duration_ms=duration_ms,
            error=str(exc),
        )


# ---------------------------------------------------------------------------
# GET /api/test-keys   (Part 6 — new)
# ---------------------------------------------------------------------------
# Validates a Groq API key by issuing a minimal 1-token chat completion.
# The key is taken from the `Authorization` header, with optional `Bearer `
# prefix stripped. Designed to NEVER 500 on an invalid key — bad keys return
# valid=false with a human-readable error string and the latency we still
# measured. The frontend renders this as a Sonner toast.
# ---------------------------------------------------------------------------
@app.get("/api/test-keys")
async def test_keys(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    started = time.time()

    # 1. Header presence
    if not authorization:
        return {
            "valid": False,
            "latency_ms": 0,
            "provider": "groq",
            "error": "Missing Authorization header",
        }

    # 2. Strip "Bearer " if present
    key = authorization.strip()
    if key.lower().startswith("bearer "):
        key = key[7:].strip()

    if not key:
        return {
            "valid": False,
            "latency_ms": 0,
            "provider": "groq",
            "error": "Empty API key in Authorization header",
        }

    # 3. Minimal 1-token completion against Groq
    try:
        client = Groq(api_key=key)
        # Cheapest possible call: 1 token, deterministic, no streaming.
        client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "hi"}],
            max_tokens=1,
            temperature=0,
        )
        latency_ms = int((time.time() - started) * 1000)
        logger.info("Groq key validated in %d ms", latency_ms)
        return {
            "valid": True,
            "latency_ms": latency_ms,
            "provider": "groq",
            "error": None,
        }
    except Exception as exc:  # noqa: BLE001
        latency_ms = int((time.time() - started) * 1000)
        # Don't raise — surface a structured error to the caller.
        err = str(exc) or exc.__class__.__name__
        logger.info("Groq key rejected in %d ms — %s", latency_ms, err)
        return {
            "valid": False,
            "latency_ms": latency_ms,
            "provider": "groq",
            "error": err,
        }


# ---------------------------------------------------------------------------
# Local dev entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
