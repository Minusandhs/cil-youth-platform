-- ================================================================
-- MIGRATION 017: REMOVE 'studying_completed_exam' FROM current_status
-- ================================================================

-- 1. UPDATE existing records to 'other' in both profile and history
UPDATE participant_profiles 
SET current_status = 'other' 
WHERE current_status = 'studying_completed_exam';

UPDATE participant_status_history
SET status = 'other'
WHERE status = 'studying_completed_exam';

-- 2. DROP and RECREATE the CHECK constraint
ALTER TABLE participant_profiles DROP CONSTRAINT IF EXISTS participant_profiles_current_status_check;

ALTER TABLE participant_profiles ADD CONSTRAINT participant_profiles_current_status_check 
CHECK (current_status IN (
    'studying_school',
    'studying_tertiary',
    'studying_vocational',
    'studying_waiting_result',
    'employed_full',
    'employed_part',
    'self_employed',
    'unemployed_seeking',
    'unemployed_not',
    'other'
));
