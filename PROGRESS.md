# CIL Youth Development Platform — Progress Log

## Project Overview
Full-stack web application for Compassion International Lanka (CIL) to manage
participant progress tracking and TES scholarship applications.

- **GitHub:** https://github.com/Minusandhs/cil-youth-platform
- **Live:** https://cilyouth.org (v1.0.0 — production)
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
- Tab bars scroll horizontally on mobile (scrollbar hidden)
- Stat grids collapse: 3-col → 2-col → 1-col
- TES grids collapse: 4-col → 2-col → 1-col
- Participant Info grid: 2-col → 1-col
- Status History table: horizontal scroll wrapper
- Language Proficiency table (TES form): horizontal scroll wrapper
- Participant list tables: horizontal scroll wrapper
- Main content padding: 24px → 12px on mobile
- Username hidden in header on mobile
- CSS utility classes: `rsp-tabs`, `rsp-grid-2/3/4`, `rsp-main`, `rsp-hide-mobile`, `rsp-export-row`

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
| tes_applications | Individual applications |
| subjects | OL/AL subject master list |
| grades | Grade master list |

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
| — | Manual | fee_tuition, fee_materials, family_contribution, requested_amount on tes_applications |
| — | Manual | living_outside_ldc, outside_purpose, outside_location on participant_profiles |
| — | Manual | Fix tes_applications status constraint (add resubmitted) |
| — | Manual | Fix tes_batches status constraint (add reviewing, completed) |

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
