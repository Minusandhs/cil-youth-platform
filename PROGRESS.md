# CIL Youth Development Platform — Build Progress

## Project Overview
A full-stack web application for Compassion International Lanka
to manage participant progress tracking and TES scholarship applications.

## Tech Stack
- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL 16
- Auth: JWT + bcrypt
- Infrastructure: Docker + DigitalOcean

## Completed ✅
- Full system running (DB + API + Frontend)
- Authentication system complete
- Admin Dashboard complete
  - Overview with live stats
  - LDC Management (create, edit, deactivate, reactivate)
  - User Management UI ready

## Currently Working On 🔄
- Phase 2: User Management testing

## Next Step ⏭️
- Test creating an LDC staff user
- Build Participant Sync (Salesforce upload)
- Build LDC Staff Dashboard

## How to Resume in a New Session
1. Paste this PROGRESS.md into Claude
2. Say: "I am building the CIL Youth Platform. Continue from Next Step above."
3. Run: docker compose up (to start the app)


## File Map
server/
  index.js          — Express app entry point
  config/
    database.js     — PostgreSQL connection
  routes/
    auth.js         — Login, logout, user management
    participants.js — Participant CRUD
    academic.js     — OL/AL/certifications
    development.js  — Development plans
    tes.js          — TES applications
  middleware/
    auth.js         — JWT verification
    roleCheck.js    — Admin vs LDC role check
  models/
    schema.sql      — Complete database schema

client/src/
  pages/
    Login.jsx
    AdminDashboard.jsx
    LDCDashboard.jsx
    ParticipantProfile.jsx
    AcademicRecords.jsx
    DevelopmentPlan.jsx
    TESApplication.jsx
  components/
  lib/
    api.js          — All API calls

deploy/
  docker-compose.prod.yml
  setup.sh
  nginx.conf

docs/
  ARCHITECTURE.md
  API.md

## How to Resume in a New Session
1. Paste this PROGRESS.md into Claude or Cowork
2. Paste ARCHITECTURE.md
3. Say: "I am building the CIL Youth Platform. Continue from Next Step above."

## Known Issues
- docker-compose.yml version warning (harmless — remove version line)
- Use terminal cat > command to write files (not VS Code paste)