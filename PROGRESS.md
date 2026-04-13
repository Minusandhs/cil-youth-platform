# CIL Youth Development Platform — Progress Log

## Project Overview
Full-stack web application for Compassion International Lanka (CIL) to manage
participant progress tracking and TES scholarship applications.

- GitHub: https://github.com/Minusandhs/cil-youth-platform
- Stack: React + Vite + Tailwind (frontend) | Node.js + Express (backend) | PostgreSQL 16 | Docker
- Run: docker compose up
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/health

---

## Credentials (Development Only — Delete Before Deploy)
Role        | Username     | Password
------------|--------------|---------------
Super Admin | superadmin   | CIL@admin2025
LDC Staff   | lk0101staff  | Test@1234
LDC Staff 2 | lk0101staff2 | Test@1234

---

## Completed Features

### Foundation
- Docker + PostgreSQL 16 setup
- JWT authentication with role-based access (super_admin, ldc_staff)
- Login page with role-based redirect

### Admin Dashboard
- Overview — live stats (users, LDCs, participants, TES)
- LDC Management — create/edit/deactivate/reactivate
- User Management — create/edit/reset PW/deactivate
- Participant Sync — Salesforce CSV upload (upsert)
- Participant List — search/filter + View Profile button
- Subject Management — OL/AL master list, duplicate prevention
- Grade Management — OL/AL grade master list, duplicate prevention
- Cert Type Management — certificate category master list
- TES Batch Management — full batch lifecycle

### LDC Staff Dashboard
- Participants — filtered by LDC, search, View Profile
- TES Batches — list, apply, view, days-left countdown, export Excel

### Participant Profile (Admin + LDC)
Accessible from both Admin and LDC dashboards

Personal Info
- View/edit mode with dynamic status fields
- Status history tracking
- School level (OL/AL status)
- Family background (income, dependants, assistance)
- Future plans (short/long term, career goal)
- Living outside LDC (checkbox + purpose + location)

Academic Records
- OL results — flexible subjects from master list
- AL results — streams, z-score, university selection
- Dynamic grades from master list
- Duplicate subject prevention (frontend + backend)

Certifications
- Card view, add/edit/delete
- Admin-controlled certificate types
- NVQ level conditional display
- Expiry indicator

Development Plan
- One plan per year with year selector (locked after creation)
- 5 goal categories (Spiritual, Academic, Social, Vocational, Health)
- Action plan + mentor + review schedule
- Progress bar (click segments)
- Full history with goal snapshots
- Notes mandatory only when updating progress

TES History
- Full TES support history per participant
- Total amount received (excluding reverted)
- Auto-recorded when batch marked Funded or Completed
- Reverted entries marked clearly

### LDC Staff Dashboard Overview (new first tab)
- Overview tab added as first tab in LDC Dashboard (pushing Participants and TES Batches to 2nd/3rd)
- Summary: Active Participants for their LDC only
- TES section: Approved/Completed, Pending, Rejected, Total Disbursed — filtered to their LDC
- Participant Information: same layout as admin (status breakdown, TES type, personal stats, TES amount) — no filter needed, always their LDC
- Data Export: same 5 buttons as admin, exports their LDC data only
- Backend: /api/auth/stats and all /api/participants/overview + export endpoints now support ldc_staff (auto-filter by req.user.ldc_id, no requireSuperAdmin)
- Bug fixed: double-WHERE SQL error in stats/overview endpoints (AND vs WHERE)
- Bug fixed: STATUS_LABELS corrected — unemployed_seeking + unemployed_not (was wrong key 'unemployed')

### Admin Dashboard Overview (rebuilt)
- Section 1 — Summary: Users, LDC Centres, Active Participants (global)
- Section 2 — TES Stats: Approved/Completed, Pending, Rejected counts + Total Disbursed (global)
- Section 3 — Participant Information (filterable by LDC dropdown):
  - Status breakdown with bar chart (Studying/Employed/etc.)
  - TES by Institution Type (University/College/Vocational/Other) from tes_history
  - Personal stats: Married, Has Children, Pregnant, Living Outside LDC
  - Total TES amount for selected LDC
- Section 4 — Data Export (5 separate buttons, respect LDC filter):
  - Participants (personal info + condensed OL/AL/Certs)
  - Academic Records (full OL + AL subject detail)
  - Certifications (all certifications)
  - Development Plans (goals, progress, mentors)
  - TES History (amounts per batch)
- Quick Actions removed
- Backend: /api/auth/stats expanded; 6 new endpoints on /api/participants/

### Participant Exit Locking
- `is_exited` + `exited_at` columns added to participants table (migration 009)
- Sync route auto-marks participants absent from CSV (but in synced LDCs) as exited
- Participants who reappear in a future CSV are automatically re-activated
- Sync result now shows "Exited (Locked)" count alongside inserted/updated/errors
- All profile write routes (profile, status-history, OL, AL, certifications, dev plan) block LDC staff edits with 403 if participant is exited — admins are never blocked
- Participant lists show orange EXITED badge next to name
- Profile page shows EXITED badge in header + orange 🔒 locked banner for LDC staff
- All tab edit/add/create/delete buttons hidden via `readOnly` prop when locked

### TES System

Batch Lifecycle
OPEN -> REVIEWING -> APPROVED -> FUNDED -> COMPLETED
                 -> REJECTED
- Manual open/close/reopen at any stage
- Deadline tracking with days-left countdown
- Completed/Rejected batches hidden by default (toggle to show)

Applications
- Participant search + auto-fill (personal, OL/AL/certs, future plans)
- Language proficiency grid (English/Sinhala/Tamil x 4 levels)
- Institution and course information
- Financial section (tuition + materials - family = requested, auto-calculated)
- Financial justification + community contribution
- Document checklist (6 docs)
- Commitment confirmation
- Previous TES support banner (for returning applicants)
- For Official Use Only (LDC fills amount + notes)
- Admin decision (approve/reject + admin notes)
- Resubmission flow (rejected -> LDC edits -> resubmitted status)
- Remove application (LDC, open batch, pending only)
- Excel export (Admin = all LDCs, LDC = own only)

---

## Database Tables
participants
participant_profiles
participant_status_history
participant_tes_history
ldcs
users
ol_results + ol_result_subjects
al_results + al_result_subjects
certifications
cert_types
development_plans
development_plan_history
development_plan_goal_snapshots
tes_batches
tes_applications
subjects
grades

## Migrations Applied
001 - participant_status_history
002 - subjects table + OL/AL seed data
003 - grades table + seed data
004 - Fix z_score DECIMAL precision
005 - cert_types + certifications
006 - dev plan history + snapshots
007 - tes_batches + tes_applications
008 - participant_tes_history
009 - is_exited + exited_at on participants
Manual - Add fee_tuition, fee_materials, family_contribution, requested_amount to tes_applications
Manual - Add living_outside_ldc, outside_purpose, outside_location to participant_profiles
Manual - Fix tes_applications status constraint (add resubmitted)
Manual - Fix tes_batches status constraint (add reviewing, completed)

---

## Key Technical Decisions
- Subjects/grades/cert-types are admin-controlled master lists
- OL/AL use flexible subject tables (not fixed columns)
- Development plan history snapshots goals on every save
- TES history auto-recorded when batch marked funded/completed
- Batch "close" renamed to "reviewing" for clarity
- Admin can access all participant profiles (any role route)
- Living outside LDC tracked with purpose and location

---

## Pre-Deployment Tasks
- Delete test participants (LK010100001 to LK010100005)
- Delete test OL/AL/certification/dev plan data
- Delete test TES applications and batches
- Delete test users (lk0101staff, lk0101staff2)
- Keep only real LDC centres and super admin account
- Set strong production passwords
- Configure production environment variables
- Deploy to DigitalOcean ($6/month droplet)

---

## Remaining Work
- Final testing across all modules
- Pre-deployment data cleanup
- Production deployment

## Session Notes
- Claude Code (not Claude chat) is being used to continue development from this point forward
- Claude Code has full file access, can run Docker commands, apply migrations, and rebuild containers
- Apply migrations with: `docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/NNN_name.sql`
- Rebuild after backend/frontend changes: `docker compose down && docker compose up --build -d`

---

## Lessons Learned
- Use cat > terminal commands to write files (VS Code paste causes encoding issues)
- Always rebuild Docker after file changes: docker compose down && docker compose up --build
- Docker only runs schema.sql on first startup — use migrations for DB changes
- Apply migrations: docker exec -i cil_db psql -U cil_admin -d cil_platform < migration.sql
- Batch status "closed" was confusing — renamed to "reviewing" for clarity
- Always check both frontend AND backend when data isn't saving