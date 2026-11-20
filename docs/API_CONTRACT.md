# Harvey AI Sales Agent — REST API Contract

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000/api/v1`  
**Protocol:** HTTP/1.1 REST + JSON  
**Auth:** Optional Local Token / Open for Localhost  

---

## 1. Global Response & Error Envelope

All API endpoints follow a standardized JSON envelope structure:

### Success Envelope
```json
{
  "status": "success",
  "data": { ... }
}
```

### Paginated Success Envelope
```json
{
  "status": "success",
  "data": {
    "items": [ ... ],
    "total": 142,
    "page": 1,
    "page_size": 20
  }
}
```

### Error Envelope
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed description of error",
    "details": {}
  }
}
```

---

## 2. Core Endpoints

### 2.1 System & Health

#### `GET /health`
Returns system status, active database migration version, and local AI daemon state.
- **Response 200 OK:**
```json
{
  "status": "healthy",
  "app_name": "Harvey AI Sales Agent",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "version": 17,
    "wal_mode": true
  },
  "ollama": {
    "reachable": true,
    "model": "qwen2.5:7b"
  }
}
```

---

### 2.2 Product Catalog & ICPs

#### `GET /products`
Retrieve all configured products.
- **Query Params:** `active_only` (bool, default: `false`)
- **Response 200 OK:** `List[ProductResponse]`

#### `POST /products`
Create a new product.
- **Request Body:**
```json
{
  "name": "CloudGuard AI",
  "slug": "cloudguard-ai",
  "category": "Cybersecurity",
  "value_proposition": "Automated zero-trust container posture management",
  "features": ["Vulnerability scanning", "Runtime enforcement"],
  "pricing_model": "tiered",
  "target_verticals": ["FinTech", "HealthTech", "SaaS"],
  "is_active": true
}
```
- **Response 201 Created:** `ProductResponse`

#### `GET /products/{product_id}/icps`
List ICP definitions for a given product.

#### `POST /products/{product_id}/icps`
Attach an ICP criteria definition to a product.

---

### 2.3 Organization & Business Profile

#### `GET /business/profile`
Retrieve active company profile and value positioning.

#### `PUT /business/profile`
Create or update company profile and value proposition.

---

### 2.4 Prospect & Lead Management

#### `GET /prospects`
Paginated search and filter across prospects.
- **Query Params:**
  - `page`: int (default: 1)
  - `page_size`: int (default: 20)
  - `status`: string (`new`, `researched`, `qualified`, `drafted`, `contacted`, `replied`)
  - `search`: string (sub-string search on name, company, email)
- **Response 200 OK:** `{ "items": [...], "total": 45, "page": 1, "page_size": 20 }`

#### `POST /prospects`
Create a new prospect. Automatically links or creates associated company record in compliance with foreign keys.
- **Request Body:**
```json
{
  "first_name": "Marcus",
  "last_name": "Vance",
  "email": "marcus@vance.io",
  "company": "Vance Corp",
  "title": "Chief Revenue Officer",
  "industry": "FinTech",
  "status": "new"
}
```
- **Response 201 Created:** `ProspectResponse`

#### `GET /prospects/{prospect_id}`
Retrieve a single prospect.

#### `PUT /prospects/{prospect_id}`
Update prospect attributes (status, qualification score, notes).

---

### 2.5 Public Research & Discovery

#### `POST /research/company`
Execute web scraping or fixture lookup for a given domain/company.
- **Request Body:** `{ "domain": "acmesaas.com", "company_name": "Acme SaaS" }`
- **Response 200 OK:**
```json
{
  "domain": "acmesaas.com",
  "company_name": "Acme SaaS",
  "evidence_count": 3,
  "evidence": [
    {
      "signal_code": "tech_stack",
      "collector": "web_scraper",
      "value_text": "<untrusted>React, TypeScript, AWS, PostgreSQL</untrusted>",
      "confidence": 0.95,
      "evidence_url": "https://acmesaas.com"
    }
  ]
}
```

#### `POST /discovery/run`
Execute OpenStreetMap Overpass discovery queries.

---

### 2.6 Local AI & Embedding Inference

#### `GET /models/status`
Check Ollama status and available local models.

#### `POST /models/generate`
Trigger local LLM generation (Qwen2.5) with leak guard protection.

#### `POST /models/embeddings`
Compute 384-dimensional dense vectors locally via `sentence-transformers/all-MiniLM-L6-v2`.

#### `POST /models/similarity`
Compute semantic cosine similarity between query text and a candidate corpus.

---

### 2.7 Outreach Drafting & Safety Gate

#### `POST /outreach/draft`
Generate personalized cold outreach email using verified evidence and validate against the deterministic quality gate.
- **Request Body:**
```json
{
  "prospect_id": "prosp_123",
  "product_id": "prod_456",
  "company_name": "Acme SaaS",
  "first_name": "Elena",
  "title": "VP Engineering",
  "notes": "Fast-growing SaaS migrating to Kubernetes"
}
```
- **Response 200 OK:**
```json
{
  "subject": "Quick question on Acme SaaS container security",
  "body": "Hi Elena,\n\nNoticed Acme SaaS has been scaling your cloud architecture...",
  "word_count": 82,
  "gate_passed": true,
  "warnings": [],
  "product_id": "prod_456"
}
```

---

### 2.8 Inbound Replies & Stop-on-Reply

#### `POST /replies/analyze`
Classify inbound message intent and trigger deterministic follow-up cancellation if applicable.
- **Request Body:**
```json
{
  "messages": [
    {
      "from": "elena@acmesaas.com",
      "date": "2026-11-20T10:00:00Z",
      "body": "Thanks for reaching out. Let's set up a demo this Thursday."
    }
  ]
}
```
- **Response 200 OK:**
```json
{
  "intent": "meeting_request",
  "sentiment": "positive",
  "interest": 95,
  "suggested_action": "Propose 3 calendar slots for Thursday demo",
  "summary": "Prospect requested a live product demo for Thursday.",
  "stop_followups": true
}
```

---

### 2.9 LangGraph Agent Pipelines

#### `POST /agents/pipeline`
Execute the complete multi-product sales workflow state graph.
- **Request Body:**
```json
{
  "prospect_id": "p_001",
  "product_id": "prod_001",
  "run_id": "run_test_001",
  "dry_run": true
}
```
- **Response 200 OK:** Full `SalesAgentState` output with gate checks and trace.
