# Harvey AI Sales Agent — Local-First Multi-Product AI Sales Agent

**Assignment:** EDXSO AI Engineer Intern Assignment 2  
**Repository:** [https://github.com/yashsham/cozy-start-friend.git](https://github.com/yashsham/cozy-start-friend.git)  
**Upstream Foundation:** [Sellbird v0.4.0](https://github.com/ethanplusai/harvey) (AGPL-3.0)  
**Architecture:** Zero-Paid-LLM, Air-Gapped Local-First Architecture  
**License:** GNU Affero General Public License v3.0 (AGPL-3.0)  

---

## 1. Project Overview

**Harvey AI** is an enterprise-grade, local-first autonomous sales agent engineered to discover, qualify, research, and draft personalized cold outreach for **multiple products simultaneously**, operating completely offline with **zero paid cloud LLM dependencies** (no OpenAI, Anthropic, Gemini, or Groq).

### Core Pillars:
1. **Multi-Product Catalog & Cannibalization Prevention:** Supports distinct products, each with its own Ideal Customer Profile (ICP), value propositions, and scoring rules. Evaluates leads across all products and selects the single highest-affinity offering to eliminate cannibalization.
2. **Deterministic Pre-Send Quality Gates:** Rejects unrendered merge tags (`{{first_name}}`, `[Company]`), spam clichés ("hope this email finds you well"), and overlong drafts ($> 125$ words) before dispatch.
3. **Deterministic Stop-on-Reply Guard:** Instantly halts scheduled follow-ups the millisecond an inbound reply is ingested.
4. **Air-Gap Capability & SSRF Containment:** Can run entirely disconnected from the public internet using pre-seeded local intelligence fixtures and localized dense vector embeddings (`all-MiniLM-L6-v2`).
5. **Stateful Agent Graphs:** Built on LangGraph state machines with explicit typed state, retry limits, and human-in-the-loop review interrupts.

---

## 2. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   React 18 + TypeScript UI                  │
│       Vite • Tailwind CSS • shadcn/ui • Lucide Icons        │
│       13 Connected Screens • Interactive Live Workflows      │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / JSON REST APIs (port 8000)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Core                     │
│      CORS Middleware • Pydantic v2 • Unified Exception      │
├─────────────────────────────────────────────────────────────┤
│                 LangGraph Multi-Agent Engine                │
│    Scout -> Research -> Qualify -> Writer -> Gate -> Send   │
├──────────────────────────────┬──────────────────────────────┤
│      Local AI Inference      │      Local Vector Engine     │
│  Ollama (Qwen2.5:7b-instruct)│  SentenceTransformers (384d) │
│  Outbound Cloud Leak Guard   │  SHA-256 Memoization Cache   │
├──────────────────────────────┴──────────────────────────────┤
│               Public Intelligence & Discovery               │
│   Web Scraper • ATS Collector • Overpass • Offline Fixtures │
├─────────────────────────────────────────────────────────────┤
│                  SQLite WAL Database (v17)                  │
│   products • product_icps • product_scores • business_prof  │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide React, React Router 6 |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, `pydantic-settings` |
| **Agent Orchestration** | LangGraph `StateGraph`, TypedDict State, Conditional Edge Routing |
| **Local LLM** | Ollama daemon (`http://127.0.0.1:11434`), `qwen2.5:7b-instruct` / `qwen2.5:3b` |
| **Dense Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors) |
| **Persistence** | SQLite in WAL mode (`aiosqlite`), 17 migration stages, ACID transactions |
| **Public Research** | BeautifulSoup4, OpenStreetMap Overpass API, Public ATS feed parser |

---

## 3. Quick Start Guide

### 3.1 Prerequisites
- Python 3.10+ (tested on Python 3.11 and 3.13)
- Node.js 18+ and npm
- [Ollama](https://ollama.ai) (optional for offline fixture demo, recommended for live LLM text generation)

### 3.2 Backend Setup
```bash
# 1. Clone repository
git clone https://github.com/yashsham/cozy-start-friend.git
cd cozy-start-friend

# 2. Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Pull local LLM model (optional for full live inference)
ollama pull qwen2.5:7b

# 5. Boot backend with automatic pre-flight checks
python scripts/start_backend.py
```
Backend will be available at:
- **API Base:** `http://localhost:8000/api/v1`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/api/v1/health`

### 3.3 Frontend Setup
```bash
# In the repository root:
npm install
npm run dev
```
Frontend will be running at `http://localhost:8080/`.

---

## 4. Running Automated Tests & Acceptance Protocol

### 4.1 Full Automated Pytest Suite (45/45 Passing)
```bash
python -m pytest tests/ -v
```

### 4.2 Standalone Offline Acceptance Protocol
Executes the primary 7-step user journey completely offline without internet or cloud APIs:
```bash
python scripts/run_offline_acceptance_test.py
```
**Verification Output:**
```
===========================================================================
  HARVEY AI SALES AGENT — OFFLINE ACCEPTANCE PROTOCOL
  EDXSO AI Engineer Intern Assignment 2 Verification
===========================================================================
[1/7] Testing Outbound Cloud Leak Guard...
  [PASS] All paid cloud AI domains strictly intercepted and blocked.
[2/7] Initializing Isolated SQLite WAL Database...
  [PASS] Applied all 17 migrations successfully (Current schema version: v17).
[3/7] Seeding Multi-Product Catalog and ICPs...
  [PASS] Created 2 products ('CloudGuard AI', 'SignalFlow Data') and target prospect.
[4/7] Harvesting Evidence via Web Collector (Offline Fixture Mode)...
  [PASS] Harvested 3 verified evidence items with strict <untrusted> fencing.
[5/7] Computing Local Dense Vector Embeddings (SentenceTransformers)...
  [PASS] Multi-product qualification correctly selected 'CloudGuard AI' as highest fit.
[6/7] Generating Cold Email Copy & Enforcing Pre-Send Quality Gate...
  [PASS] Draft complies with word count, merge tag safety, and tone rules.
[7/7] Simulating Inbound Prospect Reply & Triggering Stop-on-Reply Guard...
  [PASS] Deterministic Stop-on-Reply Guard immediately halted outreach queue.
===========================================================================
  ALL 7 ACCEPTANCE PROTOCOLS COMPLETED SUCCESSFULLY (100% PASS)
===========================================================================
```

---

## 5. Configuration & Environment Variables

All settings are configured via `.env` with safe zero-paid defaults:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `Harvey AI Sales Agent` | Application title |
| `HOST` | `0.0.0.0` | API bind address |
| `PORT` | `8000` | API bind port |
| `DB_PATH` | `./data/sellbird.db` | SQLite WAL persistence path |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Local Ollama daemon socket |
| `OLLAMA_MODEL` | `qwen2.5:7b-instruct` | Local LLM model tag |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Local SentenceTransformers model |
| `OFFLINE_MODE` | `false` | Enable strict air-gap fixture operation |
| `EMAIL_MAX_WORDS`| `125` | Deterministic quality gate word ceiling |
| `MOCK_SMTP` | `true` | Mock email delivery for safe evaluation |

---

## 6. Project Documentation Index

- `docs/REPOSITORY_AUDIT.md`: Upstream Sellbird v0.4.0 static audit.
- `docs/REQUIREMENTS_TRACEABILITY.md`: 27-point requirement trace matrix.
- `docs/SYSTEM_ARCHITECTURE.md`: Technical architecture and LangGraph design.
- `docs/FINAL_ARCHITECTURE.md`: Final as-built architecture specifications.
- `docs/DATABASE.md`: SQLite WAL schema dictionary and migration ledger (v1-v17).
- `docs/LOCAL_AI_SETUP.md`: Local Ollama and embedding configuration guide.
- `docs/LANGGRAPH_WORKFLOWS.md`: Agent state machine and node definitions.
- `docs/RESEARCH_AND_EVIDENCE.md`: Public scraper architecture, SSRF, and fixtures.
- `docs/API_CONTRACT.md`: Complete OpenAPI / REST contract specification.
- `docs/PAGE_INTEGRATION_CHECKLIST.md`: 13 UI screens mapped to backend APIs.
- `docs/TESTING_AND_SECURITY.md`: Test execution, security audit, and performance analysis.
- `docs/DEMO_GUIDE.md`: Step-by-step evaluator demo guide.
- `docs/KNOWN_LIMITATIONS.md`: Engineering assessment of local model constraints.
- `docs/FINAL_VERIFICATION_REPORT.md`: Comprehensive verification report.
- `docs/ASSIGNMENT_COMPLIANCE_REPORT.md`: Line-by-line compliance against EDXSO Assignment 2.
- `docs/DEMO_SCRIPT.md`: Exact walkthrough script for presentation.
- `docs/FINAL_SUBMISSION_CHECKLIST.md`: Submission checklist.

---

## 7. License & Attribution

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**, preserving upstream Sellbird licensing obligations. See [LICENSE](LICENSE) for details.
