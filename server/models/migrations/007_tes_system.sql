-- ================================================================
-- Migration 007: TES Batch and Application System
-- ================================================================

-- ── TES Batches ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tes_batches (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name           VARCHAR(200) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','closed','approved','funded','rejected')),
    opened_at            TIMESTAMP DEFAULT NOW(),
    application_end_date DATE NOT NULL,
    funded_date          DATE,
    update_notes         TEXT,
    created_by           UUID REFERENCES users(id),
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);

-- ── TES Applications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tes_applications (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id             UUID NOT NULL REFERENCES tes_batches(id)
                         ON DELETE RESTRICT,
    participant_id       UUID NOT NULL REFERENCES participants(id)
                         ON DELETE RESTRICT,
    ldc_id               UUID NOT NULL REFERENCES ldcs(id),
    submitted_by         UUID REFERENCES users(id),
    status               VARCHAR(20) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','approved','rejected')),

    -- ── Contact ──────────────────────────────────────────────────
    contact_number       VARCHAR(20),
    email                VARCHAR(150),
    nic_number           VARCHAR(20),
    guardian_name        VARCHAR(150),

    -- ── Language Proficiency ──────────────────────────────────────
    lang_english         VARCHAR(20)
                         CHECK (lang_english IN
                           ('beginner','intermediate','advanced','proficient')),
    lang_sinhala         VARCHAR(20)
                         CHECK (lang_sinhala IN
                           ('beginner','intermediate','advanced','proficient')),
    lang_tamil           VARCHAR(20)
                         CHECK (lang_tamil IN
                           ('beginner','intermediate','advanced','proficient')),

    -- ── Institution ──────────────────────────────────────────────
    institution_name     VARCHAR(200),
    institution_type     VARCHAR(50)
                         CHECK (institution_type IN
                           ('university','college','vocational','other')),
    course_name          VARCHAR(200),
    course_duration      INTEGER,
    course_year          INTEGER,
    course_start_date    DATE,
    course_end_date      DATE,
    registration_number  VARCHAR(50),

    -- ── Financial & Community ─────────────────────────────────────
    financial_justification TEXT,
    community_contribution  TEXT,

    -- ── Documents ────────────────────────────────────────────────
    doc_application_form BOOLEAN DEFAULT false,
    doc_certificates     BOOLEAN DEFAULT false,
    doc_admission_letter BOOLEAN DEFAULT false,
    doc_income_proof     BOOLEAN DEFAULT false,
    doc_nic              BOOLEAN DEFAULT false,
    doc_recommendation   BOOLEAN DEFAULT false,
    commitment_confirmed BOOLEAN DEFAULT false,

    -- ── Official Use ─────────────────────────────────────────────
    amount_approved      DECIMAL(12,2),
    approval_status      VARCHAR(20) DEFAULT 'pending'
                         CHECK (approval_status IN
                           ('pending','approved','rejected')),
    official_notes       TEXT,
    reviewed_by          UUID REFERENCES users(id),
    reviewed_at          TIMESTAMP,

    -- ── Metadata ─────────────────────────────────────────────────
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW(),

    -- One application per participant per batch
    UNIQUE (batch_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_tes_batches_status
    ON tes_batches(status);
CREATE INDEX IF NOT EXISTS idx_tes_apps_batch
    ON tes_applications(batch_id);
CREATE INDEX IF NOT EXISTS idx_tes_apps_participant
    ON tes_applications(participant_id);
CREATE INDEX IF NOT EXISTS idx_tes_apps_ldc
    ON tes_applications(ldc_id);
CREATE INDEX IF NOT EXISTS idx_tes_apps_status
    ON tes_applications(approval_status);
