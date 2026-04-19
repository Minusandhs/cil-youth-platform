-- ================================================================
-- Migration 021: Participant Needs & Risks Tracking
-- Adds two tables: live entries + append-only audit history
-- ================================================================

-- 1. Main log — current state of each need/risk entry
CREATE TABLE IF NOT EXISTS participant_needs_risks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  type           VARCHAR(10)  NOT NULL CHECK (type IN ('need', 'risk')),
  category       VARCHAR(100) NOT NULL,
  severity       VARCHAR(10)  NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  status         VARCHAR(20)  NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open', 'in_progress', 'resolved')),
  notes          TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pnr_participant ON participant_needs_risks(participant_id);

-- 2. Audit history — one row per field change, never deleted
CREATE TABLE IF NOT EXISTS participant_needs_risks_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES participant_needs_risks(id) ON DELETE CASCADE,
  changed_field VARCHAR(20)  NOT NULL,
  old_value     VARCHAR(50)  NOT NULL,
  new_value     VARCHAR(50)  NOT NULL,
  changed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pnr_history_entry ON participant_needs_risks_history(entry_id);
