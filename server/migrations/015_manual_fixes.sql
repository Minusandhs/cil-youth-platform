-- Manual fixes previously listed as "Manual" in PROGRESS.md
-- Unified into a single migration file for v1.0.4

-- 1. Add financial fields to tes_applications if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tes_applications' AND column_name='fee_tuition') THEN
        ALTER TABLE tes_applications ADD COLUMN fee_tuition DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tes_applications' AND column_name='fee_materials') THEN
        ALTER TABLE tes_applications ADD COLUMN fee_materials DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tes_applications' AND column_name='family_contribution') THEN
        ALTER TABLE tes_applications ADD COLUMN family_contribution DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tes_applications' AND column_name='requested_amount') THEN
        ALTER TABLE tes_applications ADD COLUMN requested_amount DECIMAL(12,2) DEFAULT 0;
    END IF;
END $$;

-- 2. Add living_outside_ldc fields to participant_profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participant_profiles' AND column_name='living_outside_ldc') THEN
        ALTER TABLE participant_profiles ADD COLUMN living_outside_ldc BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participant_profiles' AND column_name='outside_purpose') THEN
        ALTER TABLE participant_profiles ADD COLUMN outside_purpose TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participant_profiles' AND column_name='outside_location') THEN
        ALTER TABLE participant_profiles ADD COLUMN outside_location TEXT;
    END IF;
END $$;

-- 3. Fix status constraints (check if we need to drop and recreate)
-- This is safer as a separate DO block or individual ALTERs with error handling
ALTER TABLE tes_applications DROP CONSTRAINT IF EXISTS tes_applications_approval_status_check;
ALTER TABLE tes_applications ADD CONSTRAINT tes_applications_approval_status_check 
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'resubmitted'));

ALTER TABLE tes_batches DROP CONSTRAINT IF EXISTS tes_batches_status_check;
ALTER TABLE tes_batches ADD CONSTRAINT tes_batches_status_check 
    CHECK (status IN ('open', 'reviewing', 'approved', 'funded', 'completed', 'rejected'));
