-- ================================================================
-- Migration 005: Certificate types and certifications tables
-- ================================================================

-- ── Certificate Types (admin controlled master list) ─────────────
CREATE TABLE IF NOT EXISTS cert_types (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name      VARCHAR(100) NOT NULL,
    has_nvq_level  BOOLEAN DEFAULT false,
    is_active      BOOLEAN DEFAULT true,
    display_order  INTEGER DEFAULT 0,
    created_at     TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_cert_type UNIQUE (type_name)
);

-- ── Seed default certificate types ───────────────────────────────
INSERT INTO cert_types (type_name, has_nvq_level, display_order) VALUES
('Vocational',   true,  1),
('Professional', false, 2),
('Academic',     false, 3),
('IT',           false, 4),
('Language',     false, 5),
('Leadership',   false, 6),
('Other',        false, 7);

-- ── Certifications (per participant) ─────────────────────────────
CREATE TABLE IF NOT EXISTS certifications (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id   UUID NOT NULL REFERENCES participants(id)
                     ON DELETE CASCADE,
    cert_type_id     UUID NOT NULL REFERENCES cert_types(id)
                     ON DELETE RESTRICT,
    cert_name        VARCHAR(200) NOT NULL,
    issuing_body     VARCHAR(150),
    issued_date      DATE,
    expiry_date      DATE,
    grade_result     VARCHAR(50),
    nvq_level        INTEGER
                     CHECK (nvq_level BETWEEN 1 AND 7),
    results_verified BOOLEAN DEFAULT false,
    notes            TEXT,
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certifications_participant
    ON certifications(participant_id);

CREATE INDEX IF NOT EXISTS idx_certifications_type
    ON certifications(cert_type_id);
