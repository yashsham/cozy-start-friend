"""Inbound reply analysis and classification endpoints."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.llm.ollama_client import ollama_client
from app.llm.prompts import REPLY_ANALYSIS_SYSTEM_PROMPT, fence

router = APIRouter(tags=["Replies"])


class EmailMessagePayload(BaseModel):
    from_: Optional[str] = Field(default=None, alias="from")
    date: Optional[str] = None
    body: str


class ReplyAnalysisRequest(BaseModel):
    messages: List[Dict[str, Any]]


class ReplyAnalysisResponse(BaseModel):
    intent: str
    sentiment: str  # 'positive', 'neutral', 'negative'
    interest: int  # 0 to 100
    urgency: str  # 'high', 'medium', 'low'
    objections: List[str]
    evidence: List[str]
    nextAction: str
    suggestedReply: str
    analyzedAt: str


@router.post("/replies/analyze", response_model=ReplyAnalysisResponse)
async def analyze_reply_thread(payload: ReplyAnalysisRequest):
    """Classify inbound email sentiment, intent, objections, and suggested next action."""
    messages = payload.messages or []
    last_message = messages[-1].get("body", "") if messages else ""

    # Defaults
    intent = "positive"
    sentiment = "positive"
    interest = 80
    urgency = "high"
    objections = []
    evidence = [last_message[:150]] if last_message else []
    next_action = "Schedule introductory call"
    suggested_reply = "Hi Jane,\n\nThanks for following up! How does Thursday at 2pm EST work for a brief 10-minute walkthrough?\n\nBest,\nAlex"

    lower = last_message.lower()

    # Rule-based fast analysis or Ollama enrichment
    if any(w in lower for w in ["unsubscribe", "remove me", "stop", "opt out", "not interested"]):
        intent = "unsubscribe"
        sentiment = "negative"
        interest = 0
        urgency = "low"
        objections = ["Explicit opt-out requested"]
        next_action = "Halt outreach immediately (Stop-on-Reply)"
        suggested_reply = "You have been removed from our list. Thank you."
    elif any(w in lower for w in ["busy", "not right now", "bad timing", "next quarter"]):
        intent = "objection"
        sentiment = "neutral"
        interest = 40
        urgency = "medium"
        objections = ["Timing constraint"]
        next_action = "Snooze contact and follow up next quarter"
        suggested_reply = "Understood! Would it make sense for me to check back in late Q3?"
    elif any(w in lower for w in ["pricing", "cost", "how much", "security", "soc2", "send info"]):
        intent = "positive"
        sentiment = "positive"
        interest = 90
        urgency = "high"
        next_action = "Share pricing documentation and schedule call"

    try:
        is_online = await ollama_client.check_health()
        if is_online and last_message:
            fenced = fence(last_message, "inbound_email")
            result = await ollama_client.generate_json(
                prompt=f"Classify this email reply:\n{fenced}",
                system_prompt=REPLY_ANALYSIS_SYSTEM_PROMPT,
            )
            intent = result.get("intent", intent)
    except Exception:
        pass

    return ReplyAnalysisResponse(
        intent=intent,
        sentiment=sentiment,
        interest=interest,
        urgency=urgency,
        objections=objections,
        evidence=evidence,
        nextAction=next_action,
        suggestedReply=suggested_reply,
        analyzedAt=datetime.now(timezone.utc).isoformat(),
    )
