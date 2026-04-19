-- ================================================================
-- Migration 020: Development Plan Redesign
-- Replaces blob fields + history model with structured action items
-- and mentor conversations.
-- ================================================================

-- 1. Action items list (replaces actions/resources_needed/timeline)
CREATE TABLE IF NOT EXISTS development_plan_action_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  goal_type   VARCHAR(60) NOT NULL,
  action      TEXT NOT NULL,
  due_date    DATE,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','completed','cancelled')),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 2. Mentor conversations (replaces development_plan_history)
CREATE TABLE IF NOT EXISTS mentor_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
  conversation_date TIMESTAMP NOT NULL,
  discussion_points TEXT NOT NULL,
  next_meeting_date DATE,
  completion_rate   INTEGER DEFAULT 0 CHECK (completion_rate BETWEEN 0 AND 100),
  recorded_by       UUID REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW()
);

-- 3. Drop old history tables
DROP TABLE IF EXISTS development_plan_goal_snapshots;
DROP TABLE IF EXISTS development_plan_history;

-- 4. Drop unused columns from development_plans
ALTER TABLE development_plans
  DROP COLUMN IF EXISTS actions,
  DROP COLUMN IF EXISTS resources_needed,
  DROP COLUMN IF EXISTS timeline,
  DROP COLUMN IF EXISTS progress_notes,
  DROP COLUMN IF EXISTS mentor_contact,
  DROP COLUMN IF EXISTS mentor_notes,
  DROP COLUMN IF EXISTS last_reviewed,
  DROP COLUMN IF EXISTS next_review;
