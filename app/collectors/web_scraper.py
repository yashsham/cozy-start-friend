"""Public DOM scraper with SSRF protection, untrusted fencing, and offline fixture fallback."""

import ipaddress
import json
import re
from typing import List, Optional
from urllib.parse import urlparse
import bs4
import httpx

from app.collectors.base import BaseCollector, EvidenceItem, normalize_domain
from app.collectors.fixtures_cache import get_cached_fixture, get_fixture_evidence
from app.core.config import settings
from app.core.logging import logger
from app.llm.prompts import fence

PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local / AWS Metadata
]


def check_ssrf(url: str) -> None:
    """Validate that the target URL does not target loopback, private infrastructure, or invalid schemes."""
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ("http", "https"):
        raise ValueError(f"SSRF Protection: Only HTTP/HTTPS schemes are permitted, got {parsed.scheme}.")
    hostname = (parsed.hostname or "").lower()
    if not hostname:
        raise ValueError(f"Invalid URL: {url}")

    # Check if direct IP
    try:
        ip = ipaddress.ip_address(hostname)
        for net in PRIVATE_NETWORKS:
            if ip in net:
                raise ValueError(f"SSRF Protection: Outbound requests to private IP {hostname} are blocked.")
    except ValueError as e:
        if "SSRF Protection" in str(e):
            raise
        # Not an IP string, hostname is domain name (e.g. example.com)
        pass

    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "metadata.google.internal"):
        raise ValueError(f"SSRF Protection: Requests to {hostname} are blocked.")


class WebScraperCollector(BaseCollector):
    name = "web_scraper"
    category = "firmographic"

    def __init__(self, timeout: float = 5.0):
        self.timeout = timeout

    async def collect(self, target: str, **kwargs) -> List[EvidenceItem]:
        """Scrape company homepage/about page for description and technologies."""
        domain = normalize_domain(target)
        if not domain:
            return []

        fixture_items = get_fixture_evidence(domain)

        # If OFFLINE_MODE is enabled, return directly from pre-seeded fixture cache
        if settings.OFFLINE_MODE and fixture_items:
            logger.info("Offline mode active: Serving '%s' from local fixture cache.", domain)
            return fixture_items

        url = f"https://{domain}"
        try:
            check_ssrf(url)
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Harvey/1.0"})
                if resp.status_code == 200:
                    items = self._parse_html(resp.text, url, domain)
                    if items:
                        return items
        except Exception as e:
            logger.info("Web scrape failed for %s (%s). Attempting local fixture fallback.", domain, str(e))

        # Fallback to fixture if live fetch produced nothing or failed
        if fixture_items:
            return fixture_items

        return []

    def _parse_html(self, html: str, source_url: str, domain: str) -> List[EvidenceItem]:
        items: List[EvidenceItem] = []
        soup = bs4.BeautifulSoup(html, "html.parser")

        # 1. Meta Description
        meta_desc = ""
        desc_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if desc_tag and desc_tag.get("content"):
            meta_desc = desc_tag["content"].strip()
        elif soup.title and soup.title.string:
            meta_desc = soup.title.string.strip()

        if meta_desc:
            items.append(
                EvidenceItem(
                    signal_code="company_description",
                    source_name="website_dom",
                    source_url=source_url,
                    value_text=fence(meta_desc, f"website:{domain}"),
                    confidence=1.0,
                    is_inferred=False,
                )
            )

        # 2. Tech Stack Detection via script and link tags
        detected_tech = set()
        html_lower = html.lower()
        tech_indicators = {
            "react": ["react.production.min.js", "_next/", "react-dom"],
            "vue": ["vue.runtime", "nuxt"],
            "angular": ["angular.js", "ng-version"],
            "hubspot": ["js.hs-scripts.com", "hscollect"],
            "salesforce": ["salesforce.com", "pardot"],
            "stripe": ["js.stripe.com"],
            "google_analytics": ["gtag/js", "google-analytics.com"],
            "segment": ["cdn.segment.com"],
            "intercom": ["widget.intercom.io"],
        }
        for tech, patterns in tech_indicators.items():
            if any(p in html_lower for p in patterns):
                detected_tech.add(tech.capitalize())

        if detected_tech:
            items.append(
                EvidenceItem(
                    signal_code="tech_stack",
                    source_name="dom_scripts",
                    source_url=source_url,
                    value_text=fence(f"Detected technologies: {', '.join(sorted(detected_tech))}", f"dom:{domain}"),
                    confidence=0.9,
                    is_inferred=False,
                )
            )

        return items
