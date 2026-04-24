-- ================================================================
-- Migration 028: Dashboard Snapshots
-- Caches precomputed dashboard summaries so /api/dashboard/summary
-- doesn't re-aggregate on every request. Refreshed nightly by a
-- scheduled job and on-demand via POST /api/dashboard/refresh.
-- ================================================================

CREATE TABLE IF NOT EXISTS dashboard_snapshots (
  scope        TEXT PRIMARY KEY,
  payload      JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
