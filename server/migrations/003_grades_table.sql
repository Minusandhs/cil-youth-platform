-- ================================================================
-- Migration 003: Add grades master list table
-- ================================================================
CREATE TABLE IF NOT EXISTS grades (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_name     VARCHAR(10) NOT NULL,
    grade_type     VARCHAR(10) NOT NULL
                   CHECK (grade_type IN ('ol', 'al', 'both')),
    description    VARCHAR(100),
    is_pass        BOOLEAN DEFAULT true,
    is_active      BOOLEAN DEFAULT true,
    display_order  INTEGER DEFAULT 0,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- ── OL Grades ────────────────────────────────────────────────────
INSERT INTO grades (grade_name, grade_type, description, is_pass, display_order) VALUES
('A',  'ol', 'Distinction',   true,  1),
('B',  'ol', 'Merit',         true,  2),
('C',  'ol', 'Credit',        true,  3),
('S',  'ol', 'Simple Pass',   true,  4),
('F',  'ol', 'Fail',          false, 5),
('AB', 'ol', 'Absent',        false, 6),
('W',  'ol', 'Withdrawn',     false, 7);

-- ── AL Grades ────────────────────────────────────────────────────
INSERT INTO grades (grade_name, grade_type, description, is_pass, display_order) VALUES
('A',  'al', 'Distinction',   true,  1),
('B',  'al', 'Merit',         true,  2),
('C',  'al', 'Credit',        true,  3),
('S',  'al', 'Simple Pass',   true,  4),
('F',  'al', 'Fail',          false, 5),
('W',  'al', 'Withdrawn',     false, 6);

CREATE INDEX IF NOT EXISTS idx_grades_type
    ON grades(grade_type, is_active);
