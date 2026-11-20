"""SQLite schema migrations (v1 through v17).

Migrations 1–16 preserve the upstream Sellbird WAL schema.
Migration 17 adds multi-product, multi-ICP, scoring, buying signals, and business profiles.
"""

MIGRATIONS: list[str] = [
    # ── v1: base schema ──
    """
    CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT DEFAULT '',
        domain TEXT DEFAULT '',
        website TEXT DEFAULT '',
        description TEXT DEFAULT '',
        industry TEXT DEFAULT '',
        company_size TEXT DEFAULT '',
        location TEXT DEFAULT '',
        source TEXT DEFAULT '',
        source_url TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prospects (
        id TEXT PRIMARY KEY,
        company_id TEXT DEFAULT '' REFERENCES companies(id),
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        email_verified INTEGER DEFAULT 0,
        phone TEXT DEFAULT '',
        phone_verified INTEGER DEFAULT 0,
        linkedin_url TEXT DEFAULT '',
        title TEXT DEFAULT '',
        seniority TEXT DEFAULT '',
        department TEXT DEFAULT '',
        source TEXT DEFAULT '',
        source_url TEXT DEFAULT '',
        status TEXT DEFAULT 'new',
        score INTEGER DEFAULT 0,
        personalization_notes TEXT DEFAULT '',
        company TEXT DEFAULT '',
        industry TEXT DEFAULT '',
        company_size TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY,
        name TEXT DEFAULT '',
        channel TEXT DEFAULT 'email',
        instantly_campaign_id TEXT DEFAULT '',
        sequence_json TEXT DEFAULT '[]',
        prospect_ids_json TEXT DEFAULT '[]',
        status TEXT DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        prospect_id TEXT REFERENCES prospects(id),
        campaign_id TEXT DEFAULT '',
        channel TEXT DEFAULT 'email',
        thread_json TEXT DEFAULT '[]',
        intent TEXT DEFAULT '',
        stage TEXT DEFAULT 'initial_outreach',
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        entity_type TEXT DEFAULT '',
        entity_id TEXT DEFAULT '',
        comment TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        action_type TEXT,
        agent TEXT,
        details_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_log (
        id TEXT PRIMARY KEY,
        date TEXT UNIQUE,
        claude_calls INTEGER DEFAULT 0,
        usage_percent REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS processed_replies (
        reply_id TEXT PRIMARY KEY,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
    CREATE INDEX IF NOT EXISTS idx_prospects_company_id ON prospects(company_id);
    CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
    CREATE INDEX IF NOT EXISTS idx_prospects_email ON prospects(email);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
    CREATE INDEX IF NOT EXISTS idx_feedback_entity ON feedback(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_log(date);
    """,
    # ── v2: normalize identity keys, dedup, uniqueness ──
    """
    UPDATE prospects SET email = LOWER(TRIM(email)) WHERE email != LOWER(TRIM(email));
    UPDATE companies SET domain = LOWER(TRIM(domain)) WHERE domain != LOWER(TRIM(domain));

    DELETE FROM prospects WHERE email != '' AND rowid NOT IN (
        SELECT MIN(rowid) FROM prospects WHERE email != '' GROUP BY email
    );
    DELETE FROM prospects WHERE linkedin_url != '' AND rowid NOT IN (
        SELECT MIN(rowid) FROM prospects WHERE linkedin_url != '' GROUP BY linkedin_url
    );
    DELETE FROM companies WHERE domain != '' AND rowid NOT IN (
        SELECT MIN(rowid) FROM companies WHERE domain != '' GROUP BY domain
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_prospects_email
        ON prospects(email) WHERE email != '';
    CREATE UNIQUE INDEX IF NOT EXISTS uq_prospects_linkedin
        ON prospects(linkedin_url) WHERE linkedin_url != '';
    CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_domain
        ON companies(domain) WHERE domain != '';

    CREATE INDEX IF NOT EXISTS idx_conversations_campaign_id ON conversations(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_prospect_id ON conversations(prospect_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_intent ON conversations(intent);
    CREATE INDEX IF NOT EXISTS idx_prospects_name_company
        ON prospects(LOWER(first_name), LOWER(last_name), LOWER(company));
    CREATE INDEX IF NOT EXISTS idx_prospects_status_updated ON prospects(status, updated_at);
    CREATE INDEX IF NOT EXISTS idx_actions_created_at ON actions(created_at);
    """,
    # ── v3: per-call usage accounting ──
    """
    CREATE TABLE IF NOT EXISTS usage_events (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        agent TEXT DEFAULT '',
        task TEXT DEFAULT '',
        session_id TEXT DEFAULT '',
        request_key TEXT DEFAULT '',
        model TEXT DEFAULT '',
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        cache_read_tokens INTEGER DEFAULT 0,
        cache_creation_tokens INTEGER DEFAULT 0,
        cost_usd REAL DEFAULT 0.0,
        duration_ms INTEGER DEFAULT 0,
        num_turns INTEGER DEFAULT 0,
        is_error INTEGER DEFAULT 0,
        source TEXT DEFAULT 'result_json'
    );

    CREATE INDEX IF NOT EXISTS idx_usage_events_created ON usage_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_usage_events_agent ON usage_events(agent);
    CREATE INDEX IF NOT EXISTS idx_usage_events_session ON usage_events(session_id);
    CREATE UNIQUE INDEX IF NOT EXISTS uq_usage_events_request
        ON usage_events(request_key) WHERE request_key != '';
    """,
    # ── v4: email statuses + per-domain pattern cache ──
    """
    ALTER TABLE prospects ADD COLUMN email_status TEXT DEFAULT '';
    UPDATE prospects SET email_status = 'guess', email_verified = 0 WHERE email != '';

    CREATE TABLE IF NOT EXISTS email_patterns (
        domain TEXT PRIMARY KEY,
        pattern TEXT DEFAULT '',
        source TEXT DEFAULT '',
        confidence REAL DEFAULT 0.0,
        mx_type TEXT DEFAULT '',
        is_catch_all INTEGER DEFAULT -1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # ── v5: buying signals on companies ──
    """
    ALTER TABLE companies ADD COLUMN tech_stack_json TEXT DEFAULT '[]';
    ALTER TABLE companies ADD COLUMN signals_json TEXT DEFAULT '[]';
    """,
    # ── v6: outbox & settings ──
    """
    CREATE TABLE IF NOT EXISTS outbox (
        id TEXT PRIMARY KEY,
        campaign_id TEXT DEFAULT '',
        prospect_id TEXT DEFAULT '',
        conversation_id TEXT DEFAULT '',
        step INTEGER DEFAULT 1,
        kind TEXT DEFAULT 'sequence',
        to_email TEXT DEFAULT '',
        subject TEXT DEFAULT '',
        body TEXT DEFAULT '',
        status TEXT DEFAULT 'pending_review',
        send_at TIMESTAMP,
        sent_at TIMESTAMP,
        provider TEXT DEFAULT '',
        message_id TEXT DEFAULT '',
        thread_ref TEXT DEFAULT '',
        in_reply_to TEXT DEFAULT '',
        error TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_campaign_step
        ON outbox(campaign_id, prospect_id, step)
        WHERE campaign_id != '' AND kind = 'sequence';
    CREATE INDEX IF NOT EXISTS idx_outbox_status_send_at ON outbox(status, send_at);
    CREATE INDEX IF NOT EXISTS idx_outbox_prospect ON outbox(prospect_id);

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT DEFAULT '',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """,
    # ── v7: observation model & signal codes ──
    """
    CREATE TABLE IF NOT EXISTS signal_codes (
        code TEXT PRIMARY KEY,
        label TEXT DEFAULT '',
        description TEXT DEFAULT '',
        category TEXT DEFAULT '',
        value_type TEXT DEFAULT 'text',
        collector TEXT DEFAULT '',
        cost_note TEXT DEFAULT '',
        status TEXT DEFAULT 'proposed',
        confidence_floor REAL DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS observations (
        id TEXT PRIMARY KEY,
        company_id TEXT DEFAULT '',
        prospect_id TEXT DEFAULT '',
        signal_code TEXT NOT NULL,
        collector TEXT DEFAULT '',
        value_num REAL,
        value_text TEXT DEFAULT '',
        confidence REAL DEFAULT 1.0,
        evidence_url TEXT DEFAULT '',
        observed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        run_id TEXT DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_obs_company ON observations(company_id);
    CREATE INDEX IF NOT EXISTS idx_obs_signal ON observations(signal_code);
    CREATE INDEX IF NOT EXISTS idx_obs_company_signal
        ON observations(company_id, signal_code, observed_at);
    CREATE INDEX IF NOT EXISTS idx_obs_run ON observations(run_id);

    CREATE TRIGGER IF NOT EXISTS trg_observations_signal_known
    BEFORE INSERT ON observations
    FOR EACH ROW
    WHEN NEW.signal_code NOT IN (SELECT code FROM signal_codes)
    BEGIN
        SELECT RAISE(ABORT, 'unknown signal_code: not in signal_codes vocabulary');
    END;

    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        stage TEXT DEFAULT '',
        status TEXT DEFAULT 'running',
        provider TEXT DEFAULT '',
        records INTEGER DEFAULT 0,
        cost_usd REAL DEFAULT 0.0,
        params_json TEXT DEFAULT '{}',
        error TEXT DEFAULT '',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_runs_stage_started ON runs(stage, started_at);
    """,
    # ── v8: discovery entity resolution ──
    """
    ALTER TABLE companies ADD COLUMN external_id TEXT DEFAULT '';
    ALTER TABLE companies ADD COLUMN phone TEXT DEFAULT '';
    CREATE UNIQUE INDEX IF NOT EXISTS uq_companies_external
        ON companies(external_id) WHERE external_id != '';
    """,
    # ── v9: prospect-backfill attempts ──
    """
    ALTER TABLE companies ADD COLUMN prospects_checked_at TIMESTAMP DEFAULT NULL;
    """,
    # ── v10: profile collector attempt tracking ──
    """
    ALTER TABLE companies ADD COLUMN profile_checked_at TIMESTAMP DEFAULT NULL;
    UPDATE companies SET profile_checked_at = (
        SELECT MAX(observed_at) FROM observations
        WHERE observations.company_id = companies.id
          AND observations.collector = 'profile'
    ) WHERE id IN (
        SELECT DISTINCT company_id FROM observations WHERE collector = 'profile'
    );
    """,
    # ── v11: provider attribution ──
    """
    ALTER TABLE usage_events ADD COLUMN provider TEXT DEFAULT 'ollama';
    CREATE INDEX IF NOT EXISTS idx_usage_events_provider ON usage_events(provider);
    ALTER TABLE usage_log ADD COLUMN codex_calls INTEGER DEFAULT 0;
    """,
    # ── v12: action type index ──
    """
    CREATE INDEX IF NOT EXISTS idx_actions_type_created ON actions(action_type, created_at);
    """,
    # ── v13: outbox approval tracking ──
    """
    ALTER TABLE outbox ADD COLUMN approved_by TEXT DEFAULT '';
    UPDATE outbox SET approved_by = 'earlier' WHERE status IN ('approved', 'sending');
    """,
    # ── v14: recipient timezone ──
    """
    ALTER TABLE prospects ADD COLUMN timezone TEXT DEFAULT '';
    """,
    # ── v15: suppressions table ──
    """
    CREATE TABLE IF NOT EXISTS suppressions (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        value TEXT NOT NULL,
        reason TEXT DEFAULT 'manual',
        source TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uq_suppressions_kind_value ON suppressions(kind, value);
    """,
    # ── v16: multiple sending mailboxes ──
    """
    CREATE TABLE IF NOT EXISTS mailboxes (
        id TEXT PRIMARY KEY,
        address TEXT NOT NULL UNIQUE,
        display_name TEXT DEFAULT '',
        provider TEXT NOT NULL,
        connection TEXT NOT NULL,
        state TEXT DEFAULT 'active',
        paused_reason TEXT DEFAULT '',
        cap_override INTEGER,
        credential_ref TEXT DEFAULT '',
        settings_json TEXT DEFAULT '{}',
        warmup_started_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS campaign_mailboxes (
        campaign_id TEXT NOT NULL,
        mailbox_id TEXT NOT NULL,
        PRIMARY KEY (campaign_id, mailbox_id)
    );
    ALTER TABLE outbox ADD COLUMN mailbox_id TEXT DEFAULT '';
    ALTER TABLE conversations ADD COLUMN mailbox_id TEXT DEFAULT '';
    CREATE INDEX IF NOT EXISTS idx_outbox_mailbox_sent ON outbox(mailbox_id, status, sent_at);
    """,
    # ── v17: Multi-Product, Multi-ICP, Business Profile, Scoring & Signals ──
    """
    CREATE TABLE IF NOT EXISTS business_profiles (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        website TEXT DEFAULT '',
        tagline TEXT DEFAULT '',
        overview TEXT DEFAULT '',
        industry TEXT DEFAULT '',
        business_model TEXT DEFAULT 'B2B',
        target_geography TEXT DEFAULT 'Global',
        value_proposition TEXT DEFAULT '',
        competitors_json TEXT DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        tagline TEXT DEFAULT '',
        description TEXT NOT NULL,
        value_proposition TEXT NOT NULL,
        pricing_tier TEXT NOT NULL DEFAULT 'Pro',
        target_industries_json TEXT DEFAULT '[]',
        key_features_json TEXT DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_icps (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        target_roles_json TEXT NOT NULL DEFAULT '[]',
        target_company_sizes_json TEXT NOT NULL DEFAULT '[]',
        target_industries_json TEXT NOT NULL DEFAULT '[]',
        key_pain_points_json TEXT NOT NULL DEFAULT '[]',
        qualification_rules_json TEXT NOT NULL DEFAULT '[]',
        min_fit_score REAL NOT NULL DEFAULT 65.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_scores (
        id TEXT PRIMARY KEY,
        prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        fit_score REAL NOT NULL,
        fit_tier TEXT NOT NULL DEFAULT 'medium',
        fit_reasons_json TEXT DEFAULT '[]',
        affinity_rank INTEGER NOT NULL DEFAULT 1,
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(prospect_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS buying_signals (
        id TEXT PRIMARY KEY,
        prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,
        company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
        signal_type TEXT NOT NULL,
        headline TEXT NOT NULL,
        detail TEXT DEFAULT '',
        source_url TEXT DEFAULT '',
        confidence REAL DEFAULT 1.0,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS local_system_settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_product_icps_product ON product_icps(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_scores_prospect ON product_scores(prospect_id);
    CREATE INDEX IF NOT EXISTS idx_product_scores_product ON product_scores(product_id);
    CREATE INDEX IF NOT EXISTS idx_buying_signals_prospect ON buying_signals(prospect_id);
    CREATE INDEX IF NOT EXISTS idx_buying_signals_company ON buying_signals(company_id);
    """
]
