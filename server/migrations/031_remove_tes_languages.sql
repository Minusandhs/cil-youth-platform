-- ================================================================
-- Migration 031: Remove Language Proficiency from TES Applications
-- Language proficiency now lives in the Talents & Skills module
-- (participant_talents, category = 'language'). The per-batch
-- language fields on tes_applications are no longer collected.
-- ================================================================

ALTER TABLE tes_applications
  DROP COLUMN IF EXISTS lang_english,
  DROP COLUMN IF EXISTS lang_sinhala,
  DROP COLUMN IF EXISTS lang_tamil;
