-- ================================================================
-- MIGRATION 016: EDUCATIONAL DATA HANDLING CHANGE
-- ================================================================

-- 1. DROP old fields from participant_profiles
ALTER TABLE participant_profiles 
DROP COLUMN IF EXISTS ol_status,
DROP COLUMN IF EXISTS ol_completion_year,
DROP COLUMN IF EXISTS al_status,
DROP COLUMN IF EXISTS al_completion_year;

-- 2. ADD new fields to participant_profiles
ALTER TABLE participant_profiles 
ADD COLUMN IF NOT EXISTS current_exam_type VARCHAR(100);

-- 3. UPDATE current_status CHECK constraint
-- PostgreSQL doesn't allow direct ALTER on CHECK constraints easily,
-- so we drop and recreate it.
ALTER TABLE participant_profiles DROP CONSTRAINT IF EXISTS participant_profiles_current_status_check;
ALTER TABLE participant_profiles ADD CONSTRAINT participant_profiles_current_status_check 
CHECK (current_status IN (
    'studying_school',
    'studying_tertiary',
    'studying_vocational',
    'studying_completed_exam',  -- New
    'studying_waiting_result',   -- New
    'employed_full',
    'employed_part',
    'self_employed',
    'unemployed_seeking',
    'unemployed_not',
    'other'
));

-- 4. ADD new fields to ol_results
ALTER TABLE ol_results 
ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_after JSONB DEFAULT '[]'::jsonb;

-- 5. ADD new fields to al_results
ALTER TABLE al_results 
ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_after JSONB DEFAULT '[]'::jsonb;
