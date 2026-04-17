-- ================================================================
-- Migration 002: Add subjects master list table
-- ================================================================
CREATE TABLE IF NOT EXISTS subjects (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_name   VARCHAR(100) NOT NULL,
    subject_type   VARCHAR(10) NOT NULL
                   CHECK (subject_type IN ('ol', 'al', 'both')),
    is_core        BOOLEAN DEFAULT false,
    is_active      BOOLEAN DEFAULT true,
    display_order  INTEGER DEFAULT 0,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- ── OL Subjects ──────────────────────────────────────────────────
-- Core subjects
INSERT INTO subjects (subject_name, subject_type, is_core, display_order) VALUES
('Sinhala',                      'ol', true,  1),
('Tamil',                        'ol', true,  2),
('English',                      'ol', true,  3),
('Mathematics',                  'ol', true,  4),
('Science',                      'ol', true,  5),
('History',                      'ol', true,  6),
('Religion (Buddhism)',          'ol', true,  7),
('Religion (Hinduism)',          'ol', true,  8),
('Religion (Islam)',             'ol', true,  9),
('Religion (Christianity)',      'ol', true,  10);

-- Optional subjects
INSERT INTO subjects (subject_name, subject_type, is_core, display_order) VALUES
('ICT',                          'ol', false, 11),
('Art',                          'ol', false, 12),
('Music',                        'ol', false, 13),
('Drama & Theatre',              'ol', false, 14),
('Home Economics',               'ol', false, 15),
('Health & Physical Education',  'ol', false, 16),
('Commerce',                     'ol', false, 17),
('Agriculture & Food Technology','ol', false, 18),
('Technical Drawing',            'ol', false, 19),
('Oriental Music',               'ol', false, 20),
('Western Music',                'ol', false, 21),
('Dancing',                      'ol', false, 22),
('Geography',                    'ol', false, 23),
('Civic Education',              'ol', false, 24);

-- ── AL Subjects ──────────────────────────────────────────────────
-- Physical Science
INSERT INTO subjects (subject_name, subject_type, is_core, display_order) VALUES
('Physics',                      'al', false, 30),
('Chemistry',                    'al', false, 31),
('Combined Mathematics',         'al', false, 32),
('Biology',                      'al', false, 33),
-- Biological Science
('Agriculture',                  'al', false, 34),
-- Commerce
('Economics',                    'al', false, 35),
('Business Studies',             'al', false, 36),
('Accounting',                   'al', false, 37),
-- Arts
('Geography',                    'al', false, 38),
('Political Science',            'al', false, 39),
('Logic & Scientific Method',    'al', false, 40),
('History',                      'al', false, 41),
('Economics (Arts)',             'al', false, 42),
('Sinhala',                      'al', false, 43),
('Tamil',                        'al', false, 44),
('English',                      'al', false, 45),
('Buddhist Civilization',        'al', false, 46),
('Hindu Civilization',           'al', false, 47),
('Islam Civilization',           'al', false, 48),
('Christian Civilization',       'al', false, 49),
-- Technology
('Engineering Technology',       'al', false, 50),
('Bio Systems Technology',       'al', false, 51),
('ICT',                          'al', false, 52),
-- General subjects (all streams)
('General English',              'al', true,  60),
('General IT',                   'al', true,  61),
('Common General Test',          'al', true,  62);

CREATE INDEX IF NOT EXISTS idx_subjects_type
    ON subjects(subject_type, is_active);
