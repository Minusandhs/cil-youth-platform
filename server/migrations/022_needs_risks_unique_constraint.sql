-- ================================================================
-- Migration 022: Unique constraint on participant needs/risks
-- Prevents logging the same category twice for one participant
-- ================================================================

ALTER TABLE participant_needs_risks
  ADD CONSTRAINT uq_participant_needs_risks
  UNIQUE (participant_id, type, category);
