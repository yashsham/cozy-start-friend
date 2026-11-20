# Harvey AI Sales Agent — Evaluator Demonstration Guide

**Assignment:** EDXSO AI Engineer Intern Assignment 2  
**Target Audience:** Assignment Evaluators & Technical Reviewers  
**Demonstration Mode:** 100% Local / Air-Gapped Capable  

---

## 1. Quick Startup (2 Terminal Windows)

### Terminal 1: Backend API & Pre-Flight
```bash
# In repository root:
python scripts/start_backend.py
```
*Expected Output:* Confirms Python runtime, verifies SQLite WAL migration v17, loads SentenceTransformers (`all-MiniLM-L6-v2`), checks local Ollama daemon, and binds to `http://localhost:8000`.

### Terminal 2: Frontend Web Application
```bash
# In repository root:
npm run dev
```
*Expected Output:* Vite server running at `http://localhost:8080/`. Open this URL in your web browser.

---

## 2. Interactive Feature Walkthrough (7 Key Scenarios)

### Scenario 1: System Health & Local AI Air-Gap Status
1. Navigate to **System Status** (`/status` or via sidebar navigation).
2. Observe:
   - **Database Status:** Connected, SQLite WAL mode, Migration Version `17`.
   - **Local Inference Engine:** Ollama socket status (`http://127.0.0.1:11434`), Active Model tag (`qwen2.5:7b-instruct`).
   - **Local Vector Engine:** SentenceTransformers (`all-MiniLM-L6-v2`, 384 dimensions).
   - **Cloud Leak Guard:** Verified Active (0 bytes transmitted to paid cloud AI APIs).

---

### Scenario 2: Multi-Product Catalog & Value Propositions
1. Navigate to **Products** (`/products`).
2. Review the pre-seeded multi-product catalog:
   - **CloudGuard AI:** Zero-trust container security (Tier: Enterprise, Target: FinTech/SaaS).
   - **SignalFlow Data:** Real-time event streaming pipeline (Tier: Growth, Target: Logistics/E-commerce).
3. Click **Add Product** to create a custom product offering. Notice the instant SQLite persistence with JSON-backed features and target industries.

---

### Scenario 3: ICP Rule Definition & Scoring Weights
1. Navigate to **ICP Definitions** (`/icp`).
2. Select **CloudGuard AI** from the product selector.
3. Review the ICP criteria:
   - Target Roles: `VP Engineering`, `CISO`, `DevSecOps Lead`
   - Target Company Size: `50-500`
   - Hard Rules: Requires AWS or Kubernetes.
   - Minimum Fit Score: `60.0`.
4. Edit the qualification weights and save. The changes are immediately saved to the `product_icps` SQLite table.

---

### Scenario 4: Prospect Discovery & Public Intelligence
1. Navigate to **Prospects** (`/prospects`).
2. Search for `Elena Rostova` at `Acme SaaS`.
3. Click on the prospect card to view **Prospect Details** (`/prospects/:id`):
   - **Verified Evidence:** Notice the technical observations (`React`, `TypeScript`, `AWS`, `PostgreSQL`).
   - **Data Fencing:** All scraped observations are strictly encapsulated in `<untrusted source="...">` blocks.
   - **Hiring Signals:** ATS collector notes indicate an active search for "Senior Cloud Security Engineer".

---

### Scenario 5: Multi-Product Fit & Cannibalization Prevention
1. In the prospect view, observe the **Product Affinity Breakdown**:
   - **CloudGuard AI:** Fit Score `88%` (High Fit — FinTech vertical match, AWS tech stack match, CISO hiring signal).
   - **SignalFlow Data:** Fit Score `34%` (Low Fit — No real-time ETL or warehouse migration signals).
2. **Cannibalization Guard:** The system automatically locks in **CloudGuard AI** as the primary offering and disables simultaneous outreach for SignalFlow Data to avoid contradictory sales pitches.

---

### Scenario 6: Outreach Generation & Deterministic Quality Gate
1. Navigate to **Outreach** (`/outreach`).
2. Click **Generate Draft** for Elena Rostova.
3. Observe the generated cold email copy:
   - Specific personalization referencing Acme SaaS's AWS infrastructure.
   - Concise value proposition ($\le 125$ words).
4. **Test the Deterministic Gate:**
   - Intentionally insert a banned cliché: `"Hope this email finds you well"`.
   - Click **Run Gate Check**.
   - Notice the immediate rejection: `Contains banned spam cliché: 'hope this email finds you well'`.
   - Intentionally insert an unrendered merge tag: `"{{company}}"`.
   - Notice the rejection: `Unrendered merge-tag detected: '{{company}}'`.
5. Remove the violations and observe the gate turn Green with approval status.

---

### Scenario 7: Inbound Reply & Deterministic Stop-on-Reply
1. Navigate to **Inbox / Replies** (`/inbox`).
2. Ingest a simulated prospect reply from Elena:
   `"Thanks for reaching out Alex. Let's schedule a 15-minute call this Thursday."`
3. Click **Analyze Reply**:
   - Intent is classified as `meeting_request` (Confidence: 95%).
   - **Stop-on-Reply Guard Triggered:** All subsequent follow-up emails in the campaign sequence are immediately cancelled and flagged as `stopped_by_reply`.

---

## 3. Automated Script Demonstration (100% Offline)

If evaluators prefer an automated end-to-end verification without clicking the UI, run the acceptance protocol script:

```bash
python scripts/run_offline_acceptance_test.py
```

This script executes all 7 steps programmatically and logs verification results in real time.
