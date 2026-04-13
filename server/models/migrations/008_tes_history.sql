-- ================================================================
-- Migration 008: TES Support History per Participant
-- ================================================================

CREATE TABLE IF NOT EXISTS participant_tes_history (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id   UUID NOT NULL REFERENCES participants(id)
                     ON DELETE CASCADE,
    batch_id         UUID NOT NULL REFERENCES tes_batches(id)
                     ON DELETE RESTRICT,
    application_id   UUID NOT NULL REFERENCES tes_applications(id)
                     ON DELETE RESTRICT,
    batch_name       VARCHAR(200) NOT NULL,
    institution_name VARCHAR(200),
    course_name      VARCHAR(200),
    institution_type VARCHAR(50),
    course_duration  INTEGER,
    course_year      INTEGER,
    amount_received  DECIMAL(12,2),
    status           VARCHAR(20) NOT NULL DEFAULT 'funded'
                     CHECK (status IN ('funded','completed','reverted')),
    recorded_at      TIMESTAMP DEFAULT NOW(),
    recorded_by      UUID REFERENCES users(id),
    UNIQUE (application_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_tes_history_participant
    ON participant_tes_history(participant_id);
CREATE INDEX IF NOT EXISTS idx_tes_history_batch
    ON participant_tes_history(batch_id);
