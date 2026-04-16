# Gemini CLI — Project Context & Workflow

## Project: Youth Development Platform (LDC Management)
This file serves as the primary context for Gemini CLI's involvement in the project, ensuring synchronization with Claude and the user's "vibe coding" preferences.

## 🤝 Collaboration Principles
- **Sync with Claude:** Always respect the logic and conventions established in `CLAUDE.md` and the existing codebase.
- **Vibe Coding:** Focus on efficient, modular, and functional snippets. Prioritize high-signal technical rationale over filler.
- **Environment:** Code must be compatible with a containerized Node.js (server) and Vite (client) environment.
- **Logic-First:** Explain the logic/strategy before implementing to ensure alignment.

## 🛠 Tech Stack & Conventions
- **Backend:** Node.js + Express + PostgreSQL.
- **Frontend:** React (Vite) + CSS Variables (in `index.css`) + Responsive utility classes.
- **Styling:** **NO Tailwind utilities in components.** Use inline styles for layout and `var()` for colors.
- **Architecture:** Multi-tenant. LDC staff manage records; Super Admins review/approve/reject.

## 🎯 Active Task: Record-Rejection Notification System
**Goal:** Automatically trigger an email notification to LDC staff when an admin rejects a participant record.

### Required Architectural Details (To Investigate)
1.  **Email Service:** Identify current email configuration (Nodemailer, SendGrid, etc.) or choose one for the containerized environment.
2.  **Rejection Logic:** Locate the API endpoint/controller where record rejection occurs (`server/routes/participants.js`?).
3.  **LDC Staff Mapping:** Ensure we can efficiently map a participant record back to the specific LDC staff email(s).
4.  **Database:** Check if rejection reasons or notification status need to be persisted in the DB (e.g., `participant_status_history`).

## 📁 Key Locations
- `server/`: Backend logic and API routes.
- `client/`: Frontend React application.
- `server/migrations/`: Database schema updates.
- `CLAUDE.md`: Claude's core instructions.
- `DOCUMENTATION.md`: Full system documentation.

## 📜 Audit Log (Gemini CLI)
- **2026-04-16:** Initialized `GEMINI.md`. Analyzed codebase and synced with `CLAUDE.md`.
- **2026-04-16:** Implemented TES Application rejection notification system.
    - Updated `UserManagement.jsx` and `auth.js` to make user emails mandatory.
    - Configured `nodemailer` with Google OAuth2 support in `server/config/email.js`.
    - Created `server/utils/notifications.js` for automated email dispatch.
    - Fixed `admin_notes` bug in `server/routes/tes.js` and integrated rejection email trigger.
    - Applied DB migration `014` to add `email` column to `users` table.
    - Polished User Management UI to match tinted-background consistency.
- **2026-04-16:** Deployed rejection notification system to production (cilyouth.org).
    - Updated production `.env` with Google OAuth2 credentials.
    - Synchronized GitHub and pulled latest changes to server.
    - Updated `docker-compose.prod.yml` to pass credentials to the production container.
    - Note: Outbound SMTP currently timing out on production server; may require hosting provider to unblock ports 465/587.
