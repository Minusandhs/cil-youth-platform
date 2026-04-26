-- ================================================================
-- Migration 033: Add 'language' to participant_talents category check
-- The talents config (server/config/talents_categories.js) added an
-- 8th category, 'language' (Language Proficiency), but the original
-- CHECK constraint from migration 027 only allowed the original 7.
-- Inserts of language entries failed with a constraint violation.
-- ================================================================

ALTER TABLE participant_talents
  DROP CONSTRAINT IF EXISTS participant_talents_category_check;

ALTER TABLE participant_talents
  ADD CONSTRAINT participant_talents_category_check
  CHECK (category IN (
    'digital','cognitive','creative','social',
    'communication','athletic','practical','language'
  ));
