# Harvey AI Sales Agent — Evaluator Presentation Demo Script

**Assignment:** EDXSO AI Engineer Intern Assignment 2  
**Presenter:** AI Systems Architect & Intern Candidate  
**Target Duration:** 5 to 7 Minutes  
**Prerequisites:** Backend running on port 8000, Frontend running on port 8080.  

---

## Act 1: Introduction & Architectural Premise (1 Minute)

### Verbal Dialogue:
> *"Hello! Today I'm presenting the Harvey AI Sales Agent for EDXSO Assignment 2. Our objective was to transform upstream Sellbird into a production-grade, multi-product AI sales agent that operates with strict zero paid cloud LLM dependencies.*
> 
> *Notice our architectural rule: We do not call OpenAI, Anthropic, Gemini, or Groq. Everything you will see runs 100% locally on this machine using Ollama with Qwen 2.5, in-process SentenceTransformers embeddings, and SQLite in WAL mode with Migration 17.*
> 
> *Let's start by looking at our system readiness."*

### Screen Action:
1. Navigate to **System Status** (`/status`).
2. Point out:
   - SQLite WAL mode is active at Schema Version `17`.
   - Local Ollama daemon is connected with `qwen2.5:7b-instruct`.
   - Outbound Leak Guard is active, intercepting any attempt to call commercial AI endpoints.

---

## Act 2: Multi-Product Catalog & Cannibalization Prevention (1.5 Minutes)

### Verbal Dialogue:
> *"Unlike basic single-product outreach tools, Harvey supports multiple products within a single organization. Here on our Products screen, we have configured two distinct software offerings: 'CloudGuard AI', an enterprise container security platform for FinTech and SaaS, and 'SignalFlow Data', a reverse-ETL pipeline for logistics and e-commerce.*
> 
> *Each product has its own Ideal Customer Profile, target job titles, and semantic qualification criteria.*
> 
> *A major challenge in multi-product sales is cannibalization—you don't want an AI pitching two conflicting products to the same prospect. Let's see how Harvey solves this."*

### Screen Action:
1. Navigate to **Products** (`/products`) and open **ICP Configuration** (`/icp`).
2. Show the target roles for CloudGuard AI (`VP Engineering`, `CISO`).
3. Navigate to **Prospects** (`/prospects`) and select `Elena Rostova` at `Acme SaaS`.
4. Point out the **Multi-Product Affinity Scores**:
   - `CloudGuard AI`: **88%** (Vertical match, AWS container tech detected).
   - `SignalFlow Data`: **34%** (No data pipeline pain points).
   - Highlight the **Single-Product Lock**: Harvey automatically locks CloudGuard AI as the sole offering, preventing dual-pitch cannibalization.

---

## Act 3: Public Research & Data Fencing (1.5 Minutes)

### Verbal Dialogue:
> *"Now let's examine the research layer. Harvey collects public intelligence through our Web Scraper and ATS collectors.*
> 
> *Notice two critical engineering details: First, SSRF protection. If someone injects internal IP addresses like AWS metadata or private subnets into a domain field, our network guard blocks the socket before connection.*
> 
> *Second, prompt injection fencing. Every observation scraped from the web is strictly encapsulated inside `<untrusted source="...">` XML tags. This prevents untrusted website text from hijacking the local model's instructions."*

### Screen Action:
1. In the Prospect detail view, scroll to the **Verified Evidence** panel.
2. Show the detected tech stack: React, TypeScript, AWS, PostgreSQL.
3. Show the hiring signal: "Senior Cloud Security Engineer".
4. Point out the `<untrusted>` tags displayed in the evidence inspector.

---

## Act 4: Outreach Generation & Deterministic Quality Gate (1.5 Minutes)

### Verbal Dialogue:
> *"Now let's generate personalized outreach. The LangGraph Writer node combines the prospect's verified evidence with the value proposition of CloudGuard AI.*
> 
> *Crucially, we do not trust the LLM to follow negative constraints like 'don't make it long' or 'don't hallucinate merge tags'. We enforce this deterministically through our pre-send Quality Gate.*
> 
> *Let's intentionally test the gate by injecting common cold outreach errors."*

### Screen Action:
1. Navigate to **Outreach** (`/outreach`) and click **Generate Draft**.
2. Show the generated draft (concise, personalized, $\le 125$ words).
3. In the draft editor, intentionally type: `"Hope this email finds you well, {{first_name}}."`
4. Click **Run Gate Check**.
5. Show the immediate deterministic rejection banners:
   - `Contains banned spam cliché: 'hope this email finds you well'`
   - `Unrendered merge-tag detected: '{{first_name}}'`
6. Revert the edits, click **Run Gate Check**, and show the status flip to **Gate Approved (Ready for Review)**.

---

## Act 5: Inbound Reply Intelligence & Stop-on-Reply (1 Minute)

### Verbal Dialogue:
> *"Finally, what happens when a prospect replies? In automated email tools, sending a follow-up after the prospect has already replied is a disastrous user experience.*
> 
> *Harvey implements a Deterministic Stop-on-Reply Guard. The millisecond an inbound reply is ingested, our LangGraph router cancels all scheduled follow-ups, halts the campaign, and categorizes the reply intent for the sales rep."*

### Screen Action:
1. Navigate to **Inbox / Replies** (`/inbox`).
2. Ingest the simulated reply from Elena: `"Thanks Alex, let's schedule a call this Thursday at 2pm."`
3. Click **Analyze Reply**.
4. Show the classified intent: `meeting_request` (95% interest score).
5. Point out the badge: `Campaign Halted: Stop-on-Reply Triggered`.

---

## Act 6: Offline Acceptance Test & Conclusion (30 Seconds)

### Verbal Dialogue:
> *"To prove that this entire system works with zero cloud APIs and zero external network access, we built a standalone offline acceptance protocol script.*
> 
> *Running `python scripts/run_offline_acceptance_test.py` validates all 7 core workflows in under 30 seconds with 100% pass rate.*
> 
> *Thank you, and I look forward to your questions!"*
