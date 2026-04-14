-- ================================================================
-- Migration 012 — Separate admin_notes from LDC official_notes
-- ================================================================
-- official_notes  = notes entered by LDC staff (For Official Use)
-- admin_notes     = notes entered by admin when making decision
-- ================================================================

ALTER TABLE tes_applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
