# Harvey AI Sales Agent — Frontend & Backend Integration Checklist
**System:** Harvey AI Sales Agent  
**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (`http://localhost:8080`)  
**Backend:** FastAPI Async REST API (`http://localhost:8000`)  
**Status:** 100% Fully Connected & Tested  

---

## 1. Page-by-Page Integration Matrix

Every screen in the React client is mapped to active, persisted backend REST endpoints:

| Screen # | Feature Screen | Primary User Interaction | Backend REST Endpoint(s) | Persistence / Engine Artifact | Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **A** | **Overview & Pipeline** | Live metric cards, agent activity feed, pipeline funnel | `GET /api/v1/health`<br>`GET /api/v1/prospects`<br>`GET /api/v1/models/status` | SQLite `prospects`, `outbox`, `observations` | **VERIFIED** |
| **B** | **Multi-Product Catalog** | Create, edit, and toggle active products; pricing tiers | `GET /api/v1/products`<br>`POST /api/v1/products`<br>`PUT /api/v1/products/{id}` | SQLite `products` table (Migration 17) | **VERIFIED** |
| **C** | **Business Profile** | Company overview, value proposition, competitors | `GET /api/v1/profile`<br>`POST /api/v1/profile` | SQLite `business_profiles` table | **VERIFIED** |
| **D** | **ICP & Qualification** | Target roles, company sizes, custom qualification rules | `GET /api/v1/icps/product/{id}`<br>`POST /api/v1/icps`<br>`DELETE /api/v1/icps/{id}` | SQLite `product_icps` table | **VERIFIED** |
| **E** | **Lead Discovery** | Autonomous search by vertical and geography | `POST /discovery/run`<br>`GET /api/v1/research/discovery` | `OverpassCollector` & `prospects` table | **VERIFIED** |
| **F** | **Prospects Directory** | Paginated lead table, text search, and status filters | `GET /api/v1/prospects?page=1&search=...`<br>`POST /api/v1/prospects` | SQLite `prospects` (indexed search) | **VERIFIED** |
| **G** | **Prospect Detail Modal** | 7-tab inspection drawer (Overview, Fit, Evidence, etc.) | `GET /api/v1/prospects/{id}`<br>`GET /api/v1/research/company/{id}` | SQLite `observations` & `prospect_scores` | **VERIFIED** |
| **H** | **Buying Signals Stream** | Filter hiring, funding, and tech stack event feeds | `GET /api/v1/research/company/{id}` | SQLite `observations` & `buying_signals` | **VERIFIED** |
| **I** | **Outreach Management** | AI drafting, pre-send gate checks, HITL approve/reject | `POST /outreach/draft`<br>`POST /api/v1/agents/run` | Ollama `qwen2.5:7b-instruct` & `outbox` | **VERIFIED** |
| **J** | **Inbound Replies Hub** | Reply thread analysis, sentiment classification | `POST /replies/analyze` | Reply Classifier & Stop-on-Reply Guard | **VERIFIED** |
| **K** | **LangGraph Agent Engine**| Live DAG visualization, node logs, manual triggers | `GET /api/v1/agents/pipeline`<br>`POST /api/v1/agents/run` | `langgraph.graph.StateGraph` | **VERIFIED** |
| **L** | **Local AI Health Monitor**| Local Ollama connectivity, model selector, embeddings | `GET /api/v1/models/status`<br>`POST /api/v1/models/embeddings` | Local Ollama daemon & SentenceTransformers | **VERIFIED** |
| **M** | **System & Settings** | Backend URL config, theme toggle, DB version check | `GET /api/v1/health`<br>`GET /api/v1/ready` | `PRAGMA user_version` (v17) | **VERIFIED** |

---

## 2. Interaction & Error Handling Guarantees

1. **Deterministic Quality Gate:** When generating cold email drafts, the backend guarantees compliance with:
   - Word count strictly $\le 125$ words.
   - Zero unrendered merge tags (`{{first_name}}`, `[Company]`).
   - Zero banned clichés ("hope this email finds you well", "synergy").
2. **Honest Model Reporting:** If the local Ollama daemon is not running on port 11434, the frontend indicates `offline/unavailable` and provides the exact CLI command (`ollama serve` / `ollama pull qwen2.5:7b-instruct`). It never pretends a cloud model is running.
3. **Deterministic Stop-on-Reply:** As soon as an inbound reply is ingested on Screen J, all future sequence emails for that prospect are cancelled.
4. **CORS Configuration:** Configured in `app/main.py` allowing origins `http://localhost:8080`, `http://127.0.0.1:8080`, and `http://localhost:5173`.
