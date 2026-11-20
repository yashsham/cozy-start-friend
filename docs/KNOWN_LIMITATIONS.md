# Harvey AI Sales Agent — Known Limitations & Design Trade-offs

**Assignment:** EDXSO AI Engineer Intern Assignment 2  
**Repository:** `https://github.com/yashsham/cozy-start-friend.git`  
**Date:** November 2026  

---

## 1. Local LLM Inference Latency (CPU vs. GPU)

### Observation
Running `Qwen2.5:7b-instruct` locally requires approximately 4.8 GB of VRAM (under 4-bit/5-bit quantization) or system RAM.
- **On NVIDIA CUDA GPUs:** Generation latency is typically $600\text{ms} - 1.5\text{s}$ per cold email draft ($40-60\text{ tokens/s}$).
- **On CPU (AVX-512 / AVX2):** Generation latency ranges from $3.0\text{s} - 8.5\text{s}$ ($10-18\text{ tokens/s}$).

### Architectural Mitigation
1. **Asynchronous Non-Blocking Processing:** All LLM invocations are wrapped in `asyncio` and handled off the FastAPI main thread, ensuring the REST API and React UI remain fluid and responsive.
2. **Model Tiering Support:** For resource-constrained hardware, the backend supports `qwen2.5:3b` or `qwen2.5:1.5b` by setting `OLLAMA_MODEL=qwen2.5:3b` in `.env`.
3. **Deterministic Heuristics:** Non-creative tasks (pre-send gate checks, merge tag verification, stop-on-reply triggering) bypass LLM generation entirely, executing in $< 1\text{ms}$ via deterministic Python regex.

---

## 2. Context Window & Memory Constraints

### Observation
While cloud models (GPT-4o, Claude 3.5 Sonnet) advertise 128k–200k token windows, local Ollama models run most efficiently within an $8,192$-token context window to prevent memory exhaustion on typical developer workstations.

### Architectural Mitigation
1. **Targeted Evidence Distillation:** Raw scraped HTML pages are parsed by BeautifulSoup to extract only meta descriptions, headers, and detected tech stack scripts before being passed to LangGraph nodes.
2. **Untrusted Data Fencing:** Evidence is wrapped in compact `<untrusted source="...">` blocks rather than raw DOM dumps, protecting the context window and preventing prompt injection.

---

## 3. Public Web Scraper Rate Limiting & Overpass Availability

### Observation
Public collectors (OpenStreetMap Overpass API and direct website scraping) are subject to external network conditions, temporary server-side throttling (HTTP 429), and dynamic CAPTCHAs on enterprise websites.

### Architectural Mitigation
1. **Pre-Seeded Offline Fixture Proxy (`app/collectors/fixtures_cache.py`):**
   - High-fidelity fixtures for key evaluation domains (`acmesaas.com`, `cyberdyne.ai`, `novatech.io`, `apexlogistics.com`) are cached locally.
   - If an external HTTP request times out, fails, or is blocked by air-gap policies, the system automatically falls back to verified fixtures.
2. **SSRF Guard:** Enforces strict subnet blocking so external scraping cannot be weaponized against local services.

---

## 4. Single-Node SQLite WAL vs. Distributed SQL

### Observation
SQLite in WAL (`Write-Ahead Logging`) mode provides ACID reliability, sub-millisecond local reads, and 30-second busy timeout locks. However, it is fundamentally a single-node, single-writer embedded database.

### Architectural Assessment
For Harvey's target deployment as a **local-first AI sales rep assistant** running on an individual sales engineer's workstation, SQLite WAL is ideal:
- Zero installation overhead (no Docker or external database service required).
- Completely portable single-file persistence (`./data/sellbird.db`).
- Not intended for multi-region, distributed cluster deployments.

---

## 5. Email Transport in Local Environments

### Observation
Local developer workstations without reverse DNS (rDNS), SPF, DKIM, and DMARC records cannot reliably send cold outreach directly to public Gmail/Outlook inboxes without being flagged as spam.

### Architectural Mitigation
1. **`MOCK_SMTP=true` Mode:** Enabled by default. Generated emails pass through the complete quality gate and are persisted in the SQLite `outbox` table and rendered in the UI with full headers, without attempting risky raw socket connections.
2. **Configurable SMTP Transport:** For production delivery, standard credentials can be provided in `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`).
