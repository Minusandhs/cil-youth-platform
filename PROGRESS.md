# CIL Youth Development Platform — Build Progress

## Project Overview
A full-stack web application for Compassion International Lanka
to manage participant progress tracking and TES scholarship applications.

## Tech Stack
- Frontend: React + Tailwind CSS (Vite)
- Backend: Node.js + Express
- Database: PostgreSQL 16
- Auth: JWT + bcrypt
- Infrastructure: Docker + DigitalOcean (planned)
- Repo: https://github.com/Minusandhs/cil-youth-platform

## How to Run Locally
```bash
docker compose up
```
- Frontend : http://localhost:3000
- Backend  : http://localhost:5000/health
- DB       : localhost:5432

## Login Credentials (Development)
- Super Admin : superadmin / CIL@admin2025
- LDC Staff   : lk0101staff / Test@1234

## Completed ✅
### Phase 1 — Foundation
- Project folder structure
- Docker setup (3 containers: db, server, client)
- PostgreSQL schema (11 tables)
- Node.js Express backend
- React + Vite + Tailwind frontend
- Environment configuration

### Phase 2 — Authentication & Admin
- JWT login system
- Role-based access (super_admin, ldc_staff)
- Login page UI
- Super Admin Dashboard
  - Overview with live stats
  - LDC Management (create, edit, deactivate, reactivate)
  - User Management (create, edit, reset password, deactivate)
    - Fixed: LDC pre-selection in edit form
  - Participant Sync (Salesforce CSV upload)
  - Participant List (search + filter by LDC)
- LDC Staff Dashboard
  - Participant list filtered by LDC
  - Search functionality

## Currently Working On 🔄
- Phase 3: Participant Profile Page

## Next Step ⏭️
Build Participant Profile with 5 tabs:
1. Personal Info (basic details, marital status, current status, future plans)
2. Academic Records (OL results, AL results with flexible subjects)
3. Certifications (qualifications tracker)
4. Development Plan (annual goals and progress)
5. TES Application (scholarship application form)

## File Map

## Known Issues / Pre-deployment Tasks
- Delete all test data before going live
  - Test participants (LK010100001 to LK010100005)
  - Test OL/AL results entered during development
  - Test LDC staff accounts (lk0101staff, lk0101staff2)
  - Keep only real LDC centres and super admin account