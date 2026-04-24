-- ================================================================
-- Migration 029: Career Module
-- Three tables:
--   1. participant_career_plans     — one record per participant
--      (career aspiration, industry, long-term plan, further ed,
--       job interest flag).
--   2. participant_career_readiness — per-item readiness checklist
--      (cv_prepared, interview_skills, ...).
--   3. participant_career_readiness_history — append-only audit log
--      for readiness changes.
-- ================================================================

-- 1. Career plan — single row per participant
CREATE TABLE IF NOT EXISTS participant_career_plans (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id       UUID NOT NULL UNIQUE
                         REFERENCES participants(id) ON DELETE CASCADE,
  career_aspiration    TEXT,
  aspired_industry     VARCHAR(50),
  long_term_plan       TEXT,
  further_education    BOOLEAN DEFAULT FALSE,
  education_details    TEXT,
  interested_to_apply  BOOLEAN DEFAULT FALSE,
  interest_industry    VARCHAR(50),
  interest_notes       TEXT,
  created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcp_participant
  ON participant_career_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_pcp_interested
  ON participant_career_plans(interested_to_apply)
  WHERE interested_to_apply = TRUE;

-- 2. Readiness checklist — one row per (participant, item)
CREATE TABLE IF NOT EXISTS participant_career_readiness (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  item            VARCHAR(50) NOT NULL,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date  DATE,
  notes           TEXT,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_id, item)
);

CREATE INDEX IF NOT EXISTS idx_pcr_participant
  ON participant_career_readiness(participant_id);

-- 3. Readiness history — append-only audit log
CREATE TABLE IF NOT EXISTS participant_career_readiness_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL
                  REFERENCES participant_career_readiness(id) ON DELETE CASCADE,
  changed_field VARCHAR(20) NOT NULL,
  old_value     TEXT,
  new_value     TEXT,
  changed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pcrh_entry
  ON participant_career_readiness_history(entry_id);
