"""Company, Prospect, and Research Observation domain entities."""

from typing import List, Optional
from pydantic import Field
from app.models.base import BaseEntity


class Company(BaseEntity):
    name: str = ""
    domain: str = ""
    website: str = ""
    description: str = ""
    industry: str = ""
    company_size: str = ""
    location: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    signals: List[str] = Field(default_factory=list)
    external_id: str = ""
    phone: str = ""


class Prospect(BaseEntity):
    company_id: Optional[str] = None
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    email_status: str = "new"  # 'new', 'verified', 'risky', 'guess', 'invalid'
    phone: str = ""
    linkedin_url: str = ""
    title: str = ""
    seniority: str = ""
    department: str = ""
    status: str = "new"  # 'new', 'researched', 'qualified', 'drafted', 'contacted', 'replied'
    score: int = 0
    personalization_notes: str = ""
    company: str = ""
    industry: str = ""
    company_size: str = ""
    timezone: str = ""


class Observation(BaseEntity):
    company_id: str = ""
    prospect_id: str = ""
    signal_code: str
    collector: str = ""
    value_num: Optional[float] = None
    value_text: str = ""
    confidence: float = 1.0
    evidence_url: str = ""
    run_id: str = ""
