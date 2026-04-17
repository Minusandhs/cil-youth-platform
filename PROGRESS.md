# CIL Youth Development Platform — Progress Log

## Project Overview
Full-stack web application for Compassion International Lanka (CIL) to manage
participant progress tracking and TES scholarship applications.

- **GitHub:** https://github.com/Minusandhs/cil-youth-platform
- **Live:** https://cilyouth.org (v1.0.4 — production)
- **Stack:** React + Vite + Tailwind (frontend) | Node.js + Express (backend) | PostgreSQL 16 | Docker + nginx + Let's Encrypt
- **Local dev:** `docker compose up` → http://localhost:3000
- **Deploy:** `./deploy.sh` (one command)

---

## Credentials

### Development (local only)
| Role | Username | Password |
|---|---|---|
| Super Admin | superadmin | CIL@admin2025 |
| LDC Staff | lk0101staff | Test@1234 |
| LDC Staff 2 | lk0101staff2 | Test@1234 |

### Production Server
| Item | Value |
|---|---|
| Server | DigitalOcean Droplet — Ubuntu 24.04 LTS |
| IP | 143.244.141.100 |
| SSH | `ssh cil-server` (key: `~/.ssh/cil_platform`) |
| App path | /opt/cil-platform |
| .env path | /opt/cil-platform/.env |

---

## Version History

### v1.0.4 — 2026-04-17 — AWS SES Migration & Core UX Fixes
**Status: Pending deployment...**

#### Backend & Infrastructure
- **Email Migration:** Switched from Google OAuth2/Nodemailer to AWS SES SDK (Port 443)
- **Region:** eu-north-1 (Stockholm)
- **Domain Verification:** Verified `cilyouth.org` with DKIM (3 CNAME records)
- **Sender:** Updated to `notifications@cilyouth.org` for DKIM-signed inbox delivery
- **Startup:** Added SES connectivity verification on server boot
- **Clean-up:** Removed obsolete Google OAuth2 variables and Nodemailer dependency

#### Bug Fixes & Improvements
- **Login Redirect:** Fixed loop allowing authenticated users to see the login page
- **National Admin:** Fixed dashboard blank page and corrected role-based routing in `PrivateRoute`
- **TES Admin UX:** Added View/Edit toggle for "Admin Decision" section with a clean read-only state
- **Codebase:** Consolidated all 14 database migrations into `server/migrations/`

### v1.0.1 — 2026-04-15 — Mobile Responsive Overhaul & UX Polish
**Status: Deployed to production ✓**

#### Mobile Responsive Design (major)
- **Header redesign (all 3 dashboards):** ☰ hamburger button in header (gold, highly visible); CIL badge + title side by side; Sign Out / Change Password moved into ☰ dropdown under a distinct "Account" section with darker background
- **Participant cards:** Custom CSS Grid layout on mobile — avatar circle (initial letter), name + ID sub-text, age/gender/completion in 3-col row, action buttons in flex-wrap row. Data-label field names removed. Sync Batch / Status hidden on mobile cards
- **TES batch application cards:** Participant name + institution/course sub-text, status badge + approved amount side by side, action buttons row
- **Participant Summary Bar (profile page):** 3-row mobile layout — Row 1: avatar + name/ID, Row 2: age + gender badge, Row 3: DOB + completion date
- **Search bars:** Input full-width on Row 1, Search + Clear buttons 50/50 on Row 2
- **Tables as cards:** All 10 management tables use `rsp-card-table` + `rsp-card-wrap` — desktop shows bordered container, mobile strips wrapper and shows row-cards with data labels
- **Reference Data sub-tabs:** Horizontally scrollable on mobile (was overflowing at ~480px)
- **TES Language Proficiency (form):** Desktop matrix table hidden on mobile; replaced with pill-style radio buttons (gold highlight for selected level)
- **TES Language Proficiency (detail view):** Desktop matrix hidden; mobile shows simple language → level badge rows. Scroll lock bug fixed (separated `rsp-hide-mobile` div from the `overflowX:auto` scroll container to prevent iOS scroll context leak)
- **TES Financial grid:** `1fr 1fr 1fr 1fr` → `rsp-grid-4` (collapses to 2-col on mobile)
- **TES Personal Info grid:** `1fr 1fr 1fr` → `rsp-grid-3`
- **All admin section headers:** `rsp-section-header` class — stack title + action button vertically on mobile
- **All admin form grids:** `rsp-grid-3` class — 3-col → 2-col → 1-col on mobile
- **Grid item overflow fix:** `min-width: 0` on all grid children (prevents grid items from overflowing their columns)
- **Export buttons (both Admin + LDC Overview):** `rsp-export-row` class — 2-column grid on mobile, buttons 100% width
- **Header top padding increased** (`8px 12px` → `14px 16px`); **sub-header tab bar padding decreased** (tab label `13px 0` → `7px 0`)
- **Deactivate/Reactivate button:** Desktop shows below name in Summary Bar; mobile shows as full-width row after stats

#### UX / Visual Polish
- **All View / View Profile buttons:** Unified to cream `#f0ece2` + `#3d3528` text + `#d4c9b0` border — consistent across all tables (Admin participant list, LDC participant list, TES batch detail, TES batch management)
- **Sign-out confirmation:** `window.confirm()` dialog before signing out (all dashboards, both desktop and mobile)
- **Placeholder text:** Removed from all 68 form inputs across 17 files
- **Vite hot-reload in Docker:** Added `usePolling: true` — file changes on Windows now auto-reload without container restart

#### Form & Validation
- Personal Info: removed `other_assistance` field; made 9 fields mandatory (marital status, OL/AL status, current status, short/long term plan, career goal, family income, no. of dependants)
- Personal Info: OL/AL results required in Academic Records before saving when status is Completed
- Personal Info: School grade dropdown populated from configurable DB table (not hardcoded)
- Academic Records: removed `no_of_passes` field from OL form
- Certifications: removed `expiry_date` from add/edit form (existing records still show it)
- TES Application: full mandatory field validation on submit (9 profile fields + Institution Type, Course Duration, Course Start/End Date, Tuition Fee, Amount Approved)
- TES Application: OL/AL results check before submission

#### TES System
- Separated LDC notes (`official_notes`) from Admin notes (`admin_notes`) — migration 012
- Admin Notes field upgraded to `<textarea>` in application detail view
- Participant Records quick-links in application detail (Academic Records, Certifications, Development Plan — all open in new tab)
- TES batch links in participant profile open at correct tab via `?tab=` URL param

#### Admin Dashboard
- Reference Data tab replaces 3 separate tabs (Subjects, Grades, Cert Types) — cleaner navigation
- Reference Data sub-tabs: Subjects / Exam Grades / School Grades / Cert Types
- School Grade Levels: new configurable reference table (Grade 1–13 seeded, admin-manageable)
- All roles (including national_admin) can change their own password

#### New Files
- `server/migrations/011_national_admin_role.sql`
- `server/migrations/012_tes_admin_notes.sql`
- `server/migrations/013_school_grade_levels.sql`
- `server/routes/schoolGrades.js`
- `client/src/components/admin/ReferenceData.jsx`
- `client/src/components/admin/SchoolGradeManagement.jsx`
- `client/vite.config.js` — added `usePolling: true` for Docker hot-reload

---

### v1.0.0 — 2026-04-14 — Production Launch
- System live at https://cilyouth.org
- HTTPS/SSL via Let's Encrypt (auto-renewing)
- www.cilyouth.org → cilyouth.org redirect
- SSH access configured (`ssh cil-server`)
- `./deploy.sh` one-command deployment script
- Git tag: `v1.0.0`

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

**Personal Info**
- View/edit mode with dynamic status fields
- Status history tracking
- School level (OL/AL status)
- Family background (income, dependants, assistance)
- Future plans (short/long term, career goal)
- Living outside LDC (checkbox + purpose + location)

**Academic Records**
- OL results — flexible subjects from master list
- AL results — streams, z-score, university selection
- Dynamic grades from master list
- Duplicate subject prevention (frontend + backend)

**Certifications**
- Card view, add/edit/delete
- Admin-controlled certificate types
- NVQ level conditional display
- Expiry indicator

**Development Plan**
- One plan per year with year selector (locked after creation)
- 5 goal categories (Spiritual, Academic, Social, Vocational, Health)
- Action plan + mentor + review schedule
- Progress bar (click segments)
- Full history with goal snapshots
- Notes mandatory only when updating progress

**TES History**
- Full TES support history per participant
- Total amount received (excluding reverted)
- Auto-recorded when batch marked Funded or Completed
- Reverted entries marked clearly

### Security Hardening
- `helmet` for HTTP security headers (CSP, X-Frame-Options, etc.)
- `express-rate-limit`: 20 req/15min on login, 10 req/hr on sync
- CORS origin driven by `CORS_ORIGIN` env var (no hardcoded values)
- `.env.example` with all required vars documented
- JWT_SECRET and DB credentials sourced from env — no defaults in code
- Migration 010: GIN index on `participants.full_name` + index on `participant_id`

### Production Infrastructure
- `docker-compose.prod.yml` — 4-container production stack
- `server/Dockerfile.prod` — no devDependencies, runs `npm start`
- `client/Dockerfile.prod` — Vite build → nginx static serve
- `client/nginx.conf` — HTTPS, HTTP→HTTPS redirect, www→apex redirect, /api proxy
- Let's Encrypt SSL via Certbot (auto-renewing every 12h check)
- HSTS header (`Strict-Transport-Security: max-age=63072000`)
- `deploy.sh` — one-command deploy from local machine
- SSH config (`~/.ssh/config`) — `ssh cil-server` shortcut

### v1.0.1 Changes (merged into completed features)

#### Reference Data (Admin)
- Subjects, Exam Grades, School Grades, Cert Types grouped under a single "Reference Data" tab with 4 sub-tabs
- School Grade Levels configurable via admin (stored in `school_grade_levels` table)
- Exam Grades section renamed "Exam Grade Management" to distinguish from school grades

#### Pagination
- Participant List (Admin) and LDC Participant List: 20 records per page with page number controls

#### National Admin
- Can now change their own password (same Change Password button as other roles)

---

### Bug Fixes & UI Polish
- Sync exit logic: participants absent from CSV now set `is_active = FALSE`
- Sync reactivation: participants reappearing in CSV auto-reactivate
- Removed separate EXITED badge — exited and deactivated both show INACTIVE
- Profile lock for LDC staff triggers on `!is_active`
- Dev plan year "Change" button hidden for LDC staff
- Favicon replaced with CIL-branded SVG (gold "CIL" on dark background)
- Page title changed to "CIL Youth Platform"
- Top bar badge changed to "CIL"
- Go Back button restyled as gold pill badge (← Back)
- Sync result stat renamed from "Exited (Locked)" → "Deactivated"
- Export column renamed from "Exited" → "Active" (Yes/No)

### Mobile Responsiveness
- Full mobile header system: ☰ in header, CIL+title side by side, Sign Out/Change Password in ☰ dropdown
- Tab bars scroll horizontally on mobile (scrollbar hidden); sub-tab bars (ReferenceData) also scrollable
- Participant list tables → card layout: avatar, name/ID, age/gender/completion, action buttons
- TES application table → card layout: participant + sub-text, status + approved amount, actions
- Participant Summary Bar: 3-row layout on mobile
- All management tables → card layout (`rsp-card-table` + `rsp-card-wrap`)
- All form grids responsive: `rsp-grid-2/3/4` collapse correctly on mobile
- Grid item overflow: `min-width: 0` on all grid children
- Language Proficiency: pill buttons on mobile (form), label+badge rows (detail)
- TES financial grid: 4-col → 2-col on mobile
- Section headers: title + button stack vertically (`rsp-section-header`)
- Search bars: input row 1, buttons row 2 on mobile
- Export buttons: 2-col grid, 100% width on mobile (both Admin + LDC)
- All View buttons unified to cream colour
- Placeholder text removed from all forms (68 instances, 17 files)
- Header top padding increased; sub-header tab padding decreased
- CSS utility classes: `rsp-tabs`, `rsp-grid-2/3/4`, `rsp-main`, `rsp-hide-mobile`, `rsp-show-mobile-only`, `rsp-export-row`, `rsp-card-table`, `rsp-card-wrap`, `rsp-participant-table`, `rsp-tes-table`, `rsp-section-header`, `rsp-sumbar-*`, `rsp-pcard-*`, `rsp-search-*`

### LDC Staff Dashboard Overview
- Overview tab (first tab) with summary stats for their LDC
- TES section: Approved/Completed, Pending, Rejected, Total Disbursed
- Participant Information: status breakdown, TES type, personal stats
- Data Export: 5 buttons (exports their LDC data only)
- Backend: `/api/auth/stats` and overview endpoints support `ldc_staff` (auto-filter)

### Admin Dashboard Overview (rebuilt)
- Section 1: Summary (Users, LDC Centres, Active Participants — global)
- Section 2: TES Stats (Approved/Completed, Pending, Rejected, Total Disbursed)
- Section 3: Participant Information (filterable by LDC dropdown)
  - Status breakdown with bar chart
  - TES by Institution Type
  - Personal stats (Married, Children, Pregnant, Living Outside LDC)
  - Total TES amount for selected LDC
- Section 4: Data Export (5 buttons, respect LDC filter)
  - Participants, Academic Records, Certifications, Development Plans, TES History

### TES System

**Batch Lifecycle:**
```
OPEN → REVIEWING → APPROVED → FUNDED → COMPLETED
                 → REJECTED
```
- Manual open/close/reopen at any stage
- Deadline tracking with days-left countdown
- Completed/Rejected batches hidden by default (toggle to show)

**Applications:**
- Participant search + auto-fill
- Language proficiency grid (English/Sinhala/Tamil × 4 levels)
- Institution and course information
- Financial section (tuition + materials − family = requested, auto-calculated)
- Financial justification + community contribution
- Document checklist (6 docs)
- Commitment confirmation
- Previous TES support banner (returning applicants)
- For Official Use Only section (LDC fills amount + notes)
- Admin decision (approve/reject + admin notes)
- Resubmission flow (rejected → LDC edits → resubmitted)
- Remove application (LDC, open batch, pending only)
- Excel export (Admin = all LDCs, LDC = own only)

---

## Database Tables
| Table | Description |
|---|---|
| participants | Core records |
| participant_profiles | Extended profile |
| participant_status_history | Status change history |
| participant_tes_history | TES amounts per participant |
| ldcs | LDC centres |
| users | Staff accounts |
| ol_results + ol_result_subjects | O/L results |
| al_results + al_result_subjects | A/L results |
| certifications | Certificates held |
| cert_types | Admin cert category list |
| development_plans | Annual plans |
| development_plan_history | Plan update history |
| development_plan_goal_snapshots | Goal snapshots |
| tes_batches | TES funding batches |
| tes_applications | Individual applications (+ `admin_notes` column added v1.0.1) |
| subjects | OL/AL subject master list |
| grades | OL/AL exam grade master list |
| school_grade_levels | School grade dropdown (Grade 1–13, configurable) — added v1.0.1 |

## Migrations Applied
| # | File | What it does |
|---|---|---|
| 001 | participant_status_history | Status tracking table |
| 002 | subjects | Subject master list + OL/AL seed data |
| 003 | grades | Grade master list + seed data |
| 004 | fix_zscore | Fix z_score DECIMAL precision |
| 005 | certifications | cert_types + certifications tables |
| 006 | dev_plan_history | Dev plan history + snapshots |
| 007 | tes | tes_batches + tes_applications |
| 008 | tes_history | participant_tes_history |
| 009 | add_is_exited | is_exited + exited_at on participants |
| 010 | search_index | GIN index on full_name + participant_id index |
| 011 | national_admin_role | `national_admin` role added to users constraint |
| 012 | tes_admin_notes | `admin_notes TEXT` column on tes_applications |
| 013 | school_grade_levels | school_grade_levels table + Grade 1–13 seed data |
| — | Manual | fee_tuition, fee_materials, family_contribution, requested_amount on tes_applications |
| — | Manual | living_outside_ldc, outside_purpose, outside_location on participant_profiles |
| — | Manual | Fix tes_applications status constraint (add resubmitted) |
| — | Manual | Fix tes_batches status constraint (add reviewing, completed) |

> **v1.0.1 production deploy note:** Migrations 011, 012, and 013 must be applied on the production server if not already:
> ```bash
> docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/011_national_admin_role.sql
> docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/012_tes_admin_notes.sql
> docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/013_school_grade_levels.sql
> ```

---

## Key Technical Decisions
- Subjects/grades/cert-types are admin-controlled master lists — not hardcoded
- OL/AL use flexible subject tables (not fixed columns) for future-proofing
- Development plan history snapshots goals on every save
- TES history auto-recorded when batch marked funded/completed
- Batch "close" renamed to "reviewing" for clarity
- Admin can access all participant profiles regardless of LDC
- Living outside LDC tracked with purpose and location
- Nginx inlines SSL settings (no external certbot config file dependency)
- Certbot uses standalone mode for initial cert issuance, webroot for renewal

---

## Lessons Learned
- Use Claude Code terminal to write files (VS Code paste causes encoding issues)
- Always rebuild Docker after file changes: `docker compose down && docker compose up --build`
- Docker only runs schema.sql on first startup — use migrations for DB changes
- Apply migrations: `docker exec -i cil_db psql -U cil_admin -d cil_platform < migration.sql`
- Batch status "closed" was confusing — renamed to "reviewing"
- Always check both frontend AND backend when data isn't saving
- Docker `up --build` uses cached layers — use `--no-cache` if config files aren't updating
- nginx can't start if SSL cert files are missing — use certbot standalone for first issuance
- SSH config (`~/.ssh/config`) avoids long `ssh -i key user@ip` commands every time
- `./deploy.sh` from local machine handles the full git push + server pull + rebuild cycle
