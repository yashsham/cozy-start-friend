"""Base Collector Interface and Evidence Data Models."""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class EvidenceItem(BaseModel):
    """An individual verified or inferred observation with full provenance tracking."""

    signal_code: str
    source_name: str
    source_url: str
    value_text: str
    value_num: Optional[float] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    is_inferred: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    retrieved_at: datetime = Field(default_factory=utc_now)


def normalize_domain(url_or_domain: str) -> str:
    """Extract and normalize domain (e.g., 'https://www.Acme.COM/about' -> 'acme.com')."""
    raw = (url_or_domain or "").strip().lower()
    if not raw:
        return ""
    if not (raw.startswith("http://") or raw.startswith("https://")):
        raw = "https://" + raw
    try:
        parsed = urlparse(raw)
        host = parsed.netloc or parsed.path
        if host.startswith("www."):
            host = host[4:]
        return host.split(":")[0].strip().lower()
    except Exception:
        return url_or_domain.strip().lower()


def normalize_company_name(name: str) -> str:
    """Normalize company name by stripping common corporate suffixes."""
    raw = (name or "").strip()
    pattern = re.compile(
        r",?\s*(?:inc|corp|corporation|ltd|limited|llc|gmbh|co|technologies|solutions)\.?$",
        re.IGNORECASE,
    )
    prev = None
    while prev != raw:
        prev = raw
        raw = pattern.sub("", raw).strip()
    return raw or (name or "").strip()


class BaseCollector(ABC):
    """Abstract base class for all public web research and evidence adapters."""

    name: str = "base"
    category: str = "general"

    @abstractmethod
    async def collect(self, target: str, **kwargs) -> List[EvidenceItem]:
        """Collect and return normalized evidence items for the target domain or entity."""
        pass
