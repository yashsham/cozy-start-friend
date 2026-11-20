"""Qualify Node: Evaluates multi-product fit scores and routes to the best product."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.embeddings.local_embeddings import local_embedding_service
from app.orchestration.state import SalesAgentState


async def qualify_node(state: SalesAgentState) -> Dict[str, Any]:
    """Score prospect against all active products; select highest-affinity product."""
    prospect = state.get("prospect", {})
    company = state.get("company", {})
    active_products = state.get("active_products") or []
    logs = list(state.get("execution_logs") or [])

    if not active_products:
        logs.append(f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] QualifyNode: No active products available. Lead disqualified.")
        return {
            "current_node": "QualifyNode",
            "is_qualified": False,
            "fit_score": 0.0,
            "fit_tier": "unfit",
            "execution_logs": logs,
        }

    # Construct prospect profile text for embedding matching
    prospect_profile = (
        f"Title: {prospect.get('title', '')}. "
        f"Company: {company.get('name', prospect.get('company', ''))}. "
        f"Industry: {company.get('industry', prospect.get('industry', ''))}. "
        f"Description: {company.get('description', '')}"
    )

    product_scores: Dict[str, Dict[str, Any]] = {}
    best_product: Optional[Dict[str, Any]] = None
    best_score = -1.0

    for prod in active_products:
        prod_id = prod.get("id", "")
        prod_text = (
            f"Product: {prod.get('name', '')}. "
            f"Value Prop: {prod.get('value_proposition', '')}. "
            f"Target Industries: {', '.join(prod.get('target_industries', []))}. "
            f"Description: {prod.get('description', '')}"
        )

        # Compute semantic cosine similarity locally
        sim = local_embedding_service.compute_similarity(prospect_profile, prod_text)
        # Scale to 0-100 base score
        score = round(max(30.0, sim * 100.0), 1)

        # Rule bonuses: Industry alignment
        target_industries = [i.lower() for i in prod.get("target_industries", [])]
        prospect_industry = (company.get("industry") or prospect.get("industry") or "").lower()
        if any(ind in prospect_industry for ind in target_industries):
            score = min(100.0, score + 15.0)

        # Title alignment bonus
        target_roles = ["founder", "cto", "ceo", "vp", "director", "head"]
        prospect_title = (prospect.get("title") or "").lower()
        if any(role in prospect_title for role in target_roles):
            score = min(100.0, score + 10.0)

        # Determine tier
        if score >= 80.0:
            tier = "very_high"
        elif score >= 65.0:
            tier = "high"
        elif score >= 50.0:
            tier = "medium"
        else:
            tier = "low"

        product_scores[prod_id] = {
            "product_name": prod.get("name"),
            "fit_score": score,
            "fit_tier": tier,
        }

        if score > best_score:
            best_score = score
            best_product = prod

    is_qualified = best_score >= 55.0
    tier = product_scores.get(best_product.get("id", ""), {}).get("fit_tier", "medium") if best_product else "unfit"

    logs.append(
        f"[{datetime.now(timezone.utc).strftime('%H:%M:%S')}] QualifyNode: Best product '{best_product.get('name') if best_product else 'None'}' "
        f"matched with score {best_score} ({tier}). Qualified: {is_qualified}"
    )

    problem_statement = (
        f"Prospect at {company.get('name', 'their firm')} needs to streamline operations "
        f"using {best_product.get('name', 'our platform')} to capture ROI."
        if best_product
        else ""
    )

    return {
        "current_node": "QualifyNode",
        "product_scores": product_scores,
        "selected_product_id": best_product.get("id") if best_product else None,
        "selected_product": best_product,
        "fit_score": best_score,
        "fit_tier": tier,
        "is_qualified": is_qualified,
        "problem_statement": problem_statement,
        "execution_logs": logs,
    }
