-- ================================================================
-- Migration 001: Add participant status history table
-- ================================================================
CREATE TABLE IF NOT EXISTS participant_status_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id  UUID NOT NULL REFERENCES participants(id)
                    ON DELETE CASCADE,
    status          VARCHAR(50) NOT NULL,
    institution     VARCHAR(150),
    course          VARCHAR(150),
    year_level      VARCHAR(50),
    notes           TEXT,
    recorded_by     UUID REFERENCES users(id),
    recorded_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_participant
    ON participant_status_history(participant_id);
