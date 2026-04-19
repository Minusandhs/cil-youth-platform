-- Migration 014: Ensure email column exists on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150) UNIQUE;
