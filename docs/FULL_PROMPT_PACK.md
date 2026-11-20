<USER_REQUEST>
EDXSO Assignment 2 — Remaining Antigravity Prompt Pack
Harvey AI Sales Agent
PROMPT 1 — Assignment Requirements, Repository Audit & Implementation Blueprint
You are the lead software architect responsible for transforming the existing Harvey/Sellbird repository into a complete, reliable AI Sales Agent that satisfies the EDXSO AI Engineer Intern Assignment 2.
Repository: [https://github.com/ethanplusai/harvey](https://github.com/ethanplusai/harvey)
Note: The repository may now appear under the Sellbird name. Inspect the actual checked-out repository rather than assuming its name or structure.
Your first responsibility is analysis, not coding.
Inspect the complete repository:
Directory and module structure.
Existing frontend and backend.
API routes, database models and migrations.
Existing AI integrations, prompts and agent logic.
Authentication, configuration and environment variables.
Existing tests, scripts and deployment configuration.
Identify what is reusable, incomplete, broken, duplicated or missing.
Map every assignment requirement to:
Existing implementation.
Required modification.
New implementation.
Acceptance test.
Identify conflicts between the existing repository and the intended local-first architecture.
Preserve existing functionality wherever practical. Do not rewrite working modules without a concrete reason.
Preserve the repository's AGPL-3.0 license notices and comply with its obligations.
Target architecture to evaluate:
Python 3.11+
FastAPI backend
LangGraph for stateful agent workflows
Ollama for local LLM inference
SQLite for local persistence
Sentence Transformers for local embeddings
Modular Python packages and object-oriented design
Existing frontend, integrated with well-defined backend APIs
Do not introduce cloud inference, Groq, Supabase or hosted embedding APIs if they violate the assignment's local/offline requirements.
Deliverables:
docs/REPOSITORY_AUDIT.md
docs/REQUIREMENTS_TRACEABILITY.md
docs/SYSTEM_ARCHITECTURE.md
docs/IMPLEMENTATION_ROADMAP.md
A proposed final directory structure.
A list of technical risks and mitigations.
Do not modify application code in this phase. Clearly flag any requirement that cannot be verified because the assignment document is unavailable. Stop after delivering the audit and blueprint.
PROMPT 2 — Project Foundation, Configuration & Modular Architecture
Implement the approved architecture without unnecessarily replacing existing working functionality.
Objectives:
Establish a clean, modular backend architecture.
Separate API, business logic, agents, data access, models, integrations and utilities.
Use OOP where it improves separation of responsibilities; avoid unnecessary classes and abstractions.
Implement centralized configuration and environment validation.
Establish consistent error handling, logging and type-safe request/response schemas.
Suggested module boundaries (adapt to the repository):
app/api/ — FastAPI routes and dependencies.
app/core/ — configuration, logging, exceptions and application lifecycle.
app/models/ — database entities and domain models.
app/schemas/ — Pydantic request and response schemas.
app/repositories/ — database access.
app/services/ — business operations.
app/agents/ — LangGraph agents and workflow definitions.
app/llm/ — Ollama client, model management and inference.
app/embeddings/ — local embedding generation and retrieval.
app/utils/ — reusable helpers.
tests/ — unit, integration and API tests.
docs/ — technical documentation.
Engineering requirements:
Use dependency injection for shared services.
Avoid circular imports and tightly coupled modules.
Use asynchronous operations where they provide real benefits.
Use structured logging instead of scattered print statements.
Keep secrets and machine-specific configuration outside source code.
Provide .env.example.
Provide pinned or appropriately constrained dependencies.
Add health and readiness endpoints.
Keep local data paths configurable.
Ensure application startup and shutdown are handled cleanly.
Do not create empty modules merely to make the directory structure look complete. Every module must have a meaningful responsibility.
Deliverables:
Working backend foundation.
Updated dependency files.
Configuration examples.
Updated README setup instructions.
Tests for configuration, startup, health checks and core infrastructure.
Run the tests and fix all regressions before proceeding.
PROMPT 3 — SQLite Data Layer & Business Domain
Implement the complete persistent data layer for the sales agent.
Core domain areas to support:
Business profile and company context.
Products and services.
Ideal Customer Profiles (ICPs).
Prospects and organizations.
Prospect research and evidence.
Buying signals.
Prospect scores and problem statements.
Generated outreach messages.
Email replies and classifications.
Agent execution history.
Model configuration and local system settings.
Requirements:
Inspect existing database models before adding new ones.
Design normalized relational tables with appropriate foreign keys.
Use stable primary keys and timestamps.
Add indexes for frequently filtered and joined fields.
Implement database migrations or a safe schema initialization strategy.
Implement repository classes or equivalent data-access boundaries.
Use transactions for multi-step writes.
Validate inputs through Pydantic schemas.
Prevent duplicate records where appropriate using constraints and deduplication logic.
Support pagination and filtering for large prospect lists.
Store evidence and source references separately from AI-generated conclusions.
Do not store sensitive secrets in the database as plain text.
Performance considerations:
Avoid N+1 query patterns.
Select only the columns needed.
Add indexes based on actual query patterns.
Avoid loading all prospects into memory for filtering or pagination.
Use bulk operations where appropriate.
Deliverables:
Database schema and migrations.
Repository implementations.
Domain models and schemas.
Seed/demo data that is clearly labelled.
Tests for CRUD operations, relationships, constraints and migrations.
docs/DATABASE_DESIGN.md.
All data must persist after application restart.
PROMPT 4 — Local AI Infrastructure & Model Management
Build the local AI infrastructure using Ollama.
Primary objective: AI functionality should operate locally without depending on a hosted LLM inference service.
Implement:
A reusable Ollama client.
Model availability detection.
Model installation/pull guidance.
Model selection and configuration.
Streaming and non-streaming generation where needed.
Timeouts, retries and clear error handling.
Structured output validation.
Prompt templates separated from business logic.
Token/context-limit awareness.
Model health and readiness reporting.
Embeddings:
Integrate Sentence Transformers locally.
Use a configurable embedding model.
Generate embeddings for relevant company, product and prospect information.
Implement local similarity search.
Avoid unnecessary repeated embedding generation.
Cache embeddings where appropriate and invalidate them when source content changes.
Important:
Never pretend a model is installed or available when it is not.
Do not silently fall back to an external API.
Do not expose raw internal model errors to users.
Keep model configuration independent of agent business logic.
Provide a clear explanation when a required local model is unavailable.
Deliverables:
Local LLM service.
Embedding service.
Model configuration and status endpoints.
Prompt template organization.
Tests using mocked model responses.
A real local integration test when Ollama is available.
docs/LOCAL_AI_SETUP.md.
PROMPT 5 — LangGraph Sales Agent Workflows
Implement the sales intelligence and execution workflows as modular LangGraph graphs.
Do not build one giant agent that performs every task. Each workflow should have a clear objective, typed state, controlled tools and testable nodes.
Implement the following workflow capabilities, subject to confirmation against the assignment PDF:
Business Profile Workflow
Collect and structure company information.
Identify business model, market, products and positioning.
Ask for missing critical information instead of inventing it.
Save the validated profile.
Product & ICP Workflow
Understand the product and its value proposition.
Identify target industries, company sizes, roles and buyer characteristics.
Generate structured ICP criteria.
Allow users to review and edit the result.
Prospect Research Workflow
Research prospect information using permitted configured sources.
Extract relevant company and contact information.
Preserve source URLs and timestamps.
Distinguish verified facts from inferred information.
Handle unavailable or incomplete sources honestly.
Buying Signal Workflow
Identify relevant business events and potential buying signals.
Explain why each signal matters.
Store evidence and source references.
Avoid presenting unsupported assumptions as facts.
Problem Statement & Scoring Workflow
Map prospect characteristics to the product's value proposition.
Generate evidence-backed problem statements.
Score prospects using transparent, configurable criteria.
Explain score components and confidence.
Never fabricate evidence to increase a score.
Personalized Outreach Workflow
Generate personalized email drafts based on verified prospect context.
Reference the product's actual capabilities.
Avoid unsupported claims and fabricated personalization.
Support regeneration and user editing.
Never send an email without explicit user authorization.
Reply Intelligence Workflow
Classify replies into useful categories such as interested, not interested, objection, meeting request or follow-up.
Extract intent and relevant details.
Recommend a next action.
Preserve the original reply.
Flag uncertain classifications.
LangGraph engineering requirements:
Define explicit state schemas.
Use small, testable nodes.
Separate tools from prompts and graph logic.
Implement conditional routing.
Add retries only for recoverable failures.
Include timeouts and execution limits.
Persist execution status and useful outputs.
Support interruption and human approval where appropriate.
Prevent accidental repeated actions.
Record errors and execution traces.
Deliverables:
Individual workflow graphs.
Shared state and tool interfaces.
Prompt templates.
Workflow service/API integration.
Unit tests for nodes and routing.
End-to-end workflow tests using mocked LLM responses.
docs/AGENT_WORKFLOWS.md.
PROMPT 6 — Research Sources, Retrieval & Evidence Quality
Implement a reliable research and evidence layer for prospect intelligence.
Objectives:
Connect to permitted research sources.
Normalize collected information.
Preserve provenance.
Deduplicate repeated findings.
Make retrieved evidence available to LangGraph workflows.
Requirements:
Create a source adapter interface so individual research providers can be added or removed without changing agent logic.
Implement only sources that are permitted by the assignment and technically accessible.
Store source name, source URL, retrieval time and relevant metadata.
Normalize company names, domains and other identifiers.
Deduplicate findings using deterministic identifiers and similarity checks where appropriate.
Separate raw research records from generated summaries.
Track freshness and retrieval failures.
Never claim a source was checked if it was not.
Never invent a website, company fact, contact or buying signal.
Use local embeddings for semantic retrieval where useful.
Evidence quality:
Each AI-generated claim should reference supporting evidence when available.
Display source information with generated insights.
Label inferred information clearly.
Allow unsupported claims to be marked as unverified.
Make missing evidence visible rather than hiding it.
Performance:
Use caching for reusable research.
Avoid unnecessary duplicate requests.
Apply pagination and bounded retrieval.
Avoid embedding the same unchanged content repeatedly.
Deliverables:
Source adapter architecture.
Research and evidence services.
Retrieval functionality.
Deduplication and freshness logic.
Tests with mocked sources.
docs/RESEARCH_AND_EVIDENCE.md.
Do not bypass source restrictions, authentication requirements or website access controls.
PROMPT 7 — Backend API, Frontend Integration & User Experience
Connect the backend to the frontend created separately in Lovable.
Important: Do not rebuild the frontend or redesign its visual system without a clear integration requirement. Inspect the actual frontend source and connect its existing components to real backend functionality.
Integration tasks:
Map every frontend page and interaction to the appropriate API endpoint.
Create or update typed API request and response schemas.
Implement consistent API error responses.
Add pagination, search, sorting and filtering where required.
Connect dashboard metrics to persisted data.
Connect product and business profile forms.
Connect ICP creation and editing.
Connect prospect discovery, lists and detail pages.
Connect buying signals and scoring.
Connect outreach generation and editing.
Connect reply classification.
Connect agent execution status and activity history.
Connect local model health and configuration.
Frontend interaction requirements:
Loading, success, empty and error states.
Clear validation messages.
No fake success notifications.
No hardcoded production metrics.
Distinguish sample data from real data.
Prevent duplicate submissions.
Provide confirmation before destructive actions.
Show model unavailable and workflow failure states honestly.
Backend requirements:
Configure CORS correctly for local development.
Validate all user input.
Apply request limits where appropriate.
Do not expose internal stack traces.
Keep API documentation updated.
Ensure long-running agent tasks do not block unrelated API requests.
Deliverables:
Fully connected frontend and backend.
API contract documentation.
Integration tests.
Updated setup instructions.
A page-by-page integration checklist.
PROMPT 8 — Testing, Security, Performance & Reliability
Conduct a comprehensive engineering review of the complete application.
Do not merely report issues. Fix the issues that can be safely fixed and rerun the relevant tests.
Testing:
Unit tests for services, repositories and agent nodes.
API tests for all critical endpoints.
Database persistence tests.
Workflow routing tests.
Error and timeout tests.
Frontend integration checks.
Local model unavailable tests.
Data validation tests.
End-to-end tests for the main user journey.
Security:
Check for hardcoded credentials and secrets.
Validate inputs and uploaded data.
Review file path handling.
Prevent SQL injection through parameterized database access.
Review CORS configuration.
Avoid logging sensitive information.
Protect destructive operations.
Review dependency vulnerabilities.
Preserve appropriate license notices.
Performance:
Identify slow database queries.
Check unnecessary repeated LLM calls.
Reduce redundant embedding generation.
Avoid loading unbounded datasets.
Add pagination and caching where beneficial.
Profile expensive operations before optimizing them.
Explain time and space complexity for important algorithms.
Reliability:
Test partial workflow failures.
Test application restarts.
Test database persistence.
Test interrupted agent execution.
Test missing model and missing configuration cases.
Verify that failed tasks do not appear as successful.
Deliverables:
Automated test suite.
Test execution report.
Security review.
Performance review.
Fixed critical and high-priority defects.
docs/TESTING_AND_SECURITY.md.
Do not claim the application is production-ready merely because the server starts.
PROMPT 9 — Deployment, Local Setup & Final Documentation
Prepare the application for reproducible setup, demonstration and final submission.
Primary deployment target: a local-first application. Do not introduce hosted inference or hosted storage if it conflicts with the assignment.
Implement and document:
Python environment setup.
Dependency installation.
Ollama installation and model setup.
Local embedding model setup.
SQLite initialization and migration.
Environment configuration.
Backend startup.
Frontend startup.
Application health checks.
Troubleshooting common setup failures.
Provide scripts or commands for repeatable setup. If Docker is useful and compatible with local model access, provide an optional Docker configuration; do not make Docker mandatory without a reason.
Documentation:
Project overview.
Architecture and component responsibilities.
Installation guide.
Environment variables.
API documentation.
Database design.
Agent workflow descriptions.
Model setup.
Testing instructions.
Known limitations.
Troubleshooting.
License and third-party attribution.
Final verification:
Clone/setup from a clean environment.
Start the application using documented commands.
Verify backend and frontend connectivity.
Verify local model availability.
Complete the primary user journey.
Verify persistence after restart.
Verify that no external inference API is required.
Verify all critical tests pass.
Create:
README.md
docs/FINAL_ARCHITECTURE.md
docs/DEMO_GUIDE.md
docs/KNOWN_LIMITATIONS.md
docs/FINAL_VERIFICATION_REPORT.md
Do not claim features are complete unless they have been implemented and tested.
PROMPT 10 — Final Assignment Compliance & Demo Readiness Audit
Act as an independent senior engineer and evaluator. Audit the finished repository against the actual EDXSO Assignment 2 document.
Do not assume that implementation equals compliance.
Read the actual assignment document.
Extract every mandatory requirement and deliverable.
Map each requirement to actual code, UI and test evidence.
Run the application and verify the major workflows.
Identify incomplete, simulated, misleading or untested features.
Check whether local/offline requirements are genuinely met.
Verify that the demo can be completed reliably.
Check setup instructions on a clean environment.
Identify any missing documentation or submission materials.
Create a final compliance table with:
Requirement.
Implementation location.
Verification method.
Evidence.
Status: Complete / Partial / Missing.
Remaining work.
Final output:
docs/ASSIGNMENT_COMPLIANCE_REPORT.md
docs/DEMO_SCRIPT.md
docs/FINAL_SUBMISSION_CHECKLIST.md
Do not mark a requirement complete based only on a README statement or a placeholder UI. Verify actual behaviour.
If the assignment PDF is unavailable, stop and request it. Do not fabricate a compliance assessment.                          Recommended execution order
1. Prompt 1 — Audit and blueprint
   
   Confirm the existing repository and requirements before coding.
2. Prompts 2–4 — Core foundation
   
   Architecture, database and local AI infrastructure.
3. Prompts 5–6 — Intelligence engine
   
   LangGraph workflows, research and evidence.
4. Prompt 7 — Integration
   
   Connect the Lovable frontend to real backend functionality.
5. Prompts 8–9 — Quality and delivery
   
   Testing, security, performance, setup and documentation.
6. Prompt 10 — Final evaluation
   
   Verify every requirement against the actual assignment PDF.

Three rules while using Antigravity:
1. Don't move to the next phase until the current phase's tests pass and its deliverables exist.
2. Ask it to inspect existing code before modifying files; avoid unnecessary rewrites.
3. Commit or create a checkpoint after every successful phase so you can roll back regressions.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-11-20T17:53:24+05:30.

The user has uploaded 5 image(s):
- C:/Users/boybl/.gemini/antigravity/brain/4677f295-dd72-47b6-94e3-7610c6ecfcf5/.user_uploaded/media_1795177303786.png
- C:/Users/boybl/.gemini/antigravity/brain/4677f295-dd72-47b6-94e3-7610c6ecfcf5/.user_uploaded/media_1795177332098.png
- C:/Users/boybl/.gemini/antigravity/brain/4677f295-dd72-47b6-94e3-7610c6ecfcf5/.user_uploaded/media_1795177353594.png
- C:/Users/boybl/.gemini/antigravity/brain/4677f295-dd72-47b6-94e3-7610c6ecfcf5/.user_uploaded/media_1795177371151.png
- C:/Users/boybl/.gemini/antigravity/brain/4677f295-dd72-47b6-94e3-7610c6ecfcf5/.user_uploaded/media_1795177389868.png
You can embed these images in an artifact if you need the USER to review them.
</ADDITIONAL_METADATA>