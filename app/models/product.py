"""Product and Ideal Customer Profile (ICP) domain entities."""

from typing import List, Optional
from pydantic import Field
from app.models.base import BaseEntity


class Product(BaseEntity):
    name: str
    slug: str
    tagline: str = ""
    description: str
    value_proposition: str
    pricing_tier: str = "Pro"  # 'Free', 'Pro', 'Enterprise'
    target_industries: List[str] = Field(default_factory=list)
    key_features: List[str] = Field(default_factory=list)
    is_active: bool = True


class ProductICP(BaseEntity):
    product_id: str
    title: str
    target_roles: List[str] = Field(default_factory=list)
    target_company_sizes: List[str] = Field(default_factory=list)
    target_industries: List[str] = Field(default_factory=list)
    key_pain_points: List[str] = Field(default_factory=list)
    qualification_rules: List[str] = Field(default_factory=list)
    min_fit_score: float = 65.0
