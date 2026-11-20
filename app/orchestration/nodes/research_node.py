"""Research Node: Extracts public evidence, tech stack, and buying signals."""

from datetime import datetime, timezone
from typing import Any, Dict, List
from app.llm.prompts import fence
from app.orchestration.state import SalesAgentState


async def research_node(state: SalesAgentState) -> Dict[str, Any]:
    """Gather company observations, buying signals, and fence them into untrusted blocks."""
    company = state.get("company", {})
    prospect = state.get("prospect", {})
    logs = list(state.get("execution_logs", []))

    observations: List[Dict[str, Any]] = list(state.get("observations") or [])
    signals: List[Dict[str, Any]] = list(state.get("buying_signals") or [])

    # Incorporate company description as fenced evidence
    domain = company.get("domain") or company.get("website", "company.local")
    desc = company.get("description", "")
    if desc and not any(o.get("signal_code") == "company_description" for o in observations):
        observations.append({
            "signal_code": "company_description",
            "collector": "web_scraper",
            "value_text": fence(desc, f"website:{domain}"),
            "confidence": 1.0,
        })

    # Add tech stack signals if known
    tech_stack = company.get("tech_stack", [])
    if tech_stack:
        tech_summary = ", ".join(tech_stack)
        observations.append({
            "signal_code": "tech_stack",
            "collector": "profile",
            "value_text": fence(f"Detected technologies: {tech_summary}", f"dom:{domain}"),
            "confidence": 0.95,
        })

    logs.append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] ResearchNode: Enriched {len(observations)} evidence observations and {len(signals)} buying signals."
    )

    return {
        "current_node": "ResearchNode",
        "observations": observations,
        "buying_signals": signals,
        "execution_logs": logs,
    }
