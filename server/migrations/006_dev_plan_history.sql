-- ================================================================
-- Migration 006: Development plan history tracking
-- ================================================================

-- ── Plan History (every save creates a record) ───────────────────
CREATE TABLE IF NOT EXISTS development_plan_history (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id          UUID NOT NULL REFERENCES development_plans(id)
                     ON DELETE CASCADE,
    change_type      VARCHAR(20) NOT NULL
                     CHECK (change_type IN ('goals', 'progress', 'both')),
    progress_status  VARCHAR(20) NOT NULL,
    completion_rate  INTEGER NOT NULL DEFAULT 0
                     CHECK (completion_rate BETWEEN 0 AND 100),
    notes            TEXT NOT NULL,
    recorded_by      UUID REFERENCES users(id),
    recorded_at      TIMESTAMP DEFAULT NOW()
);

-- ── Goal Snapshots (captures goals at each history point) ────────
CREATE TABLE IF NOT EXISTS development_plan_goal_snapshots (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    history_id       UUID NOT NULL REFERENCES development_plan_history(id)
                     ON DELETE CASCADE,
    spiritual_goal   TEXT,
    academic_goal    TEXT,
    social_goal      TEXT,
    vocational_goal  TEXT,
    health_goal      TEXT
);

CREATE INDEX IF NOT EXISTS idx_dev_history_plan
    ON development_plan_history(plan_id);
CREATE INDEX IF NOT EXISTS idx_dev_snapshots_history
    ON development_plan_goal_snapshots(history_id);
