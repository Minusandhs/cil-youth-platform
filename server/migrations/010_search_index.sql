-- Migration 010: GIN index on participants.full_name for faster search
-- Apply with:
-- docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/010_search_index.sql

CREATE INDEX IF NOT EXISTS idx_participants_fullname_gin
  ON participants USING gin (to_tsvector('simple', full_name));

CREATE INDEX IF NOT EXISTS idx_participants_participant_id
  ON participants (participant_id);
