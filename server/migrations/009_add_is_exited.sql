-- Migration 009: Add is_exited flag to participants
-- Run: docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/009_add_is_exited.sql

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS is_exited  BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS exited_at  TIMESTAMP;
