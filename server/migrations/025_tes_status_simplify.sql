-- ================================================================
-- Migration 025: Simplify TES batch status lifecycle
-- Merges 'reviewing' and 'approved' into 'closed'
-- New lifecycle: open → closed → funded → completed | rejected
-- ================================================================

-- Migrate existing data
UPDATE tes_batches SET status = 'closed' WHERE status IN ('reviewing', 'approved');

-- Replace the CHECK constraint
ALTER TABLE tes_batches DROP CONSTRAINT IF EXISTS tes_batches_status_check;
ALTER TABLE tes_batches ADD CONSTRAINT tes_batches_status_check
  CHECK (status IN ('open','closed','funded','completed','rejected'));
