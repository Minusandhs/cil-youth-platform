-- ================================================================
-- Migration 023: TES Monitoring Fields
-- Adds monitoring_status and disbursed_amount to tes_applications
-- so LDC staff can track real-world outcomes after a batch is funded
-- ================================================================

ALTER TABLE tes_applications
  ADD COLUMN IF NOT EXISTS monitoring_status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (monitoring_status IN ('not_started','continuing','stopped','temporarily_stopped','other')),
  ADD COLUMN IF NOT EXISTS disbursed_amount  NUMERIC(10,2);
