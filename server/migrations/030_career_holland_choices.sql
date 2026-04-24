-- ================================================================
-- Migration 030: Holland Code & Top 3 Career Choices
-- Extends participant_career_plans with:
--   - holland_primary / secondary / tertiary  (RIASEC: R, I, A, S, E, C)
--   - career_choice_1 / 2 / 3                 (free-text career choices)
-- All fields are optional.
-- ================================================================

ALTER TABLE participant_career_plans
  ADD COLUMN IF NOT EXISTS holland_primary   VARCHAR(1)
    CHECK (holland_primary   IS NULL OR holland_primary   IN ('R','I','A','S','E','C')),
  ADD COLUMN IF NOT EXISTS holland_secondary VARCHAR(1)
    CHECK (holland_secondary IS NULL OR holland_secondary IN ('R','I','A','S','E','C')),
  ADD COLUMN IF NOT EXISTS holland_tertiary  VARCHAR(1)
    CHECK (holland_tertiary  IS NULL OR holland_tertiary  IN ('R','I','A','S','E','C')),
  ADD COLUMN IF NOT EXISTS career_choice_1   TEXT,
  ADD COLUMN IF NOT EXISTS career_choice_2   TEXT,
  ADD COLUMN IF NOT EXISTS career_choice_3   TEXT;
