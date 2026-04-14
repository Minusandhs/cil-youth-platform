-- ================================================================
-- Migration 013 — School Grade Levels reference table
-- ================================================================
-- Configurable school grade levels (Grade 1 – Grade 13).
-- Admin can add/rename/deactivate via the Grades management tab.
-- ================================================================

CREATE TABLE IF NOT EXISTS school_grade_levels (
  id          SERIAL PRIMARY KEY,
  grade_label VARCHAR(100) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- Seed default Sri Lankan school grade levels
INSERT INTO school_grade_levels (grade_label, sort_order) VALUES
  ('Grade 1',                       1),
  ('Grade 2',                       2),
  ('Grade 3',                       3),
  ('Grade 4',                       4),
  ('Grade 5',                       5),
  ('Grade 6',                       6),
  ('Grade 7',                       7),
  ('Grade 8',                       8),
  ('Grade 9',                       9),
  ('Grade 10',                     10),
  ('Grade 11 (O/L)',                11),
  ('Grade 12 (A/L First Year)',     12),
  ('Grade 13 (A/L Second Year)',    13)
ON CONFLICT DO NOTHING;
