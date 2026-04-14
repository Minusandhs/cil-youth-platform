-- Migration 011: Add national_admin role
-- National admins can read all data but cannot create, edit, or delete anything.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'ldc_staff', 'national_admin'));
