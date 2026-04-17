-- Migration 004: Fix z_score column precision
ALTER TABLE al_results 
ALTER COLUMN z_score TYPE DECIMAL(8,4);
