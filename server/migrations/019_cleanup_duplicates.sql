-- ================================================================
-- Migration 019: Cleanup duplicates and enforce constraints
-- ================================================================

-- 1. Deduplicate subjects table
DELETE FROM subjects a USING (
    SELECT MIN(id::text) as min_id, subject_name, subject_type
    FROM subjects
    GROUP BY subject_name, subject_type
    HAVING COUNT(*) > 1
) b
WHERE a.subject_name = b.subject_name
  AND a.subject_type = b.subject_type
  AND a.id::text <> b.min_id;

-- Add unique constraint to subjects
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS unique_subject_type;
ALTER TABLE subjects ADD CONSTRAINT unique_subject_type UNIQUE (subject_name, subject_type);

-- 2. Deduplicate grades table
DELETE FROM grades a USING (
    SELECT MIN(id::text) as min_id, grade_name, grade_type
    FROM grades
    GROUP BY grade_name, grade_type
    HAVING COUNT(*) > 1
) b
WHERE a.grade_name = b.grade_name
  AND a.grade_type = b.grade_type
  AND a.id::text <> b.min_id;

-- Add unique constraint to grades
ALTER TABLE grades DROP CONSTRAINT IF EXISTS unique_grade_type;
ALTER TABLE grades ADD CONSTRAINT unique_grade_type UNIQUE (grade_name, grade_type);

-- 3. Deduplicate school_grade_levels table
DELETE FROM school_grade_levels a USING (
    SELECT MIN(id) as min_id, grade_label
    FROM school_grade_levels
    GROUP BY grade_label
    HAVING COUNT(*) > 1
) b
WHERE a.grade_label = b.grade_label
  AND a.id <> b.min_id;

-- Add unique constraint to school_grade_levels
ALTER TABLE school_grade_levels DROP CONSTRAINT IF EXISTS unique_grade_label;
ALTER TABLE school_grade_levels ADD CONSTRAINT unique_grade_label UNIQUE (grade_label);
