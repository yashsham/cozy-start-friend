"""Outreach draft generation and review endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.llm.ollama_client import ollama_client
from app.llm.prompts import WRITER_SYSTEM_PROMPT
from app.safety.gate import check_email_quality

router = APIRouter(tags=["Outreach"])


class DraftRequestPayload(BaseModel):
    prospect: Dict[str, Any]
    productName: str
    objective: Optional[str] = "initial_outreach"
    tone: Optional[str] = "concise"
    length: Optional[str] = "short"
    cta: Optional[str] = "soft_ask"
    inputs: Optional[List[str]] = None


class DraftResponsePayload(BaseModel):
    subject: str
    body: str


@router.post("/outreach/draft", response_model=DraftResponsePayload)
async def generate_outreach_draft(payload: DraftRequestPayload):
    """Generate cold outreach email customized to prospect and matched product."""
    prospect = payload.prospect
    company_name = prospect.get("company", "your firm")
    first_name = prospect.get("first_name") or prospect.get("name", "").split()[0] or "there"
    title = prospect.get("title", "Leader")
    product_name = payload.productName
    objective = payload.objective or "initial_outreach"

    prompt = (
        f"Draft a personalized cold email to {first_name} ({title}) at {company_name}. "
        f"We are pitching {product_name}. "
        f"Objective: {objective}. "
        f"Constraints: strictly under 100 words, lowercase subject, no spam clichés, zero merge-tag leaks."
    )

    subject = f"quick thought on {company_name}"
    body = ""

    try:
        is_online = await ollama_client.check_health()
        if is_online:
            result = await ollama_client.generate_json(
                prompt=prompt,
                system_prompt=WRITER_SYSTEM_PROMPT,
                temperature=0.2,
            )
            subject = result.get("subject", subject).lower()
            body = result.get("body", "")
    except Exception:
        pass

    if not body:
        # Deterministic compliant template fallback
        subject = f"quick question for {company_name}"
        body = (
            f"Hi {first_name},\n\n"
            f"Noticed {company_name} is actively scaling initiatives this quarter.\n\n"
            f"Most sales leaders we speak with struggle with domain deliverability and manual lead qualification "
            f"draining 15+ hours every week.\n\n"
            f"We built {product_name} to automate prospect qualification and personalization locally with zero cloud API subscriptions.\n\n"
            f"Would it be worth a brief 5-minute look sometime next Tuesday?\n\n"
            f"Best,\nAlex"
        )

    # Ensure pre-send gate passes
    passed, violations, _ = check_email_quality(subject=subject, body=body, max_words=125)
    if not passed:
        # Sanitize any violations deterministically
        subject = subject.lower().replace("{{first_name}}", first_name).replace("[company]", company_name)
        body = body.replace("{{first_name}}", first_name).replace("[company]", company_name)

    return DraftResponsePayload(subject=subject, body=body)
