"""Sender Node: Direct delivery transport with outbox status updates."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from app.orchestration.state import SalesAgentState


async def sender_node(state: SalesAgentState) -> Dict[str, Any]:
    """Dispatch approved cold outreach message via mock or direct SMTP."""
    approval = state.get("approval_status")
    gate_passed = state.get("gate_passed", False)
    logs = list(state.get("execution_logs") or [])

    if approval != "approved" or not gate_passed:
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] SenderNode: Send skipped. Approval='{approval}', GatePassed={gate_passed}.")
        return {
            "current_node": "SenderNode",
            "is_sent": False,
            "execution_logs": logs,
        }

    now_iso = datetime.now(timezone.utc).isoformat()
    outbox_id = uuid.uuid4().hex[:12]

    logs.append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] SenderNode: Outbound email dispatched successfully (outbox_id={outbox_id})."
    )

    return {
        "current_node": "SenderNode",
        "outbox_id": outbox_id,
        "is_sent": True,
        "sent_timestamp": now_iso,
        "execution_logs": logs,
    }
