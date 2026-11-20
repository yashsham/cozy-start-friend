"""Reply Handler Node: Ingests inbound emails and triggers Stop-on-Reply guard."""

from datetime import datetime, timezone
from typing import Any, Dict
from app.llm.ollama_client import ollama_client
from app.llm.prompts import REPLY_ANALYSIS_SYSTEM_PROMPT, fence
from app.orchestration.state import SalesAgentState


async def reply_node(state: SalesAgentState) -> Dict[str, Any]:
    """Analyze inbound reply, classify intent, and enforce deterministic Stop-on-Reply guard."""
    reply_text = state.get("inbound_reply_text")
    logs = list(state.get("execution_logs") or [])

    if not reply_text:
        return {
            "current_node": "ReplyHandlerNode",
            "reply_intent": None,
            "stop_campaign": False,
        }

    # Deterministic stop: ANY inbound message stops automated cadence immediately
    stop_campaign = True
    intent = "positive"

    # Analyze intent
    fenced_reply = fence(reply_text, "inbound_email")
    try:
        is_online = await ollama_client.check_health()
        if is_online:
            classification = await ollama_client.generate_json(
                prompt=f"Classify this email reply:\n{fenced_reply}",
                system_prompt=REPLY_ANALYSIS_SYSTEM_PROMPT,
            )
            intent = classification.get("intent", "positive")
        else:
            # Deterministic heuristic intent classification
            lower = reply_text.lower()
            if any(w in lower for w in ["unsubscribe", "remove me", "stop", "opt out"]):
                intent = "unsubscribe"
            elif any(w in lower for w in ["busy", "not now", "bad timing", "competitor", "expensive"]):
                intent = "objection"
            elif any(w in lower for w in ["out of office", "autoreply", "vacation"]):
                intent = "out_of_office"
            else:
                intent = "positive"
    except Exception as e:
        logger_msg = f"Intent classification heuristic used: {str(e)}"
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] ReplyHandlerNode note: {logger_msg}")

    logs.append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] ReplyHandlerNode: Inbound reply classified as '{intent}'. "
        f"STOP-ON-REPLY GUARD TRIGGERED: All scheduled follow-up steps cancelled."
    )

    return {
        "current_node": "ReplyHandlerNode",
        "reply_intent": intent,
        "inbound_reply_intent": intent,
        "stop_campaign": stop_campaign,
        "execution_logs": logs,
    }
