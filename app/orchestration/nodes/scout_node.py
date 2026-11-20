"""Scout Node: Ingests prospect and initializes sales agent state."""

from datetime import datetime, timezone
from typing import Any, Dict
from app.orchestration.state import SalesAgentState


async def scout_node(state: SalesAgentState) -> Dict[str, Any]:
    """Ingest candidate lead, validate identity fields, and initialize tracking."""
    prospect = state.get("prospect") or {}
    company = state.get("company") or {}
    first_name = prospect.get("first_name") or state.get("first_name", "")
    company_name = company.get("name") or prospect.get("company") or state.get("company_name", "Company")

    logs = list(state.get("execution_logs") or [])
    logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] ScoutNode: Discovered prospect '{first_name}' at '{company_name}'.")

    has_reply = bool(state.get("inbound_reply_text"))
    return {
        "current_node": "ScoutNode",
        "execution_logs": logs,
        "is_qualified": False,
        "draft_attempts": 0,
        "gate_passed": False,
        "stop_campaign": has_reply,
    }
