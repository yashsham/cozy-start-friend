# Harvey AI Sales Agent — Database Architecture & Data Dictionary
**System:** Harvey AI Sales Agent  
**Engine:** SQLite 3 in WAL Mode (Write-Ahead Logging)  
**ORM / Access Pattern:** Async Repository Pattern via `aiosqlite`  
**Schema Version:** Migration 17 (`user_version = 17`)  
**Database File:** `data/sellbird.db`  

---

## 1. Concurrency & Performance Design

SQLite is configured at connection startup with the following PRAGMAs:
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 30000; -- 30 seconds
```

### Why WAL (Write-Ahead Logging)?
- **Non-blocking concurrent reads:** Readers (e.g. the React dashboard polling endpoints) never block writers (e.g. LangGraph agent nodes updating lead state), and writers never block readers.
- **ACID guarantees:** Commits append frames to the `-wal` file with zero database corruption risk.
- **Busy timeout:** If a writer lock is momentarily held during a transaction commit, concurrent operations wait up to 30,000ms instead of raising `sqlite3.OperationalError: database is locked`.

---

## 2. Schema Migrations Ledger (v1 – v17)

All migrations are tracked sequentially in `PRAGMA user_version` and executed idempotently at application startup:

| Version | Migration Focus | Core Tables / Alterations Introduced |
| :--- | :--- | :--- |
| **v1** | Base Engine Schema | `companies`, `prospects`, `campaigns`, `conversations`, `feedback`, `actions`, `usage_log`, `processed_replies` |
| **v2** | Identity Normalization & Dedup | Lowercase trimming, dedup queries, unique indexes on `email`, `linkedin_url`, `domain` |
| **v3** | Per-Call Usage Accounting | `usage_events` table (model, tokens, cost, duration_ms, request_key) |
| **v4** | Email Delivery Statuses | `email_status` column on `prospects` (`verified`, `risky`, `guess`, `invalid`); `email_patterns` table |
| **v5** | Buying Signals on Companies | `tech_stack_json` and `signals_json` columns on `companies` |
| **v6** | Native Sending Outbox & Settings | `outbox` table (approval ladder: `pending_review` -> `approved` -> `sent`), `settings` KV table |
| **v7** | Governed Observation Model | `signal_codes`, `observations` (EAV model with trigger enforcement), `runs` log |
| **v8** | Web-Free Business Discovery | `external_id` (OpenStreetMap / directory stable keys) and `phone` columns on `companies` |
| **v9** | Contact Backfill Tracking | `prospects_checked_at` timestamp on `companies` to prevent infinite crawl loops |
| **v10**| Profile Collector Attempt Tracking| `profile_checked_at` timestamp on `companies` |
| **v11**| Local Model Attribution | `provider` column defaulted to `ollama` on `usage_events` |
| **v12**| Action Type Indexing | Composite index `idx_actions_type_created` on `actions(action_type, created_at)` |
| **v13**| Approval Accountability | `approved_by` column on `outbox` (`user`, `autopilot`, `earlier`) |
| **v14**| Recipient Timezones | `timezone` IANA string column on `prospects` |
| **v15**| Suppressions & Opt-Outs | `suppressions` table (unique index on `kind`, `value`) |
| **v16**| Multi-Mailbox Sending | `mailboxes` and `campaign_mailboxes` tables |
| **v17**| **Multi-Product Sales Agent Core** | `products`, `product_icps`, `product_scores`, `business_profiles`, `buying_signals`, `local_system_settings` |

---

## 3. Data Dictionary: Multi-Product Extension (v17)

### 3.1 `products`
Stores discrete products or service offerings represented by the sales agent.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique 12-char hex identifier. |
| `name` | TEXT | NOT NULL | Human-readable product name. |
| `slug` | TEXT | NOT NULL UNIQUE | URL-safe slug for API routing and UI tabs. |
| `tagline` | TEXT | DEFAULT '' | Concise one-line value hook. |
| `description` | TEXT | NOT NULL | Complete product overview and capabilities. |
| `value_proposition` | TEXT | NOT NULL | Core business impact (e.g. "Cuts cold email bounce rates by 90%"). |
| `pricing_tier` | TEXT | DEFAULT 'Pro' | Pricing category (`Free`, `Pro`, `Enterprise`). |
| `target_industries_json` | TEXT | DEFAULT '[]' | JSON array of target industry strings. |
| `key_features_json` | TEXT | DEFAULT '[]' | JSON array of feature highlights. |
| `is_active` | INTEGER | DEFAULT 1 | Boolean toggle (1 = active for pitching, 0 = disabled). |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | UTC creation timestamp. |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | UTC modification timestamp. |

### 3.2 `product_icps`
Defines qualification rules and buyer persona criteria for a specific product.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique 12-char hex identifier. |
| `product_id` | TEXT | REFERENCES `products(id)` ON DELETE CASCADE | Associated product. |
| `title` | TEXT | NOT NULL | ICP profile name (e.g. "Series A Tech Founders"). |
| `target_roles_json` | TEXT | DEFAULT '[]' | JSON array of buyer job titles (`CTO`, `VP Sales`). |
| `target_company_sizes_json`| TEXT | DEFAULT '[]' | JSON array of company headcount brackets (`11-50`). |
| `target_industries_json` | TEXT | DEFAULT '[]' | JSON array of qualifying industries. |
| `key_pain_points_json` | TEXT | DEFAULT '[]' | Specific customer pain points addressed. |
| `qualification_rules_json` | TEXT | DEFAULT '[]' | Deterministic rule strings evaluated during qualification. |
| `min_fit_score` | REAL | DEFAULT 65.0 | Minimum threshold required to qualify a lead for this product. |

### 3.3 `product_scores`
Records multi-product qualification scores for prospects to avoid cross-product cannibalization.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique 12-char identifier. |
| `prospect_id` | TEXT | REFERENCES `prospects(id)` ON DELETE CASCADE | Target lead. |
| `product_id` | TEXT | REFERENCES `products(id)` ON DELETE CASCADE | Evaluated product. |
| `fit_score` | REAL | NOT NULL | Composite fit score (0.0 – 100.0). |
| `fit_tier` | TEXT | DEFAULT 'medium' | Qualitative tier (`very_high`, `high`, `medium`, `low`, `unfit`). |
| `fit_reasons_json` | TEXT | DEFAULT '[]' | Array of evidence-backed justifications. |
| `affinity_rank` | INTEGER | DEFAULT 1 | Rank order (1 = highest affinity product for this prospect). |
| `evaluated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Evaluation timestamp. |

### 3.4 `business_profiles`
Single-source-of-truth for the seller's company identity and positioning.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique identifier. |
| `company_name` | TEXT | NOT NULL | Name of the selling organization. |
| `website` | TEXT | DEFAULT '' | Organization domain URL. |
| `tagline` | TEXT | DEFAULT '' | Company tagline. |
| `overview` | TEXT | DEFAULT '' | High-level business overview. |
| `industry` | TEXT | DEFAULT '' | Seller's primary operating industry. |
| `business_model` | TEXT | DEFAULT 'B2B' | Business model (`B2B`, `B2C`, `Marketplace`). |
| `target_geography` | TEXT | DEFAULT 'Global' | Geographic operational scope. |
| `value_proposition` | TEXT | DEFAULT '' | Overarching organizational value proposition. |
| `competitors_json` | TEXT | DEFAULT '[]' | JSON array of competitor brand names. |

---

## 4. Integrity Constraints & Foreign Key Policies

- Foreign keys are enforced on all connections (`PRAGMA foreign_keys = ON`).
- Deleting a `product` automatically cascades to delete all associated `product_icps` and `product_scores`.
- Unique indexes on `products(slug)` and `uq_outbox_campaign_step` prevent duplicate entities and double-sending.
- Parameterized queries are mandatory across all repositories, eliminating SQL injection vectors.
