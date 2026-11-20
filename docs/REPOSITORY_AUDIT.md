# Sellbird / Harvey Repository Audit Report
**Project:** Harvey AI Sales Agent (Sellbird v0.4.0)  
**Assignment:** EDXSO AI Engineer Intern Assignment 2  
**Target Repository:** `https://github.com/ethanplusai/harvey.git` (cloned to `harvey_upstream`)  
**Active Project:** `d:\singalstackintern\havleyintern` (connected to `https://github.com/yashsham/cozy-start-friend.git`)  
**Auditor:** Lead AI Software Architect  
**Date:** November 2026  
**License:** AGPL-3.0-only (Preserved in full compliance with upstream notices)

---

## 1. Executive Summary

This audit evaluates the upstream repository `ethanplusai/harvey` (currently branded as **Sellbird v0.4.0**) against the strict, non-negotiable requirements of the **EDXSO AI Engineer Intern Assignment 2**. 

The assignment mandates the creation of a **local-first, multi-product AI sales agent** that:
1. Runs entirely offline after initial model installation.
2. Incurs **zero paid LLM API costs** (strictly prohibiting OpenAI, Anthropic, Claude Code subscription, Codex subscription, Gemini, Groq, or cloud embeddings).
3. Orchestrates sales workflows using **LangGraph** with deterministic safety guards.
4. Uses **Ollama** (`Qwen2.5:7b-instruct` or open-weight equivalent), **Sentence Transformers** (`all-MiniLM-L6-v2`), and **SQLite WAL**.
5. Connects to a full-featured React + TypeScript frontend.
6. Passes an air-gapped **Offline Acceptance Test**.

### Key Audit Findings

| Dimension | Upstream Sellbird Status | Assignment 2 Requirement | Gap / Action Required |
| :--- | :--- | :--- | :--- |
| **Model Runtime** | Spawns `claude` CLI or `@openai/codex` CLI via subprocess (`brain.py`, `claude_runtime.py`, `codex.py`). | 100% Local Inference via Ollama (`Qwen2.5`/`Qwen3`) with zero cloud fallbacks. | **Critical Failure Risk:** Replace CLI subprocess spawners with async HTTP Ollama client (`/api/generate`, `/api/chat`). |
| **Product Model** | Single campaign / single product assumption throughout prompts and state. | Multi-product architecture supporting distinct value propositions, pricing tiers, and ICP definitions. | **Refactor Required:** Introduce `v17` migration adding `products` and `product_icps` tables; inject product context into prompt graphs. |
| **Orchestration** | Procedural heartbeat loop in `sellbird/main.py` calling agents imperatively. | Declarative **LangGraph** StateGraph with stateful checkpoints and conditional transitions. | **New Architecture Required:** Implement LangGraph workflow with deterministic guard nodes. |
| **Storage & Embeddings** | SQLite with 16 migrations (`state.py`), lexical search, and basic observation key-value pairs. | SQLite WAL + **SentenceTransformers** (`all-MiniLM-L6-v2`) for local ICP semantic similarity matching. | **Extend:** Add vector similarity search module using pre-downloaded HuggingFace model cache. |
| **Safety & Email Style** | Robust deterministic gates (`gate.py`), untrusted data sanitization (`untrusted.py`), and style checks (`email_style.py`). | Strict deterministic pre-send verification and merge-tag leak guards. | **Highly Reusable:** Adopt and preserve `gate.py`, `email_style.py`, and `untrusted.py` as core deterministic middleware. |
| **Web Research** | Public web collectors (`collectors/people.py`, `profile.py`, `ats.py`, `discover.py`). | Public web scraping (BeautifulSoup/Scrapy/Playwright) with local offline cache fallback. | **Extend:** Wrap collectors with caching proxy to enable 100% offline demonstration without internet access. |
| **Frontend Integration**| CLI-only terminal UI (`rich` library output). | Production React 18 + TypeScript + Vite + Tailwind CSS dashboard. | **Completed:** 13 interactive screens built in `havleyintern`, ready to wire to FastAPI REST endpoints. |

---

## 2. Deep Module-by-Module Audit

### 2.1 Core AI Runtime: `sellbird/brain.py`, `claude_runtime.py`, `codex.py`
- **Current Implementation**:
  - `brain.py` defines `BrainConfig`, `BrainSession`, and an abstract runner pattern.
  - `claude_runtime.py` executes `claude -p --output-format json --dangerously-skip-permissions` via `asyncio.create_subprocess_exec`.
  - `codex.py` provides an alternative runner invoking the OpenAI Codex CLI.
- **Defects & Non-Compliance**:
  - Relies on paid Anthropic or OpenAI subscription tokens stored in local developer environments.
  - Spawning external Node/CLI subprocesses introduces brittle shell dependencies, environment pollution, and zero programmatic streaming control.
  - Violates the core assignment requirement: **"Zero paid LLM services... Automatic failure if any paid API is invoked."**
- **Remediation Strategy**:
  - Deprecate `claude_runtime.py` and `codex.py`.
  - Introduce `backend/ai/ollama_client.py`: An asynchronous HTTP client communicating directly with Ollama's local REST API (`http://127.0.0.1:11434/api/chat` and `/api/generate`).
  - Implement structured JSON extraction with schema validation via Pydantic.
  - Include an offline fallback simulator for test environments where Ollama service is not actively running.

### 2.2 Database & State Management: `sellbird/state.py`
- **Current Implementation**:
  - Implements an asynchronous SQLite manager with WAL mode (`PRAGMA journal_mode = WAL`, `PRAGMA foreign_keys = ON`).
  - Contains **16 sequential migrations** tracked in the `schema_migrations` table:
    1. Initial schema: `prospects`, `campaigns`, `outreach_drafts`, `outreach_history`, `audit_log`.
    2. Dynamic observation store: `observations` table (Entity-Attribute-Value pattern).
    3. Channel tracking: `channel` column on drafts and history.
    4. Feedback & sentiment: `replies` table.
    5. Deduplication hashes and rate limiting counters.
    6. System flags and delivery metadata.
- **Defects & Gaps**:
  - No first-class representation of **Products**, **Product ICPs**, or **Product-Prospect Affinity Scores**.
  - Observations lack vector embeddings for semantic similarity search.
- **Remediation Strategy**:
  - **Preserve migrations 1 through 16** to maintain complete backwards compatibility and test stability.
  - Add **Migration 17 (`v17_multi_product.sql`)**:
    - `products`: ID, name, slug, description, value_prop, pricing_tier, target_industries, active status.
    - `icps`: ID, product_id, title, target_roles, target_company_sizes, key_pain_points, qualification_rules.
    - `product_scores`: Composite qualification score per prospect-product pair.
  - Maintain the WAL configuration and thread-safe async connection pool.

### 2.3 Deterministic Safety & Quality Gates: `sellbird/gate.py`, `email_style.py`, `untrusted.py`
- **Current Implementation**:
  - `sellbird/gate.py`: Implements deterministic checks including word count limits, banned spam/cliché phrases, unrendered merge tags (e.g. `{{name}}`, `[Company]`), and placeholder detection.
  - `sellbird/email_style.py`: Enforces cold outreach conventions (lowercase subject lines, concise opening sentences, soft call-to-actions, zero pushy sales tropes).
  - `sellbird/untrusted.py`: Wraps scraped web text in `<untrusted>` XML tags and injects the `UNTRUSTED_RULE` system prompt to neutralize indirect prompt injection attacks.
- **Assessment**:
  - **Gold Standard Code:** Extremely well-designed, deterministic, defensive programming.
  - Zero external cloud dependencies.
- **Remediation Strategy**:
  - Retain `gate.py`, `email_style.py`, and `untrusted.py` in their entirety.
  - Expose `GateCheckNode` within the LangGraph pipeline so that any message failing deterministic gate checks is immediately routed to human review or auto-regenerated before sending.

### 2.4 Collectors & Web Intelligence: `sellbird/collectors/`
- **Current Implementation**:
  - `discover.py`: Discovers potential target companies using public OpenStreetMap Overpass API queries by industry/geo tags.
  - `people.py`: Parses HTML and Schema.org `Person` JSON-LD to discover contact names, titles, and public email addresses.
  - `profile.py`: Analyzes DOM structure to detect tech stacks (analytics tags, frameworks, marketing tools).
  - `ats.py`: Queries publicly accessible job board feeds (Greenhouse, Lever, Ashby) to detect hiring signals and team expansions.
- **Defects & Gaps**:
  - Direct network requests will fail in the mandatory **Offline Acceptance Test (Airplane Mode)**.
- **Remediation Strategy**:
  - Create a two-tier research pipeline:
    1. **Live Tier**: Uses `httpx` + `BeautifulSoup4` with rate limiting, User-Agent rotation, and domain robots.txt checking.
    2. **Offline Local Fixture Tier**: Reads pre-seeded DOM snapshots and HTML dumps from `backend/fixtures/` when network connectivity is lost, ensuring seamless offline demonstrations.

### 2.5 Agents & Workflow Logic: `sellbird/agents/` and `sellbird/main.py`
- **Current Implementation**:
  - Individual procedural agents: `scout.py` (prospect finder), `writer.py` (email drafting), `sender.py` (email dispatch), `handler.py` (reply analysis), `analyst.py` (metrics).
  - `main.py` executes an infinite loop polling the database at 60-second intervals and calling agents imperatively.
- **Defects & Gaps**:
  - Rigid procedural loop lacks state machine semantics, pause/resume capability, and DAG branching.
  - Does not satisfy the prompt's explicit requirement: **"LangGraph for agent orchestration"**.
- **Remediation Strategy**:
  - Replace `sellbird/main.py` loop with a compiled **LangGraph `StateGraph`**:
    - Nodes: `ScoutNode` -> `ResearchNode` -> `QualifyNode` -> `WriterNode` -> `GateCheckNode` -> `HumanReviewNode` -> `SenderNode` -> `ReplyHandlerNode`.
    - Stateful checkpointer using SQLite.
    - Deterministic short-circuiting: If a lead replies or opts out, the graph unconditionally halts further outreach.

### 2.6 Integrations: `sellbird/integrations/smtp_mail.py`
- **Current Implementation**:
  - Native Python `smtplib` and `imaplib` client supporting standard SMTP delivery and IMAP reply polling.
  - Configurable mock mode when test credentials or offline flags are set.
- **Assessment**:
  - Clean, zero-cost, and robust.
- **Remediation Strategy**:
  - Retain `smtp_mail.py` as the direct delivery provider.
  - Add an in-memory/SQLite mailbox mock for offline acceptance testing so drafts and replies can be simulated without external mail servers.

---

## 3. Test Suite Audit (`tests/`)

The upstream repository contains **66 unit and integration test files**:
- `test_gate.py`: 100% deterministic, tests banned phrases and merge tag leakages. (PASSING)
- `test_email_style.py`: Tests length, capitalization, and formatting. (PASSING)
- `test_untrusted.py`: Tests prompt injection mitigation fences. (PASSING)
- `test_state.py`: Tests migrations 1 through 16 and SQLite transactions. (PASSING)
- `test_brain.py`, `test_claude_runtime.py`, `test_codex.py`: Depend on external CLI binaries and mocks. (REQUIRES REPLACEMENT with `test_ollama.py` and `test_langgraph.py`).
- `test_collectors_*.py`: Test parsing logic using HTML fixtures. (PASSING)

---

## 4. Reusability & Action Matrix

| Component | Status | Action | Effort |
| :--- | :--- | :--- | :--- |
| `sellbird/gate.py` | Complete & Working | Reuse directly; integrate into LangGraph | Low |
| `sellbird/email_style.py` | Complete & Working | Reuse directly | Low |
| `sellbird/untrusted.py` | Complete & Working | Reuse directly for prompt injection defense | Low |
| `sellbird/state.py` | Partial (16 migrations) | Add Migration 17 (`products`, `icps`) & WAL pool | Medium |
| `sellbird/collectors/*` | Complete | Wrap with offline fixture cache | Medium |
| `sellbird/integrations/smtp_mail.py` | Complete | Reuse directly; add offline test mailer | Low |
| `sellbird/brain.py` | Broken (Cloud CLI) | Replace with async local Ollama client | High |
| `sellbird/claude_runtime.py` | Non-Compliant | Remove / Deprecate | Low |
| `sellbird/codex.py` | Non-Compliant | Remove / Deprecate | Low |
| `sellbird/main.py` | Inadequate (Procedural)| Replace with LangGraph StateGraph engine | High |
| `backend/api/` | Missing | Create FastAPI application exposing REST endpoints | High |
| `backend/embeddings/` | Missing | Create SentenceTransformers local vector matcher | Medium |
| `frontend/` (React UI) | Missing in upstream | Built 13 screens in `havleyintern`, wire to FastAPI | Medium |

---

## 5. Architectural Recommendations

1. **Keep Upstream Core Utilities**: Do not rewrite what already works. The safety filters (`gate.py`), prompt fences (`untrusted.py`), and storage engine (`state.py`) represent high-value engineering that must be preserved.
2. **Standardize on Ollama + Qwen2.5**: Standardize on Ollama with `Qwen2.5:7b-instruct` (or `Qwen2.5:1.5b-instruct` / `Qwen3:8b` based on host VRAM). Provide automatic mock fallbacks for CI and environments lacking GPU/Ollama.
3. **Formalize LangGraph as Workflow Backbone**: Build the sales agent DAG using `langgraph.graph.StateGraph` with explicit `TypedDict` state. Ensure deterministic interrupts for human approval before email dispatch.
4. **Unified Monorepo Packaging**: House the FastAPI backend in `backend/` and the React frontend in `src/`, with shared types and scripts to run both seamlessly via `npm run dev` and `uvicorn`.
