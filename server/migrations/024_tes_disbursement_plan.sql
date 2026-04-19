-- ================================================================
-- Migration 024: TES Disbursement Plan
-- Stores per-installment disbursement schedules for TES applications
-- ================================================================

CREATE TABLE IF NOT EXISTS tes_disbursement_tranches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id   UUID NOT NULL REFERENCES tes_applications(id) ON DELETE CASCADE,
  tranche_number   INT  NOT NULL,
  label            VARCHAR(100),
  planned_amount   NUMERIC(12,2) NOT NULL,
  planned_date     DATE NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'planned'
                     CHECK (status IN ('planned','disbursed','skipped')),
  disbursed_amount NUMERIC(12,2),
  disbursed_date   DATE,
  notes            TEXT,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tdt_application ON tes_disbursement_tranches(application_id);
