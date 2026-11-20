"""Prospect Product Qualification and Buying Signal entities."""

from typing import List, Optional
from pydantic import Field
from app.models.base import BaseEntity


class ProductScore(BaseEntity):
    prospect_id: str
    product_id: str
    fit_score: float
    fit_tier: str = "medium"  # 'very_high', 'high', 'medium', 'low', 'unfit'
    fit_reasons: List[str] = Field(default_factory=list)
    affinity_rank: int = 1


class BuyingSignal(BaseEntity):
    prospect_id: Optional[str] = None
    company_id: Optional[str] = None
    signal_type: str  # 'hiring', 'tech_stack', 'funding', 'expansion'
    headline: str
    detail: str = ""
    source_url: str = ""
    confidence: float = 1.0
