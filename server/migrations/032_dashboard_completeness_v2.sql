-- ================================================================
-- Migration 032: Dashboard completeness v2
-- The dashboard_snapshots payload now includes monthly mentor and
-- monthly home-visit coverage metrics (replacing the old "ever
-- visited" metric). Stale snapshots are dropped so the next
-- /api/dashboard/summary request lazy-rebuilds with the new shape.
-- ================================================================

TRUNCATE dashboard_snapshots;
