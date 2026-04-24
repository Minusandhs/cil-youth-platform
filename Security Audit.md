# Security Audit — CIL Youth Platform

_Audit date: 2026-04-19. Scope: full codebase review (client, server, migrations, docker-compose, nginx, deploy tooling). Context: platform stores PII for youth participants (DOBs, addresses, home-visit notes, education records); no financial transactions._

---

## Headline

No backend-only code (DB drivers, server secrets, OAuth client secrets, JWT signing keys, admin role lists) is embedded in the React client bundle. The client talks only to `/api/...` through `client/src/lib/api.js`. **That part is clean.**

Real data-safety issues are on the **server** and in **infra config**. None are catastrophic today, but a few are one mistake away from leaking participant data across LDCs.

---

## Findings

### CRITICAL — fix before next deploy

#### C1. IDOR on academic & certification records - DONE
LDC-staff users can read/write any participant's academic or certification data across any LDC, because these routes never check `participant.ldc_id === req.user.ldc_id`.

- `server/routes/academic.js:12` — `GET /api/academic/ol/:participantId`
- `server/routes/academic.js:39` — `POST /api/academic/ol` (checks `is_exited` only)
- `server/routes/academic.js:102` — `PUT /api/academic/ol/:id`
- `server/routes/academic.js:172` — `GET /api/academic/al/:participantId`
- `server/routes/academic.js:199` — `POST /api/academic/al`
- `server/routes/academic.js:278` — `PUT /api/academic/al/:id`
- `server/routes/certifications.js:89` — `GET /:participantId`
- `server/routes/certifications.js:106,154,205` — POST / PUT / DELETE

Correct pattern already exists in `server/routes/participants.js:24-29` — LDC filter enforced in the query. Replicate for each of the routes above.

**Status: FIXED in this commit.** (Added `assertOwnsParticipant` helper, applied to every route above.)

#### C2. JWT algorithm not pinned - DONE
`server/middleware/auth.js:13` calls `jwt.verify(token, process.env.JWT_SECRET)` with no `algorithms` option. Leaves room for `alg: "none"` / algorithm-confusion attacks if a library CVE hits or the secret gets reused elsewhere as a public key.

**Status: FIXED in this commit.** Algorithm pinned to `HS256` on both `jwt.sign` and `jwt.verify`.

#### C3. Hardcoded dev DB password & Postgres port published to all interfaces
- `docker-compose.yml:11` — `POSTGRES_PASSWORD: cil2025`
- `docker-compose.yml:34` — `JWT_SECRET: cil_jwt_secret_change_in_production`
- `docker-compose.yml:16` — `"5432:5432"` publishes the database on **every network interface**, not just localhost

Dev-only, but on a laptop on a public/office/hotel network this is an open Postgres with a trivial password. Anyone on the same network can connect with `psql -h <your-ip> -U cil_admin` and pull every participant record. See the explanation below this findings list.

**Fix (not applied this turn):** in `docker-compose.yml`
- Line 16 → `"127.0.0.1:5432:5432"`
- Lines 11, 33, 34 → replace hardcoded values with `${VAR}` and put the real values in a gitignored `.env` (the prod compose already does this correctly).

---

### HIGH

#### H1. No rate limiting on password-reset endpoints
`server/index.js:87` applies `loginLimiter` only to `/api/auth/login`. `POST /forgot-password` (`routes/auth.js:304`) and `POST /reset-password` (`:351`) are unlimited — attackers can spray emails (timing-based enumeration) and brute-force tokens.
**Fix:** apply a stricter limiter (e.g. 5/hour/IP) to both routes.

#### H2. Reset token travels in URL query string
`routes/auth.js:338` builds `…/reset-password?token=…`. Tokens in URLs leak via browser history, `Referer` on any third-party resource the reset page loads, and server access logs.
**Fix:** add `<meta name="referrer" content="no-referrer">` on the reset page, and/or move the token to the URL fragment (`#token=…`) so it never appears in `Referer`.

#### H3. Reset link origin derived from request headers
`routes/auth.js:333-338` uses `req.headers.origin || referer`. An attacker can hit `/forgot-password` with a forged `Origin: https://evil.test` header, and the reset email will contain a link pointing at the attacker's domain. CORS doesn't protect outbound email contents.
**Fix:** ignore headers; always use `process.env.APP_URL` (or `CORS_ORIGIN.split(',')[0]`).

#### H4. bcrypt cost factor 10
`routes/auth.js:154, 215, 241, 374`. Fine in 2018, weak in 2026 — ~100 guesses/sec on a consumer GPU.
**Fix:** bump to **12** (≈10× slower). Existing hashes can be transparently upgraded on next successful login.

---

### MEDIUM

#### M1. Password minimum length 6
`routes/auth.js:210-214, 234-236`. Client enforces 8 (`pages/ResetPassword.jsx:35`), server accepts 6 — mismatch means the weaker server rule wins. NIST recommends ≥8; 10–12 is safer.

#### M2. JWT lifetime 8h with no refresh
`routes/auth.js:75`. A stolen token is valid for 8 hours. With JWT in localStorage, any XSS = 8h of access. Shorten to 1–2h with silent re-auth, or move to httpOnly cookies.

#### M3. JWT in localStorage
`client/src/contexts/AuthContext.jsx:10` and `lib/api.js:10`. Industry-standard, but XSS-readable. One `dangerouslySetInnerHTML` mistake later = token exfiltration. Currently no such usage, but structurally fragile. httpOnly cookie + CSRF token is the hardened alternative.

#### M4. Verbose error logging
Many routes do `console.error(error)` dumping the full Postgres error (constraint names, column values). In prod logs these help attackers map the schema.
**Fix:** log `error.code` + a short tag only.

#### M5. Helmet defaults only
`server/index.js:35` — `helmet()`. Default config is good but no explicit Content-Security-Policy. Add a CSP once the frontend's asset origins are settled.

---

### LOW

- **L1.** `.gitignore` doesn't pre-emptively cover `uploads/`, `logs/`, `backups/` (if/when created at runtime). (`.env` is correctly ignored and not tracked — verified via `git ls-files`.)
- **L2.** `routes/auth.js:75` — `JWT_EXPIRES_IN || '8h'`. Prefer fail-loud on missing critical env vars over silent defaults.
- **L3.** `server/migrations/` runs automatically at boot (per CLAUDE.md). Ensure no untrusted migration file can ever be merged — review-before-merge is the control.
- **L4.** No automated encrypted Postgres backups documented. Given this is PII, set up `pg_dump` → encrypted object storage nightly.

---

## Confirmed NOT issues (verified)

- No real secrets committed. `.env` is gitignored; only `.env.example` with placeholders is tracked.
- No `dangerouslySetInnerHTML`, `eval`, or direct DB access in the client.
- No SQL injection — every query uses parameterized `$n` placeholders.
- HTTPS enforced with HSTS (`client/nginx.conf:9-19, :56`) and Let's Encrypt auto-renewal.
- CORS uses an explicit allowlist (`server/index.js:38-42`), not `*`.
- Login rate-limiter is in place (`server/index.js:45-51, :87`).
- Password-reset tokens are 256-bit from `crypto.randomBytes`, single-use, 1h expiry (`routes/auth.js:323, :383`).

---

## What is "C3"? (plain-English)

`docker-compose.yml` is the recipe Docker uses when you run the platform locally for development. Three problems live in it:

1. **Line 11 — `POSTGRES_PASSWORD: cil2025`.** The password protecting your local database is hardcoded and visible to anyone with repo access. It's also a trivial password, so dictionary attacks crack it instantly.

2. **Line 34 — `JWT_SECRET: cil_jwt_secret_change_in_production`.** The key that signs session tokens in your dev environment is also hardcoded. Anyone who sees this file can forge valid dev tokens and impersonate any user.

3. **Line 16 — `"5432:5432"`.** This publishes the Postgres port on **every network interface of your machine**, not just `localhost`. On a home network it's mostly fine. On any shared network — office wifi, co-working, coffee shop, hotel, conference — every other device on that network can reach your database directly. Combined with problem 1, that means: anyone on the same wifi can run `psql -h <your-ip> -U cil_admin` with password `cil2025` and download every participant record.

The production compose file (`docker-compose.prod.yml`) already does this correctly — it reads `${JWT_SECRET}` and `${POSTGRES_PASSWORD}` from a gitignored `.env` file. The dev compose should be brought in line.

**Fix when you're ready:**
```yaml
# docker-compose.yml
services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"    # only your machine can reach it
  server:
    environment:
      DATABASE_URL: postgres://cil_admin:${POSTGRES_PASSWORD}@db:5432/cil_platform
      JWT_SECRET: ${JWT_SECRET}
```
Then add the real values to a gitignored `.env` at the repo root (use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` to generate each).

Not strictly urgent — but it's the kind of thing that's easy to forget about until one day you're on a conference wifi and someone portscans the subnet.

---

## Recommended fix order (for the rest)

1. **H1** — rate-limit `/forgot-password` and `/reset-password` in `server/index.js`.
2. **H3** — replace `req.headers.origin` with `process.env.APP_URL` in `routes/auth.js:333-338`.
3. **C3** — fix `docker-compose.yml` (see above).
4. **H2, H4, M1** — small single-line edits; batch together.
5. **M2–M5, L1–L4** — next sprint.

## Verification of this turn's fixes

- App boots, existing login still works (HS256 is already the default, so no behaviour change is expected).
- Log in as an LDC-staff user; try `GET /api/academic/ol/<participantId-from-another-LDC>` → **expect 403 `Access denied`** instead of the data.
- Repeat as a super_admin → should still return 200.
- Try POST `/api/certifications` with a `participant_id` belonging to another LDC → **expect 403**.
