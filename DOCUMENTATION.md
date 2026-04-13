# CIL Youth Development Platform — Developer Documentation

This document covers everything you need to understand, maintain, update, and deploy
the CIL Youth Development Platform. Written for someone who may not have deep
programming experience but needs to keep the system running and make changes with
the help of Claude Code.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Folder Structure](#2-folder-structure)
3. [How the Tech Stack Works](#3-how-the-tech-stack-works)
4. [Running Locally (Development)](#4-running-locally-development)
5. [Production Server](#5-production-server)
6. [How to Deploy Updates](#6-how-to-deploy-updates)
7. [Database & Migrations](#7-database--migrations)
8. [How to Add a New Module](#8-how-to-add-a-new-module)
9. [How to Add a New API Endpoint](#9-how-to-add-a-new-api-endpoint)
10. [User Roles & Permissions](#10-user-roles--permissions)
11. [Important Code Locations](#11-important-code-locations)
12. [Environment Variables](#12-environment-variables)
13. [Common Tasks & Commands](#13-common-tasks--commands)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. System Overview

The CIL Youth Development Platform is a web application that allows:
- **Super Admins** to manage LDC centres, staff users, participants, TES batches, and view reports
- **LDC Staff** to manage their own participants, submit TES applications, and view their centre's data

### Technology Used
| Part | Technology | What it does |
|---|---|---|
| Frontend | React + Vite + Tailwind | The web pages users see in their browser |
| Backend | Node.js + Express | The server that handles all data requests |
| Database | PostgreSQL 16 | Stores all data permanently |
| Infrastructure | Docker + nginx | Packages everything and serves it to the internet |

---

## 2. Folder Structure

```
cil-youth-platform/
│
├── client/                         # Everything the user sees (frontend)
│   ├── src/
│   │   ├── pages/                  # Full page views
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── AdminDashboard.jsx  # Super admin dashboard
│   │   │   ├── LDCDashboard.jsx    # LDC staff dashboard
│   │   │   └── ParticipantProfile.jsx  # Participant profile page
│   │   │
│   │   ├── components/             # Reusable sections within pages
│   │   │   ├── admin/              # Admin-only components
│   │   │   │   ├── AdminOverview.jsx       # Dashboard overview stats
│   │   │   │   ├── UserManagement.jsx      # Manage staff users
│   │   │   │   ├── LDCManagement.jsx       # Manage LDC centres
│   │   │   │   ├── ParticipantList.jsx     # List all participants
│   │   │   │   ├── ParticipantSync.jsx     # CSV sync from Salesforce
│   │   │   │   ├── SubjectManagement.jsx   # OL/AL subject master list
│   │   │   │   ├── GradeManagement.jsx     # Grade master list
│   │   │   │   ├── CertTypeManagement.jsx  # Certificate type master list
│   │   │   │   └── TESManagement.jsx       # TES batch management
│   │   │   │
│   │   │   ├── ldc/                # LDC staff-only components
│   │   │   │   ├── LDCOverview.jsx         # LDC dashboard overview
│   │   │   │   ├── LDCParticipantList.jsx  # LDC's participants only
│   │   │   │   └── LDCTESBatches.jsx       # TES batches for LDC staff
│   │   │   │
│   │   │   ├── participant/        # Participant profile tabs
│   │   │   │   ├── PersonalInfo.jsx        # Personal & family info
│   │   │   │   ├── AcademicRecords.jsx     # OL/AL results
│   │   │   │   ├── Certifications.jsx      # Certificates
│   │   │   │   ├── DevelopmentPlan.jsx     # Annual development plan
│   │   │   │   └── TESHistory.jsx          # TES support history
│   │   │   │
│   │   │   ├── tes/                # TES application components
│   │   │   │   ├── TESApplicationForm.jsx  # Apply for TES
│   │   │   │   ├── TESApplicationDetail.jsx # View/manage application
│   │   │   │   └── TESBatchDetail.jsx      # Batch detail view
│   │   │   │
│   │   │   └── common/             # Shared components (any role)
│   │   │       └── ChangePasswordModal.jsx # Change password popup
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Stores logged-in user info globally
│   │   │
│   │   ├── lib/
│   │   │   └── api.js              # Axios HTTP client (talks to backend)
│   │   │
│   │   ├── App.jsx                 # Routing — which URL shows which page
│   │   ├── main.jsx                # App entry point
│   │   └── index.css               # Global CSS + responsive utility classes
│   │
│   ├── nginx.conf                  # nginx routing config (production)
│   ├── Dockerfile.prod             # How to build frontend for production
│   └── index.html                  # HTML shell for the React app
│
├── server/                         # Everything on the server (backend)
│   ├── index.js                    # Server entry point, middleware setup
│   ├── config/
│   │   └── database.js             # PostgreSQL connection
│   ├── middleware/
│   │   ├── auth.js                 # JWT token verification
│   │   └── roleCheck.js            # Role-based access (admin only, etc.)
│   ├── routes/                     # API endpoints grouped by feature
│   │   ├── auth.js                 # Login, users, change password
│   │   ├── participants.js         # Participant CRUD + sync
│   │   ├── tes.js                  # TES batches + applications
│   │   └── masterdata.js           # Subjects, grades, cert types
│   ├── models/
│   │   └── schema.sql              # Database table definitions (runs once)
│   ├── migrations/                 # Database changes after initial setup
│   │   ├── 001_participant_status_history.sql
│   │   ├── 002_subjects.sql
│   │   ├── 003_grades.sql
│   │   ├── 004_fix_zscore.sql
│   │   ├── 005_certifications.sql
│   │   ├── 006_dev_plan_history.sql
│   │   ├── 007_tes.sql
│   │   ├── 008_tes_history.sql
│   │   ├── 009_add_is_exited.sql
│   │   └── 010_search_index.sql
│   └── Dockerfile.prod             # How to build backend for production
│
├── docker-compose.yml              # Local development setup
├── docker-compose.prod.yml         # Production setup
├── .env.example                    # Template for environment variables
├── PROGRESS.md                     # Feature log and session notes
└── DOCUMENTATION.md                # This file
```

---

## 3. How the Tech Stack Works

### The Big Picture

```
User's Browser
      │
      │  types cilyouth.org
      ▼
   nginx (cil_client container)
      │
      ├── page request → serves React HTML/JS files
      │
      └── /api/* request → forwards to Node.js backend
                                    │
                              Node.js (cil_server)
                                    │
                              PostgreSQL (cil_db)
```

### Frontend (React)
- React is a JavaScript library that builds the UI
- Each `.jsx` file is a "component" — a piece of the page
- When a user clicks a button, React calls the backend API to get/save data
- `api.js` is used for all backend calls — it automatically adds the auth token

### Backend (Node.js + Express)
- Express is a web framework that listens for API requests
- Each route file handles a group of endpoints (e.g., all `/api/auth/...` routes are in `auth.js`)
- The backend checks the user's JWT token on every request
- It reads/writes to PostgreSQL and sends data back as JSON

### Database (PostgreSQL)
- Stores everything permanently: participants, users, TES data, etc.
- `schema.sql` creates all tables when the database first starts
- `migrations/` contains SQL files to modify tables after initial setup

### Docker
- Docker packages each part of the app into a "container"
- Containers are like isolated boxes — the database doesn't interfere with the backend, etc.
- `docker-compose.yml` defines how all containers work together locally
- `docker-compose.prod.yml` is the production version (no exposed DB port, nginx serves frontend)

---

## 4. Running Locally (Development)

### Prerequisites
- Docker Desktop installed and running
- Git installed

### Start the app
```bash
# From the project folder:
docker compose up
```

### Access
- Frontend: http://localhost:3000
- Backend health: http://localhost:5000/health

### Stop the app
```bash
docker compose down
```

### Rebuild after code changes
```bash
docker compose down && docker compose up --build -d
```

### Apply a new migration locally
```bash
docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/NNN_name.sql
```

### View logs locally
```bash
docker logs cil_server    # backend logs
docker logs cil_client    # nginx logs
docker logs cil_db        # database logs
```

---

## 5. Production Server

### Server Details
| Item | Value |
|---|---|
| Provider | DigitalOcean |
| IP Address | 143.244.141.100 |
| Domain | cilyouth.org |
| OS | Ubuntu 24.04 LTS |
| App location | /opt/cil-platform |
| SSH key | ~/.ssh/cil_platform (on your PC) |

### Connect to the server
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
```

### Check what's running
```bash
docker ps
```
You should see 3 containers: `cil_db`, `cil_server`, `cil_client`

### Check server health
```bash
curl http://localhost/health
```
Should return: `{"status":"ok",...}`

---

## 6. How to Deploy Updates

Every time you change code and want to update the live site:

### Step 1 — Make and commit changes locally
```bash
# (Claude Code does this for you)
git add <files>
git commit -m "Description of change"
git push origin main
```

### Step 2 — Deploy to production
```bash
# Connect to server
ssh -i ~/.ssh/cil_platform root@143.244.141.100

# Go to app folder and update
cd /opt/cil-platform
git pull origin main
docker compose -f docker-compose.prod.yml up --build -d
```

### What happens during deployment
1. Git pulls the latest code from GitHub
2. Docker rebuilds the backend and frontend images
3. Old containers are replaced with new ones
4. Database container is NOT rebuilt (data is safe in a Docker volume)

### Important: If you changed the database schema
You must also apply the migration after rebuilding:
```bash
docker exec -i cil_db psql -U cil_admin -d cil_platform < /opt/cil-platform/server/migrations/NNN_name.sql
```

---

## 7. Database & Migrations

### What is a migration?
When the app is already running and you need to change the database structure
(add a column, create a new table, add an index), you create a migration file.
You cannot re-run `schema.sql` on an existing database — it would try to create
tables that already exist.

### Migration file naming
Always number them sequentially:
```
011_description.sql
012_another_change.sql
```

### Example migration — adding a column
```sql
-- Migration 011: Add phone number to participants
ALTER TABLE participants ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
```

### Apply a migration on production
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
docker exec -i cil_db psql -U cil_admin -d cil_platform < /opt/cil-platform/server/migrations/011_description.sql
```

### Apply locally
```bash
docker exec -i cil_db psql -U cil_admin -d cil_platform < server/migrations/011_description.sql
```

### Database tables reference
| Table | What it stores |
|---|---|
| participants | Core participant records (name, LDC, active status) |
| participant_profiles | Extended profile (family, status, future plans) |
| participant_status_history | History of status changes |
| participant_tes_history | TES amounts received per participant |
| ldcs | LDC centre records |
| users | Staff user accounts |
| ol_results + ol_result_subjects | O/L exam results |
| al_results + al_result_subjects | A/L exam results |
| certifications | Certificates held |
| cert_types | Admin-controlled certificate category list |
| development_plans | Annual development plans |
| development_plan_history | History of plan updates |
| development_plan_goal_snapshots | Goal snapshots per history entry |
| tes_batches | TES funding batches |
| tes_applications | Individual TES applications |
| subjects | Admin-controlled OL/AL subject master list |
| grades | Admin-controlled grade master list |

---

## 8. How to Add a New Module

A "module" is a new tab/section in the dashboard. Example: adding an "Events" tab.

### Step 1 — Create the database table (if needed)
Write a migration file: `server/migrations/011_events.sql`
```sql
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  event_date DATE NOT NULL,
  ldc_id UUID REFERENCES ldcs(id),
  created_at TIMESTAMP DEFAULT now()
);
```

### Step 2 — Create the backend route
Create `server/routes/events.js`:
```javascript
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');
const router = express.Router();

// GET all events
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query('SELECT * FROM events ORDER BY event_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST create event (admin only)
router.post('/', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { title, event_date, ldc_id } = req.body;
    const result = await query(
      'INSERT INTO events (title, event_date, ldc_id) VALUES ($1, $2, $3) RETURNING *',
      [title, event_date, ldc_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

module.exports = router;
```

### Step 3 — Register the route in server/index.js
Open `server/index.js` and add:
```javascript
const eventsRouter = require('./routes/events');
app.use('/api/events', eventsRouter);
```

### Step 4 — Create the frontend component
Create `client/src/components/admin/EventManagement.jsx`:
```jsx
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function EventManagement() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data));
  }, []);

  return (
    <div>
      <h2>Events</h2>
      {events.map(e => (
        <div key={e.id}>{e.title} — {e.event_date}</div>
      ))}
    </div>
  );
}
```

### Step 5 — Add the tab to AdminDashboard.jsx
```javascript
// In the tabs array:
{ id: 'events', label: 'Events' }

// In the content section:
{activeTab === 'events' && <EventManagement />}

// At the top, import it:
import EventManagement from '../components/admin/EventManagement';
```

---

## 9. How to Add a New API Endpoint

API endpoints are URLs the frontend calls to get or save data. They follow this pattern:

| Method | Purpose | Example |
|---|---|---|
| GET | Fetch data | GET /api/participants |
| POST | Create new record | POST /api/participants |
| PUT | Update existing record | PUT /api/participants/123 |
| DELETE | Delete record | DELETE /api/participants/123 |

### Example — adding a GET endpoint
In the relevant route file (e.g., `server/routes/participants.js`):
```javascript
// GET /api/participants/:id/notes
router.get('/:id/notes', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM participant_notes WHERE participant_id = $1',
      [req.params.id]    // $1 is a parameterized placeholder — prevents SQL injection
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});
```

### Calling it from the frontend
```javascript
import api from '../../lib/api';

// Inside a React component:
const response = await api.get(`/participants/${participantId}/notes`);
const notes = response.data;
```

### Security rules
- Always use `verifyToken` — this ensures the user is logged in
- Add `requireSuperAdmin` if only admins should access it
- Always use parameterized queries (`$1`, `$2`) — never put user input directly in SQL

---

## 10. User Roles & Permissions

There are two roles in the system:

### super_admin
- Can see and manage everything across all LDCs
- Can create/edit/deactivate users and LDC centres
- Can access all participant profiles
- Can manage master lists (subjects, grades, cert types)
- Can approve/reject/fund TES applications

### ldc_staff
- Can only see participants belonging to their LDC
- Cannot manage users or LDCs
- Cannot edit profiles of inactive/exited participants
- Can submit and edit TES applications (only when batch is open)
- Cannot change the development plan year after creation

### How permissions work in the backend
```javascript
// Anyone logged in:
router.get('/something', verifyToken, handler);

// Admin only:
router.post('/something', verifyToken, requireSuperAdmin, handler);

// Both roles, but filtered by LDC for staff:
const isLDC = req.user.role === 'ldc_staff';
const ldcFilter = isLDC ? 'AND ldc_id = $1' : '';
const params = isLDC ? [req.user.ldc_id] : [];
```

### How the frontend knows the role
The logged-in user's role is available anywhere via:
```javascript
import { useAuth } from '../../contexts/AuthContext';
const { user } = useAuth();
const isAdmin = user?.role === 'super_admin';
const isLDCStaff = user?.role === 'ldc_staff';
```

---

## 11. Important Code Locations

### Authentication flow
- Login endpoint: `server/routes/auth.js` → `POST /api/auth/login`
- Token stored in: `client/src/contexts/AuthContext.jsx` (localStorage)
- Token sent with every request: `client/src/lib/api.js` (Authorization header)
- Token verified on backend: `server/middleware/auth.js`

### Participant sync (CSV upload)
- Frontend: `client/src/components/admin/ParticipantSync.jsx`
- Backend: `server/routes/participants.js` → `POST /api/participants/sync`
- Logic: upsert by `participant_id`, mark missing participants as inactive

### TES batch lifecycle
- Backend: `server/routes/tes.js`
- Status flow: `open → reviewing → approved → funded → completed`
- TES history auto-recorded when batch moves to `funded` or `completed`

### Rate limiting (security)
- Login: max 20 requests per 15 minutes
- Sync: max 10 requests per hour
- Configured in: `server/index.js`

### Responsive CSS classes
Defined in `client/src/index.css`:
| Class | What it does |
|---|---|
| `rsp-tabs` | Tab bar scrolls horizontally on mobile |
| `rsp-main` | Reduces main content padding on mobile |
| `rsp-grid-2` | 2-col grid → 1-col on mobile |
| `rsp-grid-3` | 3-col grid → 1-col on mobile |
| `rsp-grid-4` | 4-col grid → 2-col → 1-col on mobile |
| `rsp-hide-mobile` | Hidden on screens under 768px |
| `rsp-export-row` | Export buttons wrap on mobile |

---

## 12. Environment Variables

Stored in `.env` on the production server at `/opt/cil-platform/.env`.
Never committed to GitHub. A template is in `.env.example`.

| Variable | What it's for |
|---|---|
| POSTGRES_DB | Database name (`cil_platform`) |
| POSTGRES_USER | Database username (`cil_admin`) |
| POSTGRES_PASSWORD | Database password (strong random string) |
| DATABASE_URL | Full connection string for Node.js |
| NODE_ENV | `production` or `development` |
| PORT | Backend port (5000) |
| JWT_SECRET | Secret key for signing login tokens (keep private!) |
| JWT_EXPIRES_IN | How long login sessions last (`8h`) |
| CORS_ORIGIN | Allowed frontend URL (your domain) |
| VITE_API_URL | Backend URL baked into the frontend at build time |

### To edit .env on the server
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
nano /opt/cil-platform/.env
# Edit, then Ctrl+X → Y → Enter to save
# Then rebuild: docker compose -f docker-compose.prod.yml up --build -d
```

---

## 13. Common Tasks & Commands

### Connect to production server
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
```

### Deploy latest code to production
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
cd /opt/cil-platform
git pull origin main
docker compose -f docker-compose.prod.yml up --build -d
```

### View backend logs (debug errors)
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
docker logs cil_server --tail 50
```

### Apply a new migration on production
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
docker exec -i cil_db psql -U cil_admin -d cil_platform < /opt/cil-platform/server/migrations/NNN_name.sql
```

### Run a SQL query on production database
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
docker exec -it cil_db psql -U cil_admin -d cil_platform
# Then type your SQL query, end with semicolon
# Type \q to exit
```

### Reset a user's password (via app)
Admin Dashboard → User Management → find the user → Reset Password button

### Reset superadmin password (via server)
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
docker exec cil_server node -e "
const bcrypt = require('bcryptjs');
const {Client} = require('pg');
bcrypt.hash('YOUR_NEW_PASSWORD', 10).then(h => {
  const c = new Client({connectionString: process.env.DATABASE_URL});
  c.connect().then(() => c.query('UPDATE users SET password_hash = \$1 WHERE username = \$2', [h, 'superadmin'])).then(() => { console.log('done'); c.end(); });
});
"
```

### Check disk space on server
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
df -h
```

### Check memory usage on server
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
free -h
```

### Restart all containers (without rebuilding)
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
cd /opt/cil-platform
docker compose -f docker-compose.prod.yml restart
```

### Stop all containers
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
cd /opt/cil-platform
docker compose -f docker-compose.prod.yml down
```

---

## 14. Troubleshooting

### Site is down / not loading
```bash
# Check if containers are running
ssh -i ~/.ssh/cil_platform root@143.244.141.100
docker ps

# If containers are stopped, start them
cd /opt/cil-platform
docker compose -f docker-compose.prod.yml up -d

# Check for errors
docker logs cil_server --tail 30
docker logs cil_client --tail 30
```

### Login not working
```bash
# Check backend is responding
curl http://143.244.141.100/health

# Check backend logs for errors
docker logs cil_server --tail 50
```

### Data not saving
- Check browser console (F12 → Console tab) for red error messages
- Check backend logs: `docker logs cil_server --tail 30`
- The error message will tell you what went wrong

### "Something went wrong" errors in the app
Always check the backend logs first — they contain the real error:
```bash
docker logs cil_server --tail 50
```

### Server ran out of disk space
```bash
# Check space
df -h

# Remove unused Docker images to free space
docker system prune -f
```

### Database connection errors
```bash
# Check if DB container is healthy
docker ps
# Should show cil_db as "healthy"

# If not healthy, restart it
docker compose -f docker-compose.prod.yml restart db
```

### After a server reboot (containers stopped)
Docker is configured to auto-restart containers (`restart: unless-stopped`).
If they don't restart automatically:
```bash
ssh -i ~/.ssh/cil_platform root@143.244.141.100
cd /opt/cil-platform
docker compose -f docker-compose.prod.yml up -d
```

---

## Quick Reference Card

```
LOCAL DEVELOPMENT
─────────────────
Start:    docker compose up
Stop:     docker compose down
Rebuild:  docker compose down && docker compose up --build -d
Frontend: http://localhost:3000
Backend:  http://localhost:5000/health

PRODUCTION SERVER
─────────────────
SSH:      ssh -i ~/.ssh/cil_platform root@143.244.141.100
App path: /opt/cil-platform
Domain:   https://cilyouth.org (after SSL setup)

DEPLOY UPDATE
─────────────
1. Push to GitHub (git push origin main)
2. SSH to server
3. cd /opt/cil-platform
4. git pull origin main
5. docker compose -f docker-compose.prod.yml up --build -d

CREDENTIALS (keep private)
──────────────────────────
Superadmin username: superadmin
SSH key location:    ~/.ssh/cil_platform  (on your PC)
.env location:       /opt/cil-platform/.env  (on server)

KEY FOLDERS
───────────
Frontend pages:     client/src/pages/
Frontend sections:  client/src/components/
Backend routes:     server/routes/
Database schema:    server/models/schema.sql
Database changes:   server/migrations/
```
