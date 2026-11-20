"""Product and ICP request/response validation schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    slug: str = Field(..., min_length=1, max_length=60)
    tagline: Optional[str] = ""
    description: str = Field(..., min_length=5)
    value_proposition: str = Field(..., min_length=5)
    pricing_tier: str = Field(default="Pro")
    target_industries: List[str] = Field(default_factory=list)
    key_features: List[str] = Field(default_factory=list)
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    value_proposition: Optional[str] = None
    pricing_tier: Optional[str] = None
    target_industries: Optional[List[str]] = None
    key_features: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ProductResponse(ProductBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductICPBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    target_roles: List[str] = Field(default_factory=list)
    target_company_sizes: List[str] = Field(default_factory=list)
    target_industries: List[str] = Field(default_factory=list)
    key_pain_points: List[str] = Field(default_factory=list)
    qualification_rules: List[str] = Field(default_factory=list)
    min_fit_score: float = Field(default=65.0, ge=0.0, le=100.0)


class ProductICPCreate(ProductICPBase):
    product_id: str


class ProductICPUpdate(BaseModel):
    title: Optional[str] = None
    target_roles: Optional[List[str]] = None
    target_company_sizes: Optional[List[str]] = None
    target_industries: Optional[List[str]] = None
    key_pain_points: Optional[List[str]] = None
    qualification_rules: Optional[List[str]] = None
    min_fit_score: Optional[float] = None


class ProductICPResponse(ProductICPBase):
    id: str
    product_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
