# Gemini CLI — Project Context & Workflow

## Project: Youth Development Platform (LDC Management)
This file serves as the primary context for Gemini CLI's involvement in the project, ensuring synchronization with Claude and the user's "vibe coding" preferences.

## 🤝 Collaboration Principles
- **Sync with Claude:** Always respect the logic and conventions established in `CLAUDE.md` and the existing codebase.
- **Vibe Coding:** Focus on efficient, modular, and functional snippets. Prioritize high-signal technical rationale over filler.
- **Git Protocol:** **ALWAYS** ask for explicit confirmation before committing any changes to git.
- **Deployment:** Deployment (`./deploy.sh`) is **PROHIBITED** unless explicit permission is granted by the user for a specific turn.
- **Environment:** Code must be compatible with a containerized Node.js (server) and Vite (client) environment.
- **Logic-First:** Explain the logic/strategy before implementing to ensure alignment.

## 🛠 Tech Stack & Conventions
- **Backend:** Node.js + Express + PostgreSQL.
- **Frontend:** React (Vite) + CSS Variables (in `index.css`) + Responsive utility classes.
- **Styling:** **NO Tailwind utilities in components.** Use inline styles for layout and `var()` for colors.
- **Architecture:** Multi-tenant. LDC staff manage records; Super Admins review/approve/reject.

## 🎯 Active Task: Done ✅
**Goal:** Successfully implemented the Record-Rejection Notification System using AWS SES.

## 📁 Key Locations
- `server/`: Backend logic and API routes.
- `client/`: Frontend React application.
- `server/migrations/`: Unified database schema updates (001-014).
- `CLAUDE.md`: Claude's core instructions.
- `PROGRESS.md`: Full system documentation and progress log.

## 📜 Audit Log (Gemini CLI)
- **2026-04-16:** Initialized `GEMINI.md`. Analyzed codebase and synced with `CLAUDE.md`.
- **2026-04-16:** Implemented TES Application rejection notification system.
    - Updated `UserManagement.jsx` and `auth.js` to make user emails mandatory.
    - Configured `nodemailer` with Google OAuth2 support in `server/config/email.js`.
    - Created `server/utils/notifications.js` for automated email dispatch.
    - Fixed `admin_notes` bug in `server/routes/tes.js` and integrated rejection email trigger.
    - Applied DB migration `014` to add `email` column to `users` table.
    - Polished User Management UI to match tinted-background consistency.
- **2026-04-16:** Re-architected notification system to use Amazon SES API (Port 443).
    - Switched from SMTP/Nodemailer to `@aws-sdk/client-ses` for firewall bypass.
    - Updated `email.js` and `notifications.js` to use SES SendEmail commands.
    - Updated `docker-compose.yml` (dev/prod) and `.env.example` with AWS credentials.
- **2026-04-17:** Finalized AWS SES Integration & Structural Refactor.
    - Migrated SES region to `eu-north-1` (Stockholm) and verified `cilyouth.org` domain.
    - Updated `EMAIL_FROM` to `notifications@cilyouth.org` for DKIM-signed delivery.
    - Added professional HTML email templates in `notifications.js`.
    - Added SES connectivity verification on server startup.
    - Fixed Login Page: Added authenticated user redirect (fixed `useEffect` import).
    - Fixed National Admin: Restored dashboard access and fixed `PrivateRoute` role checks.
    - Consolidated all database migrations (001-014) into `server/migrations/`.
    - Cleaned up obsolete Google OAuth2 and `nodemailer` code.
    - Improved TES UX: Added View/Edit toggle for Admin Decision section.
    - Updated Project Protocol: Explicit Git/Deployment authorization required.
