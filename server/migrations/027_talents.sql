-- ================================================================
-- Migration 027: Participant Talents
-- Records participant strengths across 7 categories at 5 proficiency
-- levels (Emerging, Developing, Proficient, Advanced, Mastery).
-- Two tables: live entries + append-only audit history.
-- ================================================================

-- 1. Main table — current state of each talent rating
--    One row per (participant, category, talent) combination.
CREATE TABLE IF NOT EXISTS participant_talents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  category       VARCHAR(30) NOT NULL CHECK (category IN (
                   'digital','cognitive','creative','social',
                   'communication','athletic','practical'
                 )),
  talent         VARCHAR(50) NOT NULL,
  level          VARCHAR(15) NOT NULL CHECK (level IN (
                   'emerging','developing','proficient','advanced','mastery'
                 )),
  notes          TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (participant_id, category, talent)
);

CREATE INDEX IF NOT EXISTS idx_pt_participant ON participant_talents(participant_id);

-- 2. History — append-only audit log of level/notes changes
CREATE TABLE IF NOT EXISTS participant_talents_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES participant_talents(id) ON DELETE CASCADE,
  changed_field VARCHAR(20) NOT NULL,
  old_value     TEXT NOT NULL,
  new_value     TEXT NOT NULL,
  changed_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pt_history_entry ON participant_talents_history(entry_id);
