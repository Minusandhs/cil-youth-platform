-- ================================================================
-- CIL Youth Development Platform — Database Schema
-- Compassion International Lanka
-- Version: 1.1
-- Updated: Added participant sync support, expanded profiles,
--          split school level, added marital/family fields
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE 1: LDCs (Local Development Centres)
-- ================================================================
CREATE TABLE IF NOT EXISTS ldcs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ldc_id          VARCHAR(20) UNIQUE NOT NULL,    -- e.g. LK0401
    name            VARCHAR(150) NOT NULL,           -- LDC full name
    region          VARCHAR(100),                    -- Region/district
    church_partner  VARCHAR(150),                    -- Partner church name
    address         TEXT,                            -- Physical address
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 2: USERS (System accounts)
-- Super admin + LDC staff login accounts
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username        VARCHAR(50) UNIQUE NOT NULL,     -- Login username
    password_hash   VARCHAR(255) NOT NULL,           -- bcrypt hashed password
    full_name       VARCHAR(150) NOT NULL,           -- Display name
    email           VARCHAR(150) UNIQUE,             -- Optional email
    role            VARCHAR(20) NOT NULL             -- 'super_admin' or 'ldc_staff'
                    CHECK (role IN ('super_admin', 'ldc_staff')),
    ldc_id          UUID REFERENCES ldcs(id)         -- NULL for super_admin
                    ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT true,            -- Can be deactivated
    last_login      TIMESTAMP,                       -- Track last login
    created_by      UUID REFERENCES users(id)        -- Who created this account
                    ON DELETE SET NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 3: PARTICIPANTS (Master participant records)
-- Imported from Salesforce — supports upsert (add/update anytime)
-- Use participant_id as the unique Salesforce key for syncing
-- ================================================================
CREATE TABLE IF NOT EXISTS participants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      VARCHAR(20) UNIQUE NOT NULL, -- Salesforce ID e.g. LK040100069
    ldc_id              UUID NOT NULL REFERENCES ldcs(id)
                        ON DELETE RESTRICT,
    full_name           VARCHAR(150) NOT NULL,
    date_of_birth       DATE,
    gender              VARCHAR(10)
                        CHECK (gender IN ('Male', 'Female', 'Other')),
    planned_completion  DATE,                        -- Programme completion date
    is_active           BOOLEAN DEFAULT true,        -- Active in programme
    is_graduated        BOOLEAN DEFAULT false,       -- Graduated/exited
    graduation_date     DATE,
    notes               TEXT,                        -- General notes
    -- Sync tracking
    last_synced_at      TIMESTAMP DEFAULT NOW(),     -- Last Salesforce sync
    sync_batch          VARCHAR(50),                 -- Batch label e.g. "Jan 2025 Upload"
    imported_by         UUID REFERENCES users(id)    -- Who uploaded this batch
                        ON DELETE SET NULL,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 4: OL RESULTS (core record)
-- O/Level examination core information
-- ================================================================
CREATE TABLE IF NOT EXISTS ol_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      UUID NOT NULL REFERENCES participants(id)
                        ON DELETE CASCADE,
    exam_year           INTEGER NOT NULL,            -- e.g. 2022
    index_number        VARCHAR(20),                 -- Exam index number
    school_name         VARCHAR(150),
    no_of_passes        INTEGER,                     -- Number of subjects passed
    passed              BOOLEAN DEFAULT false,       -- Overall pass
    plan_after          JSONB DEFAULT '[]'::jsonb,    -- Multi-select plans
    results_verified    BOOLEAN DEFAULT false,       -- Verified by LDC staff
    notes               TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    -- One OL record per participant per year
    UNIQUE (participant_id, exam_year)
);

-- ================================================================
-- TABLE 5: OL RESULT SUBJECTS (flexible subjects)
-- Stores each subject separately — unlimited subjects per result
-- ================================================================
CREATE TABLE IF NOT EXISTS ol_result_subjects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ol_result_id    UUID NOT NULL REFERENCES ol_results(id)
                    ON DELETE CASCADE,
    subject_name    VARCHAR(100) NOT NULL,           -- e.g. Mathematics, Science
    grade           VARCHAR(5)                       -- A, B, C, S, F, AB
                    CHECK (grade IN ('A', 'B', 'C', 'S', 'F', 'AB', 'W')),
    is_core         BOOLEAN DEFAULT false,           -- Core/mandatory subject
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 6: AL RESULTS (core record)
-- A/Level examination core information
-- ================================================================
CREATE TABLE IF NOT EXISTS al_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      UUID NOT NULL REFERENCES participants(id)
                        ON DELETE CASCADE,
    exam_year           INTEGER NOT NULL,            -- e.g. 2024
    index_number        VARCHAR(20),
    school_name         VARCHAR(150),
    stream              VARCHAR(50)                  -- Subject stream
                        CHECK (stream IN (
                            'Physical Science',
                            'Biological Science',
                            'Commerce',
                            'Arts',
                            'Technology',
                            'Engineering Technology',
                            'Bio Systems Technology',
                            'Other'
                        )),
    medium              VARCHAR(20)                  -- Exam medium
                        CHECK (medium IN ('Sinhala', 'Tamil', 'English')),
    z_score             DECIMAL(6,4),                -- e.g. 1.2345
    passed              BOOLEAN DEFAULT false,       -- Overall pass
    plan_after          JSONB DEFAULT '[]'::jsonb,    -- Multi-select plans
    district_rank       INTEGER,
    island_rank         INTEGER,
    university_selected BOOLEAN DEFAULT false,       -- Selected for university
    university_name     VARCHAR(150),
    course_selected     VARCHAR(150),
    results_verified    BOOLEAN DEFAULT false,
    notes               TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    -- One AL record per participant per year
    UNIQUE (participant_id, exam_year)
);

-- ================================================================
-- TABLE 7: AL RESULT SUBJECTS (flexible subjects)
-- Stores each subject separately
-- ================================================================
CREATE TABLE IF NOT EXISTS al_result_subjects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    al_result_id    UUID NOT NULL REFERENCES al_results(id)
                    ON DELETE CASCADE,
    subject_name    VARCHAR(100) NOT NULL,
    grade           VARCHAR(5)
                    CHECK (grade IN ('A', 'B', 'C', 'S', 'F', 'W')),
    subject_type    VARCHAR(20) DEFAULT 'main'
                    CHECK (subject_type IN (
                        'main',         -- 3 main AL subjects
                        'general'       -- General English, General IT, Common General
                    )),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 8: CERTIFICATIONS & CERT_TYPES
-- Other qualifications, courses, achievements
-- ================================================================

CREATE TABLE IF NOT EXISTS cert_types (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name      VARCHAR(100) NOT NULL,
    has_nvq_level  BOOLEAN DEFAULT false,
    is_active      BOOLEAN DEFAULT true,
    display_order  INTEGER DEFAULT 0,
    created_at     TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_cert_type UNIQUE (type_name)
);

INSERT INTO cert_types (type_name, has_nvq_level, display_order) VALUES
('Vocational',   true,  1),
('Professional', false, 2),
('Academic',     false, 3),
('IT',           false, 4),
('Language',     false, 5),
('Leadership',   false, 6),
('Other',        false, 7)
ON CONFLICT (type_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS certifications (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id   UUID NOT NULL REFERENCES participants(id)
                     ON DELETE CASCADE,
    cert_type_id     UUID NOT NULL REFERENCES cert_types(id)
                     ON DELETE RESTRICT,
    cert_name        VARCHAR(200) NOT NULL,           -- Certificate/course name
    issuing_body     VARCHAR(150),                    -- Institution/organization
    issued_date      DATE,
    expiry_date      DATE,                            -- NULL if no expiry
    grade_result     VARCHAR(50),                     -- Grade or result
    nvq_level        INTEGER                          -- NVQ level 1-7
                     CHECK (nvq_level BETWEEN 1 AND 7),
    results_verified BOOLEAN DEFAULT false,
    notes            TEXT,
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMP DEFAULT NOW(),
    updated_at       TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 9: PARTICIPANT PROFILES
-- Current status, family background, future plans
-- ================================================================
CREATE TABLE IF NOT EXISTS participant_profiles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      UUID UNIQUE NOT NULL REFERENCES participants(id)
                        ON DELETE CASCADE,

    -- ── PERSONAL & FAMILY STATUS ──────────────────────────────
    marital_status      VARCHAR(20)
                        CHECK (marital_status IN (
                            'single',
                            'married',
                            'divorced',
                            'widowed',
                            'separated'
                        )),
    is_pregnant         BOOLEAN DEFAULT false,       -- Current pregnancy status
    number_of_children  INTEGER DEFAULT 0,           -- Number of children

    -- ── CURRENT STATUS & EDUCATION ────────────────────────────
    current_status      VARCHAR(50)
                        CHECK (current_status IN (
                            'studying_school',       -- Still in school
                            'studying_tertiary',     -- University/college
                            'studying_vocational',   -- Vocational training
                            'studying_waiting_result',-- Waiting for result
                            'employed_full',         -- Full time employment
                            'employed_part',         -- Part time employment
                            'self_employed',         -- Self employed
                            'unemployed_seeking',    -- Seeking employment
                            'unemployed_not',        -- Not seeking
                            'other'
                        )),
    current_institution VARCHAR(150),                -- School/university/employer
    current_course      VARCHAR(150),                -- Course/job title
    current_year        VARCHAR(50),                 -- Year level or duration
    current_exam_type   VARCHAR(100),                -- Exam Type (A/L, O/L, etc.)
    monthly_income      DECIMAL(10,2),               -- If employed (LKR)

    -- ── FUTURE PLANS ──────────────────────────────────────────
    long_term_plan      TEXT,                        -- Plans within 5 years
    career_goal         TEXT,                        -- Ultimate career aspiration
    further_education   BOOLEAN DEFAULT false,       -- Plans for further education
    education_details   TEXT,                        -- Details of education plans

    -- ── FAMILY BACKGROUND ─────────────────────────────────────
    family_income       DECIMAL(10,2),               -- Monthly family income LKR
    no_of_dependants    INTEGER,                     -- Number of family dependants
    other_assistance    TEXT,                        -- Other scholarships/support

    -- ── PROFILE METADATA ──────────────────────────────────────
    profile_completed   BOOLEAN DEFAULT false,
    last_updated_by     UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- ================================================================
-- TABLE 10: DEVELOPMENT PLANS
-- Individual development plans created by LDC staff per year
-- ================================================================
CREATE TABLE IF NOT EXISTS development_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      UUID NOT NULL REFERENCES participants(id)
                        ON DELETE CASCADE,
    plan_year           INTEGER NOT NULL,            -- e.g. 2025

    -- ── DEVELOPMENT GOALS ─────────────────────────────────────
    spiritual_goal      TEXT,                        -- Spiritual development
    academic_goal       TEXT,                        -- Academic development
    social_goal         TEXT,                        -- Social/community development
    vocational_goal     TEXT,                        -- Vocational/career development
    health_goal         TEXT,                        -- Physical/mental health

    -- ── ACTION PLAN ───────────────────────────────────────────
    actions             TEXT,                        -- Planned actions/activities
    resources_needed    TEXT,                        -- Support/resources required
    timeline            TEXT,                        -- Timeline for goals

    -- ── PROGRESS TRACKING ─────────────────────────────────────
    progress_status     VARCHAR(20) DEFAULT 'not_started'
                        CHECK (progress_status IN (
                            'not_started',
                            'in_progress',
                            'completed',
                            'on_hold'
                        )),
    progress_notes      TEXT,                        -- Progress update notes
    completion_rate     INTEGER DEFAULT 0            -- 0-100 percentage
                        CHECK (completion_rate BETWEEN 0 AND 100),

    -- ── MENTOR DETAILS ────────────────────────────────────────
    primary_mentor      VARCHAR(150),
    mentor_contact      VARCHAR(50),
    mentor_notes        TEXT,

    -- ── REVIEW SCHEDULE ───────────────────────────────────────
    last_reviewed       DATE,
    next_review         DATE,

    -- ── METADATA ──────────────────────────────────────────────
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    -- One plan per participant per year
    UNIQUE (participant_id, plan_year)
);

-- ================================================================
-- TABLE 11: TES APPLICATIONS
-- Tertiary Education Scholarship applications
-- TES applicants are a subset of general participants
-- ================================================================
CREATE TABLE IF NOT EXISTS tes_applications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id      UUID NOT NULL REFERENCES participants(id)
                        ON DELETE RESTRICT,
    application_year    INTEGER NOT NULL,
    batch_id            VARCHAR(20),

    -- ── EDUCATION ─────────────────────────────────────────────
    institution_name    VARCHAR(150),
    course_name         VARCHAR(150),
    course_duration     INTEGER,                     -- Duration in years
    course_year         INTEGER,                     -- Current year of course
    institution_type    VARCHAR(50),

    -- ── FINANCIAL ─────────────────────────────────────────────
    monthly_income      DECIMAL(10,2),               -- Family income LKR
    no_of_dependants    INTEGER,
    other_assistance    TEXT,
    financial_justification TEXT,
    support_type        VARCHAR(50),

    -- ── SCORING (7 criteria) ──────────────────────────────────
    score_c1_income     INTEGER DEFAULT 0,
    score_c2_academic   INTEGER DEFAULT 0,
    score_c3_career     INTEGER DEFAULT 0,
    score_c4_labour     INTEGER DEFAULT 0,
    score_c5_mentor     INTEGER DEFAULT 0,
    score_c6_competing  INTEGER DEFAULT 0,
    score_c7_attendance INTEGER DEFAULT 0,
    is_disqualified     BOOLEAN DEFAULT false,
    dq_reason           TEXT,
    total_score         INTEGER DEFAULT 0,
    score_percentage    DECIMAL(5,2),
    verdict             VARCHAR(20) DEFAULT 'pending'
                        CHECK (verdict IN (
                            'recommended',
                            'conditional',
                            'not_recommended',
                            'disqualified',
                            'pending'
                        )),
    rationale           TEXT,

    -- ── COMMUNITY ─────────────────────────────────────────────
    community_plan      TEXT,
    ldc_attendance      VARCHAR(50),
    primary_mentor      VARCHAR(150),
    mentor_contact      VARCHAR(50),
    field_mentor        VARCHAR(150),
    mentor_role         VARCHAR(100),
    mentor_status       VARCHAR(50),

    -- ── DOCUMENTS CHECKLIST ───────────────────────────────────
    doc_application     BOOLEAN DEFAULT false,
    doc_ol_certificate  BOOLEAN DEFAULT false,
    doc_al_certificate  BOOLEAN DEFAULT false,
    doc_admission       BOOLEAN DEFAULT false,
    doc_income          BOOLEAN DEFAULT false,
    doc_recommendation  BOOLEAN DEFAULT false,
    doc_photo           BOOLEAN DEFAULT false,

    -- ── OFFICIAL USE (Admin) ──────────────────────────────────
    reviewed_by         VARCHAR(150),
    reviewer_position   VARCHAR(100),
    approved_by         VARCHAR(150),
    approver_position   VARCHAR(100),
    approval_status     VARCHAR(20) DEFAULT 'pending'
                        CHECK (approval_status IN (
                            'pending',
                            'approved',
                            'conditional',
                            'rejected'
                        )),
    amount_approved     DECIMAL(10,2),
    official_comments   TEXT,
    approval_date       DATE,

    -- ── METADATA ──────────────────────────────────────────────
    submitted_by        UUID REFERENCES users(id),
    submitted_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    -- One application per participant per year
    UNIQUE (participant_id, application_year)
);

-- ================================================================
-- INDEXES — Speed up common queries
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_participants_ldc
    ON participants(ldc_id);
CREATE INDEX IF NOT EXISTS idx_participants_pid
    ON participants(participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_sync
    ON participants(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_users_ldc
    ON users(ldc_id);
CREATE INDEX IF NOT EXISTS idx_ol_results_participant
    ON ol_results(participant_id);
CREATE INDEX IF NOT EXISTS idx_ol_subjects_result
    ON ol_result_subjects(ol_result_id);
CREATE INDEX IF NOT EXISTS idx_al_results_participant
    ON al_results(participant_id);
CREATE INDEX IF NOT EXISTS idx_al_subjects_result
    ON al_result_subjects(al_result_id);
CREATE INDEX IF NOT EXISTS idx_certifications_participant
    ON certifications(participant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_participant
    ON participant_profiles(participant_id);
CREATE INDEX IF NOT EXISTS idx_dev_plans_participant
    ON development_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_dev_plans_year
    ON development_plans(plan_year);
CREATE INDEX IF NOT EXISTS idx_tes_participant
    ON tes_applications(participant_id);
CREATE INDEX IF NOT EXISTS idx_tes_year
    ON tes_applications(application_year);

-- ================================================================
-- SEED DATA — Default super admin account
-- Username: superadmin
-- Password: CIL@admin2025 (change immediately after first login)
-- ================================================================
INSERT INTO users (
    username,
    password_hash,
    full_name,
    role
) VALUES (
    'superadmin',
    '$2a$10$Gfkg/JrqqDimIOZdfRH.0uITVuIUseMiOKwhyMOveSpZ4q76WGfQy',
    'Super Administrator',
    'super_admin'
) ON CONFLICT (username) DO NOTHING;