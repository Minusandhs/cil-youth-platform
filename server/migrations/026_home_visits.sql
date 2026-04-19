CREATE TABLE IF NOT EXISTS participant_home_visits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id   UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  visited_date     DATE NOT NULL,
  visited_time     TIME,
  purpose          TEXT NOT NULL,
  people_in_home   TEXT,
  discussion_points TEXT,
  suggestions      TEXT,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phv_participant ON participant_home_visits(participant_id);
