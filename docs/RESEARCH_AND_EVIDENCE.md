# Harvey AI Sales Agent — Research, Retrieval & Evidence Quality
**System:** Harvey AI Sales Agent  
**Assignment:** EDXSO AI Engineer Intern Assignment 2  
**Constraint:** Zero Paid Data APIs | Full Offline Air-Gap Support  
**Layer:** Intelligence & Observation Persistence  

---

## 1. Research Architecture & Provenance Model

Harvey AI incorporates a multi-source, zero-paid intelligence gathering layer that enforces strict provenance, deduplication, and untrusted data sanitization:

```mermaid
flowchart TD
    Target[Target Company Domain / Name] --> Router{Offline Mode?}
    
    Router -->|Yes (Air-Gap)| Cache[Pre-Seeded Fixture Cache]
    Router -->|No (Live)| Scrapers[Live Scraper Layer]

    subgraph Scrapers [Permitted Zero-Cost Collectors]
        DOM[BeautifulSoup4 DOM Scraper]
        ATS[Public ATS Feeds (Greenhouse/Lever)]
        OSM[OpenStreetMap Overpass Discovery]
    end

    DOM --> SSRF{SSRF Guard}
    SSRF -->|Public IP Allowed| Fetch[HTTP Fetch & Extract]
    SSRF -->|Private/Loopback Blocked| Reject[Abort with SSRF Violation]

    Fetch --> Fencer[<untrusted> XML Fencer]
    Cache --> Fencer

    Fencer --> Dedup[Provenance & Signal Deduplicator]
    Dedup --> DB[(SQLite: observations & signal_codes)]
```

---

## 2. Permitted Research Sources

1. **Website DOM Scraper (`WebScraperCollector`)**:
   - Parses public landing and about pages.
   - Extracts page titles, meta descriptions, and OpenGraph tags.
   - Detects front-end frameworks, marketing widgets, and analytics tags (React, HubSpot, Stripe, Salesforce, Google Analytics).
2. **Public ATS Job Feeds (`ATSCollector`)**:
   - Analyzes publicly accessible job boards (e.g. Greenhouse, Lever, Ashby) to detect expansion signals (e.g., hiring 3+ Outbound SDRs or RevOps leads).
3. **OpenStreetMap Overpass (`OverpassCollector`)**:
   - Queries OpenStreetMap geographic and company nodes by industry tag and city/region with zero paid API tokens.

---

## 3. Security: SSRF & Prompt Injection Mitigation

### 3.1 SSRF Defense (`check_ssrf`)
Outbound HTTP requests are strictly validated before execution:
- Blocks requests targeting loopback addresses (`127.0.0.1`, `localhost`).
- Blocks RFC 1918 private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- Blocks AWS/GCP cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`).

### 3.2 Prompt Injection Neutralization (`fence`)
All extracted text from public websites is wrapped in:
```xml
<untrusted source="website:acmesaas.com">
[Extracted company text]
</untrusted>
```
Characters are normalized via NFKC, hidden zero-width characters are stripped, and closing `</untrusted>` lookalikes are neutralized.

---

## 4. Offline Fixture Cache for Air-Gap Verification

To fulfill the **Offline Acceptance Test**, Harvey AI includes pre-seeded high-fidelity fixtures in `app/collectors/fixtures_cache.py`:
- `cyberdyne.ai` (AI, PyTorch, Kubernetes, $50M Series B)
- `acmesaas.com` (B2B SaaS, RevOps, HubSpot, Stripe, hiring 3 SDRs)
- `novatech.io` (Cloud infrastructure, AWS, Terraform)
- `apexlogistics.com` (Supply chain, SAP, TMS)

When `OFFLINE_MODE=true` or when network connectivity is lost, collectors automatically load from the offline cache, guaranteeing that the sales agent workflows execute seamlessly without network access.
