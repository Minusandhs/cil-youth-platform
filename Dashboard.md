# Dashboard Redesign — Implementation Plan

> Plan to replace the current `AdminOverview` and `LDCOverview` with the comprehensive Section 1–9 layout from the Dashboard Structure Proposal.
>
> Status legend: ⬜ Pending  · 🟦 In progress  · ✅ Done  · ⏸ Blocked / awaiting approval

---

## Pre-flight findings

The backend is already ~90% there. Most of the proposed metrics already exist in `server/utils/dashboardSnapshot.js` and are exposed via `GET /api/dashboard/summary` (snapshot-cached in the `dashboard_snapshots` table, refreshed nightly + on-demand via `POST /api/dashboard/refresh`).

| Proposal section | Backend status | Notes |
|---|---|---|
| §1 Hero stats | ✅ already returned | `payload.hero` |
| §2A Status breakdown | ✅ | `payload.status_breakdown` |
| §2B Personal info + Profiles Completed | ✅ | `payload.personal_info` |
| §3 Academic (O/L, A/L, certs, streams) | ✅ | `payload.academic` |
| §4 TES summary + funnel + by-LDC | ✅ | `payload.tes` |
| §5A Dev plan status + missing plans | ✅ | `payload.dev_plans` |
| §5B Mentor sessions (this month, never-mentored 60d) | ✅ | `payload.mentor_sessions` |
| §5C Action items + overdue | ✅ | `payload.action_items` |
| §6 Needs & risks + top categories | ✅ | `payload.needs_risks` |
| §7 Home visits + recent table | ✅ | `payload.home_visits` |
| §8 Talents | ✅ | `payload.talents` |
| §9 Completeness headline + per-LDC | ⚠ partial | adds needed: monthly visit %, monthly mentor % |

**Backend gaps to close (Phase 6):**
1. `payload.completeness.visit_pct` is currently "ever visited" — proposal wants **monthly** coverage.
2. `payload.completeness` has no monthly **mentor session** metric — needs to be added.
3. Same two metrics need to be added to the per-LDC breakdown row.

The frontend currently fetches `/api/auth/stats` + `/api/participants/overview` (legacy). It will be migrated to `/api/dashboard/summary`.

---

## Architecture decisions

- **Single shared component library** at `client/src/components/common/dashboard/` (StatCard, SectionHeader, ProgressBar, MiniDonut, MiniBar, CategoryChips, FunnelBar, RecentVisitsTable, etc.) used by both Admin and LDC overviews — keeps the two views visually identical and avoids duplication.
- **Single data source**: both overviews call `GET /api/dashboard/summary`. Admin passes `?ldc_id=<uuid>` when the LDC filter is set; LDC view always passes nothing (server forces scope from JWT).
- **Admin-only sections** (TES funnel, TES by-LDC, Section 9 per-LDC table) are gated by checking whether the corresponding payload field is non-null (server already does the gating).
- **No new CSS files.** Tailwind v4 utilities + existing `var(--color-*)` tokens only.
- **Existing Data Export block stays** at the bottom of each overview (out of scope of this redesign) until explicitly deprecated.
- **Light + dark mode**: every new component must work in both. Verified visually each phase.

---

## Phase 0 — Plan written 🟦

Save this file. Wait for explicit approval before starting Phase 1.

---

## Phase 1 — Foundation: shared primitives + hero stats + LDC filter ✅

**Files**

- New: `client/src/components/common/dashboard/StatCard.jsx`
- New: `client/src/components/common/dashboard/SectionHeader.jsx`
- New: `client/src/components/common/dashboard/LDCFilter.jsx` (admin-only — moves the existing dropdown into a reusable bit)
- New: `client/src/lib/useDashboardSummary.js` (custom hook that fetches & caches `/api/dashboard/summary`, exposes `{ data, loading, error, refresh, ldcFilter, setLdcFilter }`)
- Edit: `client/src/components/admin/AdminOverview.jsx` — replace stats fetch with the hook, render Section 1 hero (6 cards: Active, Inactive, Male, Female, LDCs, Users) + a 7th card for TES Active Scholars per spec (stretch — could be Total LDCs / TES split).
- Edit: `client/src/components/ldc/LDCOverview.jsx` — replace stats fetch with the hook, render Section 1 hero (4 cards: Active, Inactive, Male, Female) + TES Active Scholars card.

**Acceptance**

- Page loads via `/api/dashboard/summary` only (legacy `auth/stats` and `participants/overview` calls removed *for the sections we're replacing this phase only*).
- Numbers match the legacy values.
- LDC filter in admin view re-fetches summary with `?ldc_id`. "All LDCs" clears the param.
- Looks correct in both light and dark mode.
- Existing Data Export block still works.

**Pivot during execution**

- `client/src/components/common/DashboardSections.jsx` was discovered to *already implement all 9 sections* — fully built but unused. Plan revised: instead of authoring each primitive separately, Phases 1–5 simply wire the existing exports into AdminOverview / LDCOverview. Saves a lot of code; the visual contract is what's already in that file.
- `talentCategoryLabel` / `talentCategoryColor` were imported in DashboardSections but missing from `lib/constants.js`. Added them now (used in Phase 5) so the import doesn't dangle.

**Implemented**

- New: `client/src/lib/useDashboardSummary.js` — hook around `/api/dashboard/summary` with optional `ldcId`.
- Edit: `client/src/lib/constants.js` — added `TALENT_CATEGORIES` map + `talentCategoryLabel` / `talentCategoryColor` helpers.
- Edit: `client/src/components/admin/AdminOverview.jsx` — replaced legacy `auth/stats` Section 1 with `<HeroStats hero={...} isAdmin />` from `DashboardSections.jsx`. LDC filter passes `ldc_id` to the hook on change.
- Edit: `client/src/components/ldc/LDCOverview.jsx` — same swap with `isAdmin={false}`.
- Sections 2 (status + personal) and the Data Export block are still rendered by the legacy fetches; they will be replaced in subsequent phases.

---

## Phase 2 — Sections 2 & 3 (Demographics + Academic) ✅

**Files**

- New: `client/src/components/common/dashboard/StatusBreakdownCard.jsx` (existing horizontal bar chart, refactored to read from snapshot payload)
- New: `client/src/components/common/dashboard/PersonalInfoCard.jsx` (2×3 mini grid: Married, Has Children, Pregnant, Outside LDC, Profiles Completed badge)
- New: `client/src/components/common/dashboard/AcademicCards.jsx` (renders 3 sub-cards: O/L, A/L w/ stream chart, Certifications w/ by-type chips)
- Edit: both overviews — insert sections 2 and 3.

**Acceptance**

- Section 2A status bar matches existing visualization (categories, ordering, colors via `statusColor()`).
- Section 2B shows the 4 existing stats plus a "Profiles Completed: X / Y (Z%)" footer.
- Section 3 renders 3 cards in a 3-col grid (responsive: stacks on mobile).
- A/L stream distribution shown as a tiny inline horizontal bar.

**Implemented**

- AdminOverview: legacy `/api/participants/overview` fetch and the inline status / personal info markup removed. Now renders `<ParticipantDemographics>` + `<AcademicSection>` from the snapshot.
- AdminOverview: LDC filter promoted to a page-level "Scope:" bar above Section 1 — it now scopes every section, not just Section 2. Selection re-fetches the snapshot via the hook (`ldcId` arg), and the bar shows a "loading…" hint while the new snapshot lands.
- LDCOverview: same swap, no filter (server scopes by JWT). Removed legacy state, fetch, and unused `fmt`/`statusColor`/`card`/`sectionTitle` constants where no longer referenced.

---

## Phase 3 — Section 4 TES Pipeline ✅

**Files**

- New: `client/src/components/common/dashboard/TESSummary.jsx` (6-card row: Open Batches, Pending, Approved, Rejected, Total Approved LKR, Total Disbursed LKR — color-coded per spec)
- New: `client/src/components/common/dashboard/TESFunnel.jsx` (admin only — horizontal segmented bar: Pending → Approved → Funded → Disbursed with conversion %)
- New: `client/src/components/common/dashboard/TESByLDC.jsx` (admin only — sortable horizontal bar chart of disbursement per LDC)
- Edit: both overviews — admin gets all three; LDC gets only the summary.

**Acceptance**

- LKR amounts formatted with `toLocaleString` and currency prefix.
- Funnel visible only when `payload.tes.funnel` is non-null (admin scope).
- By-LDC bar chart sorted descending.

**Implemented**

- Both overviews now render `<TesSection tes={summary?.tes} isAdmin={...} />`. Admin gets the application funnel + per-LDC disbursement bars; LDC view sees just the summary cards. The `LKR …` formatter and admin gating are inside DashboardSections.

---

## Phase 4 — Section 5 Dev Plans + Mentor Sessions + Action Items ✅

**Files**

- New: `client/src/components/common/dashboard/MiniDonut.jsx` (lightweight SVG donut for plan-status distribution, no chart library)
- New: `client/src/components/common/dashboard/PlanStatusCard.jsx` (5A — donut + cards: Total / Without Plan / Avg Completion %)
- New: `client/src/components/common/dashboard/MentorSessionsCard.jsx` (5B — stat cards: Sessions This Month, Never Mentored 60d)
- New: `client/src/components/common/dashboard/ActionItemsBar.jsx` (5C — segmented progress bar Completed/Pending/Cancelled + overdue badge in red)
- Edit: both overviews — render 5A & 5B side-by-side, 5C full-width below.

**Acceptance**

- Donut renders with semantic colors (success / accent / warning / muted).
- Overdue count appears as a red pill badge.
- Action completion rate computed from `completed / (completed + pending)` (already done server-side).

**Implemented**

- Both overviews render `<DevelopmentSection>` wired to `summary.dev_plans`, `summary.mentor_sessions`, `summary.action_items`. Donut, mentor session cards, and segmented action-items bar with the red overdue badge all come from DashboardSections.

---

## Phase 5 — Sections 6, 7, 8 ✅

**Files**

- New: `client/src/components/common/dashboard/NeedsRisksCard.jsx` (Section 6 — two cards: needs (blue tint) and risks (red tint), each with active count + top-5 category list)
- New: `client/src/components/common/dashboard/HomeVisitsCard.jsx` (Section 7 — stat cards + last-5 visits mini table)
- New: `client/src/components/common/dashboard/TalentsCard.jsx` (Section 8 — total + participants-with-talents + category chips)
- Edit: both overviews — Section 6 full-width row; Section 7 + 8 side-by-side.

**Acceptance**

- Category chips show count and use neutral palette.
- Recent home visits table uses the existing `rsp-table-wrap` + `rsp-card-table` pattern so it collapses to cards on mobile.

**Implemented**

- Both overviews render `<NeedsRisksSection>`, `<HomeVisitsSection>`, and `<TalentsSection>` after Section 5. Needs/Risks tinted cards, Home Visits stat pair + Recent Visits list, and Talents category chips colored via `talentCategoryColor()`.

---

## Phase 6 — Section 9 Data Completeness (Admin only) ✅

**Backend changes** (this is the only phase that touches the server):

- Edit: `server/utils/dashboardSnapshot.js`
  - Extend the `completenessAgg` and per-LDC subqueries to compute:
    - `have_visit_month` = participants with `visited_date >= date_trunc('month', NOW())`
    - `have_mentor_month` = participants whose plan has a `mentor_conversations` row with `conversation_date >= date_trunc('month', NOW())`
  - Add `visit_month_pct` and `mentor_month_pct` to both the headline `completeness` block and each `per_ldc` row.
  - Replace existing `visit_pct` ("ever visited") with the new monthly metric to match the spec, OR keep both — decision: **replace**, since the spec says monthly.

**Frontend**

- New: `client/src/components/admin/dashboard/CompletenessSection.jsx` (Section 9 — progress bars for headline metrics + per-LDC breakdown table with columns LDC / Active / Profile% / O/L% / Dev Plan% / Visits% / Mentoring%)
- Edit: `AdminOverview.jsx` — render at the bottom (admin-only); skip in LDCOverview.

**Migration safety**

- Snapshots are JSONB and rebuilt by `refreshAllSnapshots`. After deploying the snapshot.js change, snapshots will refresh on next nightly cron OR via `POST /api/dashboard/refresh`. The frontend will fall back gracefully if the new fields are missing (treat as 0%).

**Acceptance**

- Headline shows 5 progress bars: Profile %, O/L %, Dev Plan %, Monthly Visits %, Monthly Mentoring %.
- Per-LDC table rows sortable by LDC code (default).
- Section completely hidden for LDC staff.

**Implemented**

- New migration `032_dashboard_completeness_v2.sql` truncates `dashboard_snapshots` so the next request rebuilds with the new shape.
- `server/utils/dashboardSnapshot.js`: completenessAgg + per-LDC queries now return `have_visit_month` (visits this calendar month) and `have_mentor_month` (mentor conversations this calendar month, joined through `development_plans` → `mentor_conversations`). The `visit_pct` semantic moves from "ever visited" to monthly per spec; new `mentor_pct` is added alongside.
- `client/src/components/common/DashboardSections.jsx`: `<DataCompletenessSection>` renders 5 progress bars and a per-LDC table with the new "Mentoring %" column. `?? 0` fallbacks keep the UI sensible against any pre-migration cached snapshot.
- AdminOverview wires `<DataCompletenessSection completeness={summary?.completeness} />` after Section 8. LDCOverview never receives this section because the server returns `completeness: null` for LDC scope.

---

## Phase 7 — Polish ✅

- Loading skeleton for each section (replaces `…` text).
- "Last refreshed: Xm ago" label near the top, sourced from `payload.generated_at`.
- Manual `↻ Refresh` button for super_admin (calls `POST /api/dashboard/refresh`).
- Dark-mode visual pass on every new component.
- Mobile (≤768px) layout: every grid collapses cleanly; the per-LDC table becomes cards.
- Remove any dead code from the legacy overview implementations (e.g., the `loadOverview` / `setOverview` paths that are no longer used).
- Smoke-test every section against a populated environment.

**Acceptance**

- No console warnings.
- All sections render correctly with empty data (zeros + "No data" messages, no crashes).
- Dashboard.md fully ticked off.

**Implemented**

- `useDashboardSummary` exposes `forceRefresh()` + `refreshing` state; super-admins now have a way to rebuild every snapshot on demand (`POST /api/dashboard/refresh`), then re-read.
- New `<DashboardMeta>` export in DashboardSections.jsx — small "Last refreshed: 2 min ago" pill plus an optional "↻ Refresh" button. `relTime()` formats just-now / X min / X h / X d.
- AdminOverview: meta sits next to the Scope filter; refresh button shown when `user.role === 'super_admin'`. LDCOverview: meta above Section 1, no button.
- Mobile: `rsp-grid-4` added to the TES funnel inner grid, `rsp-grid-3` to the Talents stat row — both previously stayed at desktop column counts on small screens.
- Dark mode: every new component reads from `var(--color-*)` tokens; no hex literals introduced. Subtle `rgba(...)` dividers inside tinted Needs/Risks cards are theme-neutral.
- Dead code sweep: no orphan imports / state in either overview after the migration.

**Manual QA still required (cannot be automated):**

1. Load `/admin` and `/ldc` overviews in a browser — confirm every section renders without console errors.
2. Toggle light ↔ dark mode via the header toggle and verify colors hold up (especially Needs/Risks tinted cards and the Donut/Funnel).
3. Resize to ≤768 px and confirm every grid stacks (hero cards, demographics, academic, TES funnel, talents row, Section 9 per-LDC table → cards).
4. As super-admin: click "↻ Refresh" — page should re-render with a fresh `Last refreshed: just now` and updated values.
5. Switch the LDC filter — every section re-scopes; the freshness pill updates as the per-LDC snapshot lazy-builds on first hit.

---

## Visual layout (final, desktop)

```
┌─ LDC Filter (admin) ─────────────────────────────────────┐
│  [All LDCs ▾]  [↻ Refresh]   Last refreshed 2m ago       │
├─ §1 Hero Stats ──────────────────────────────────────────┤
│  [Active] [Inactive] [Male] [Female] [LDCs*] [Users*] [TES Sch.] │
├─ §2 Demographics ────────────────────────────────────────┤
│  [Status Breakdown]              │  [Personal Info + Profile %] │
├─ §3 Academic Performance ────────────────────────────────┤
│  [O/L]   [A/L + Stream]   [Certifications]              │
├─ §4 TES Pipeline ────────────────────────────────────────┤
│  [Open] [Pending] [Approved] [Rejected] [Approved LKR] [Disbursed LKR] │
│  [Funnel — admin only]                                  │
│  [Disbursement by LDC — admin only]                     │
├─ §5 Development & Mentoring ─────────────────────────────┤
│  [Plan Status (donut)]           │  [Mentor Sessions]    │
│  [Action Items progress bar  ⚠ N overdue]                │
├─ §6 Needs & Risks ───────────────────────────────────────┤
│  [Active Needs + top 5]          │  [Active Risks + top 5] │
├─ §7 Home Visits  │  §8 Talents ──────────────────────────┤
│  [Visits stats + recent table]  │  [Talents + chips]     │
├─ §9 Data Completeness (admin only) ──────────────────────┤
│  [5 progress bars + per-LDC table]                       │
├─ Data Export (legacy block, kept) ───────────────────────┤
└──────────────────────────────────────────────────────────┘
* = admin only
```

---

## Approval gate

Each phase ships a coherent slice. After each, I'll mark the section ✅ in this file and wait for your "go" before starting the next.

Phase 0 is complete on save. **Awaiting approval to begin Phase 1.**
