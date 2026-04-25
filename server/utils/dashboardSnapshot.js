// ================================================================
// Dashboard Snapshot utilities
// Aggregates every number on the dashboard for a single scope
// (national or one LDC) and caches it in dashboard_snapshots.
// ================================================================

const { query } = require('../config/database');
const nrCategories = require('../config/needs_risks_categories');

const toInt   = v => (v === null || v === undefined ? 0 : parseInt(v, 10));
const toFloat = v => (v === null || v === undefined ? 0 : Number(v));
const pct     = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

// Lookup maps so top-category rows in the snapshot carry human labels
// (the participant_needs_risks rows store the value-only key).
const NEED_LABELS = Object.fromEntries(nrCategories.needs.map(c => [c.value, c.label]));
const RISK_LABELS = Object.fromEntries(nrCategories.risks.map(c => [c.value, c.label]));

// ── Compute one scope ───────────────────────────────────────────
// ldc_id = null  → national summary (all LDCs)
// ldc_id = <uuid> → one LDC
async function computeSummary({ ldc_id = null } = {}) {
  const params    = ldc_id ? [ldc_id] : [];
  const pWhere    = ldc_id ? 'AND p.ldc_id = $1'  : '';
  const isAdmin   = !ldc_id;

  const [
    heroCounts,
    totalLdcs, totalUsers,
    statusRows,
    profileCounts, profilesCompleted, activeTotal,
    olAgg, alAgg, alStreams,
    certAgg, certTypes,
    planAgg, planMissing,
    mentorCounts,
    actionAgg,
    nrActive, nrResolved, topNeedCats, topRiskCats,
    visitCounts, visitRecent,
    talentAgg, talentByCat,
    completenessAgg, perLdc,
  ] = await Promise.all([

    // hero: active / inactive / male / female
    query(
      `SELECT
         COUNT(*) FILTER (WHERE p.is_active = true)                                  AS active,
         COUNT(*) FILTER (WHERE p.is_active = false)                                 AS inactive,
         COUNT(*) FILTER (WHERE p.is_active = true  AND p.gender = 'Male')           AS male,
         COUNT(*) FILTER (WHERE p.is_active = true  AND p.gender = 'Female')         AS female
       FROM participants p
       WHERE 1=1 ${pWhere}`,
      params
    ),

    // total active LDCs (only relevant for national view, but query is cheap)
    query(`SELECT COUNT(*) AS n FROM ldcs WHERE is_active = true`),
    // total active users (only relevant nationally)
    query(`SELECT COUNT(*) AS n FROM users WHERE is_active = true`),

    // Section 2A — status breakdown
    query(
      `SELECT COALESCE(pp.current_status, 'no_profile') AS status, COUNT(*)::int AS count
       FROM participants p
       LEFT JOIN participant_profiles pp ON pp.participant_id = p.id
       WHERE p.is_active = true ${pWhere}
       GROUP BY COALESCE(pp.current_status, 'no_profile')
       ORDER BY count DESC`,
      params
    ),

    // Section 2B — personal info (only for participants who have a profile)
    query(
      `SELECT
         COUNT(*) FILTER (WHERE pp.marital_status = 'married')    AS married,
         COUNT(*) FILTER (WHERE pp.number_of_children > 0)        AS has_children,
         COUNT(*) FILTER (WHERE pp.is_pregnant = true)            AS pregnant,
         COUNT(*) FILTER (WHERE pp.living_outside_ldc = true)     AS outside_ldc
       FROM participants p
       JOIN participant_profiles pp ON pp.participant_id = p.id
       WHERE p.is_active = true ${pWhere}`,
      params
    ),
    // profiles completed count (any profile row counts as "has a profile")
    query(
      `SELECT COUNT(*) AS n
       FROM participants p
       JOIN participant_profiles pp ON pp.participant_id = p.id
       WHERE p.is_active = true ${pWhere}`,
      params
    ),
    // active total (denominator used by several sections)
    query(
      `SELECT COUNT(*) AS n FROM participants p WHERE p.is_active = true ${pWhere}`,
      params
    ),

    // Section 3A — O/L
    query(
      `SELECT
         COUNT(DISTINCT r.participant_id)                       AS total_records,
         COUNT(*)                                                AS total_rows,
         COUNT(*) FILTER (WHERE r.passed = true)                 AS passed_rows,
         AVG(r.no_of_passes)                                     AS avg_passes
       FROM ol_results r
       JOIN participants p ON p.id = r.participant_id
       WHERE 1=1 ${pWhere}`,
      params
    ),
    // Section 3B — A/L
    query(
      `SELECT
         COUNT(DISTINCT r.participant_id)                       AS total_records,
         COUNT(*)                                                AS total_rows,
         COUNT(*) FILTER (WHERE r.passed = true)                 AS passed_rows,
         COUNT(*) FILTER (WHERE r.university_selected = true)    AS university_selected
       FROM al_results r
       JOIN participants p ON p.id = r.participant_id
       WHERE 1=1 ${pWhere}`,
      params
    ),
    query(
      `SELECT r.stream, COUNT(*)::int AS count
       FROM al_results r
       JOIN participants p ON p.id = r.participant_id
       WHERE r.stream IS NOT NULL ${pWhere}
       GROUP BY r.stream
       ORDER BY count DESC`,
      params
    ),

    // Section 3C — certifications
    query(
      `SELECT
         COUNT(*)                              AS total,
         COUNT(DISTINCT c.participant_id)      AS participants_with_certs
       FROM certifications c
       JOIN participants p ON p.id = c.participant_id
       WHERE 1=1 ${pWhere}`,
      params
    ),
    query(
      `SELECT ct.type_name AS type, COUNT(*)::int AS count
       FROM certifications c
       JOIN cert_types ct   ON ct.id = c.cert_type_id
       JOIN participants p  ON p.id  = c.participant_id
       WHERE 1=1 ${pWhere}
       GROUP BY ct.type_name, ct.display_order
       ORDER BY ct.display_order`,
      params
    ),

    // (Section 4 — TES Pipeline removed; will move to a dedicated TES dashboard.)

    // Section 5A — development plans (current year)
    query(
      `SELECT
         COUNT(*)                                              AS total_current_year,
         COUNT(*) FILTER (WHERE d.progress_status='not_started') AS not_started,
         COUNT(*) FILTER (WHERE d.progress_status='in_progress') AS in_progress,
         COUNT(*) FILTER (WHERE d.progress_status='completed')   AS completed,
         COUNT(*) FILTER (WHERE d.progress_status='on_hold')     AS on_hold,
         COALESCE(AVG(d.completion_rate), 0)                    AS avg_completion_rate
       FROM development_plans d
       JOIN participants p ON p.id = d.participant_id
       WHERE d.plan_year = EXTRACT(YEAR FROM NOW())::int
         AND p.is_active = true ${pWhere}`,
      params
    ),
    // Active participants without a plan this year
    query(
      `SELECT COUNT(*) AS n
       FROM participants p
       WHERE p.is_active = true ${pWhere}
         AND NOT EXISTS (
           SELECT 1 FROM development_plans d
           WHERE d.participant_id = p.id
             AND d.plan_year = EXTRACT(YEAR FROM NOW())::int
         )`,
      params
    ),

    // Section 5B — mentor sessions (use scalar sub-selects so both values
    // are returned even when the tables are empty for this scope)
    query(
      `SELECT
         (
           SELECT COUNT(*)
           FROM mentor_conversations c
           JOIN development_plans d ON d.id = c.plan_id
           JOIN participants p      ON p.id = d.participant_id
           WHERE c.conversation_date >= date_trunc('month', NOW())
             ${pWhere}
         ) AS sessions_this_month,
         (
           SELECT COUNT(*)
           FROM participants p2
           WHERE p2.is_active = true ${ldc_id ? 'AND p2.ldc_id = $1' : ''}
             AND NOT EXISTS (
               SELECT 1 FROM development_plans d2
               JOIN mentor_conversations c2 ON c2.plan_id = d2.id
               WHERE d2.participant_id = p2.id
                 AND c2.conversation_date >= NOW() - INTERVAL '60 days'
             )
         ) AS never_mentored_60d`,
      params
    ),

    // Section 5C — action items (current year)
    query(
      `SELECT
         COUNT(*)                                                  AS total,
         COUNT(*) FILTER (WHERE ai.status='pending')               AS pending,
         COUNT(*) FILTER (WHERE ai.status='completed')             AS completed,
         COUNT(*) FILTER (WHERE ai.status='cancelled')             AS cancelled,
         COUNT(*) FILTER (WHERE ai.status='pending'
                            AND ai.due_date < CURRENT_DATE)        AS overdue
       FROM development_plan_action_items ai
       JOIN development_plans d ON d.id = ai.plan_id
       JOIN participants p      ON p.id = d.participant_id
       WHERE d.plan_year = EXTRACT(YEAR FROM NOW())::int
         ${pWhere}`,
      params
    ),

    // Section 6 — needs & risks
    query(
      `SELECT
         COUNT(*) FILTER (WHERE nr.type='need'
                            AND nr.status IN ('open','in_progress')) AS active_needs,
         COUNT(*) FILTER (WHERE nr.type='risk'
                            AND nr.status IN ('open','in_progress')) AS active_risks
       FROM participant_needs_risks nr
       JOIN participants p ON p.id = nr.participant_id
       WHERE 1=1 ${pWhere}`,
      params
    ),
    query(
      `SELECT COUNT(*) AS n
       FROM participant_needs_risks nr
       JOIN participants p ON p.id = nr.participant_id
       WHERE nr.status = 'resolved' ${pWhere}`,
      params
    ),
    query(
      `SELECT nr.category, COUNT(*)::int AS count
       FROM participant_needs_risks nr
       JOIN participants p ON p.id = nr.participant_id
       WHERE nr.type='need'
         AND nr.status IN ('open','in_progress')
         ${pWhere}
       GROUP BY nr.category
       ORDER BY count DESC
       LIMIT 5`,
      params
    ),
    query(
      `SELECT nr.category, COUNT(*)::int AS count
       FROM participant_needs_risks nr
       JOIN participants p ON p.id = nr.participant_id
       WHERE nr.type='risk'
         AND nr.status IN ('open','in_progress')
         ${pWhere}
       GROUP BY nr.category
       ORDER BY count DESC
       LIMIT 5`,
      params
    ),

    // Section 7 — home visits (scalar sub-selects so empty-table scope still returns a row)
    query(
      `SELECT
         (
           SELECT COUNT(*)
           FROM participant_home_visits v
           JOIN participants p ON p.id = v.participant_id
           WHERE v.visited_date >= date_trunc('month', NOW())
             ${pWhere}
         ) AS visits_this_month,
         (
           SELECT COUNT(*)
           FROM participants p2
           WHERE p2.is_active = true ${ldc_id ? 'AND p2.ldc_id = $1' : ''}
             AND NOT EXISTS (
               SELECT 1 FROM participant_home_visits v2
               WHERE v2.participant_id = p2.id
                 AND v2.visited_date >= CURRENT_DATE - INTERVAL '60 days'
             )
         ) AS never_visited_60d`,
      params
    ),
    query(
      `SELECT v.visited_date, p.full_name AS participant_name, v.purpose
       FROM participant_home_visits v
       JOIN participants p ON p.id = v.participant_id
       WHERE 1=1 ${pWhere}
       ORDER BY v.visited_date DESC, v.visited_time DESC NULLS LAST
       LIMIT 5`,
      params
    ),

    // Section 8 — talents
    query(
      `SELECT COUNT(*) AS total, COUNT(DISTINCT t.participant_id) AS participants_with_talents
       FROM participant_talents t
       JOIN participants p ON p.id = t.participant_id
       WHERE 1=1 ${pWhere}`,
      params
    ),
    query(
      `SELECT t.category, COUNT(*)::int AS count
       FROM participant_talents t
       JOIN participants p ON p.id = t.participant_id
       WHERE 1=1 ${pWhere}
       GROUP BY t.category
       ORDER BY count DESC`,
      params
    ),

    // Section 9 — data completeness for the current scope (headline figures)
    // visit_pct and mentor_pct are MONTHLY (current calendar month) per the
    // dashboard spec; profile/OL/dev-plan stay as cumulative coverage.
    query(
      `SELECT
         COUNT(*)                                                                        AS active,
         COUNT(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM participant_profiles pp WHERE pp.participant_id = p.id
         ))                                                                              AS have_profile,
         COUNT(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM ol_results o WHERE o.participant_id = p.id
         ))                                                                              AS have_ol,
         COUNT(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM development_plans d
           WHERE d.participant_id = p.id
             AND d.plan_year = EXTRACT(YEAR FROM NOW())::int
         ))                                                                              AS have_plan,
         COUNT(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM participant_home_visits v
           WHERE v.participant_id = p.id
             AND v.visited_date >= date_trunc('month', NOW())
         ))                                                                              AS have_visit_month,
         COUNT(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM development_plans d
           JOIN mentor_conversations c ON c.plan_id = d.id
           WHERE d.participant_id = p.id
             AND c.conversation_date >= date_trunc('month', NOW())
         ))                                                                              AS have_mentor_month
       FROM participants p
       WHERE p.is_active = true ${pWhere}`,
      params
    ),
    // per-LDC breakdown (admin only)
    isAdmin
      ? query(
          `SELECT
             l.ldc_id AS ldc_code,
             l.name   AS ldc_name,
             COUNT(p.id) FILTER (WHERE p.is_active = true)                                          AS active,
             COUNT(p.id) FILTER (WHERE p.is_active = true AND EXISTS (
               SELECT 1 FROM participant_profiles pp WHERE pp.participant_id = p.id
             ))                                                                                      AS have_profile,
             COUNT(p.id) FILTER (WHERE p.is_active = true AND EXISTS (
               SELECT 1 FROM ol_results o WHERE o.participant_id = p.id
             ))                                                                                      AS have_ol,
             COUNT(p.id) FILTER (WHERE p.is_active = true AND EXISTS (
               SELECT 1 FROM development_plans d
               WHERE d.participant_id = p.id
                 AND d.plan_year = EXTRACT(YEAR FROM NOW())::int
             ))                                                                                      AS have_plan,
             COUNT(p.id) FILTER (WHERE p.is_active = true AND EXISTS (
               SELECT 1 FROM participant_home_visits v
               WHERE v.participant_id = p.id
                 AND v.visited_date >= date_trunc('month', NOW())
             ))                                                                                      AS have_visit_month,
             COUNT(p.id) FILTER (WHERE p.is_active = true AND EXISTS (
               SELECT 1 FROM development_plans d
               JOIN mentor_conversations c ON c.plan_id = d.id
               WHERE d.participant_id = p.id
                 AND c.conversation_date >= date_trunc('month', NOW())
             ))                                                                                      AS have_mentor_month
           FROM ldcs l
           LEFT JOIN participants p ON p.ldc_id = l.id
           WHERE l.is_active = true
           GROUP BY l.ldc_id, l.name
           ORDER BY l.ldc_id`
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const hero = heroCounts.rows[0];
  const pc   = profileCounts.rows[0];
  const ol   = olAgg.rows[0];
  const al   = alAgg.rows[0];
  const cert = certAgg.rows[0];
  const plan = planAgg.rows[0];
  const ai   = actionAgg.rows[0];
  const nrA  = nrActive.rows[0];
  const comp = completenessAgg.rows[0];
  const activeDen = toInt(activeTotal.rows[0].n);

  return {
    hero: {
      active             : toInt(hero.active),
      inactive           : toInt(hero.inactive),
      male               : toInt(hero.male),
      female             : toInt(hero.female),
      total_ldcs         : isAdmin ? toInt(totalLdcs.rows[0].n)  : null,
      total_users        : isAdmin ? toInt(totalUsers.rows[0].n) : null,
    },
    status_breakdown: statusRows.rows.map(r => ({
      status: r.status, count: toInt(r.count),
    })),
    personal_info: {
      married           : toInt(pc.married),
      has_children      : toInt(pc.has_children),
      pregnant          : toInt(pc.pregnant),
      outside_ldc       : toInt(pc.outside_ldc),
      profiles_completed: toInt(profilesCompleted.rows[0].n),
      active_total      : activeDen,
    },
    academic: {
      ol: {
        total_records: toInt(ol.total_records),
        pass_rate    : pct(toInt(ol.passed_rows), toInt(ol.total_rows)),
        avg_passes   : Math.round(toFloat(ol.avg_passes) * 10) / 10,
      },
      al: {
        total_records      : toInt(al.total_records),
        pass_rate          : pct(toInt(al.passed_rows), toInt(al.total_rows)),
        university_selected: toInt(al.university_selected),
        stream_distribution: alStreams.rows.map(r => ({ stream: r.stream, count: toInt(r.count) })),
      },
      certs: {
        total                   : toInt(cert.total),
        participants_with_certs : toInt(cert.participants_with_certs),
        by_type                 : certTypes.rows.map(r => ({ type: r.type, count: toInt(r.count) })),
      },
    },
    dev_plans: {
      total_current_year : toInt(plan.total_current_year),
      without_plan       : toInt(planMissing.rows[0].n),
      not_started        : toInt(plan.not_started),
      in_progress        : toInt(plan.in_progress),
      completed          : toInt(plan.completed),
      on_hold            : toInt(plan.on_hold),
      avg_completion_rate: Math.round(toFloat(plan.avg_completion_rate)),
    },
    mentor_sessions: {
      sessions_this_month: toInt(mentorCounts.rows[0].sessions_this_month),
      never_mentored_60d : toInt(mentorCounts.rows[0].never_mentored_60d),
    },
    action_items: {
      total          : toInt(ai.total),
      pending        : toInt(ai.pending),
      completed      : toInt(ai.completed),
      cancelled      : toInt(ai.cancelled),
      completion_rate: pct(toInt(ai.completed), toInt(ai.completed) + toInt(ai.pending)),
      overdue        : toInt(ai.overdue),
    },
    needs_risks: {
      active_needs        : toInt(nrA.active_needs),
      active_risks        : toInt(nrA.active_risks),
      resolved_all_time   : toInt(nrResolved.rows[0].n),
      top_need_categories : topNeedCats.rows.map(r => ({
        category: r.category,
        label   : NEED_LABELS[r.category] || r.category,
        count   : toInt(r.count),
      })),
      top_risk_categories : topRiskCats.rows.map(r => ({
        category: r.category,
        label   : RISK_LABELS[r.category] || r.category,
        count   : toInt(r.count),
      })),
    },
    home_visits: {
      visits_this_month: toInt(visitCounts.rows[0].visits_this_month),
      never_visited_60d: toInt(visitCounts.rows[0].never_visited_60d),
      recent           : visitRecent.rows.map(r => ({
        visited_date: r.visited_date, participant_name: r.participant_name, purpose: r.purpose,
      })),
    },
    talents: {
      total_records            : toInt(talentAgg.rows[0].total),
      participants_with_talents: toInt(talentAgg.rows[0].participants_with_talents),
      by_category              : talentByCat.rows.map(r => ({ category: r.category, count: toInt(r.count) })),
    },
    completeness: isAdmin ? {
      profile_pct  : pct(toInt(comp.have_profile),       toInt(comp.active)),
      ol_pct       : pct(toInt(comp.have_ol),            toInt(comp.active)),
      dev_plan_pct : pct(toInt(comp.have_plan),          toInt(comp.active)),
      visit_pct    : pct(toInt(comp.have_visit_month),   toInt(comp.active)),
      mentor_pct   : pct(toInt(comp.have_mentor_month),  toInt(comp.active)),
      per_ldc      : perLdc.rows.map(r => ({
        ldc_code    : r.ldc_code,
        ldc_name    : r.ldc_name,
        active      : toInt(r.active),
        profile_pct : pct(toInt(r.have_profile),       toInt(r.active)),
        ol_pct      : pct(toInt(r.have_ol),            toInt(r.active)),
        dev_plan_pct: pct(toInt(r.have_plan),          toInt(r.active)),
        visit_pct   : pct(toInt(r.have_visit_month),   toInt(r.active)),
        mentor_pct  : pct(toInt(r.have_mentor_month),  toInt(r.active)),
      })),
    } : null,
  };
}

// ── Upsert a single scope ───────────────────────────────────────
async function saveSnapshot(scope, payload) {
  await query(
    `INSERT INTO dashboard_snapshots (scope, payload, generated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (scope)
     DO UPDATE SET payload = EXCLUDED.payload, generated_at = NOW()`,
    [scope, JSON.stringify(payload)]
  );
}

// ── Refresh all scopes (national + one per active LDC) ──────────
async function refreshAllSnapshots() {
  const startedAt = Date.now();
  let ok = 0, failed = 0;

  try {
    const payload = await computeSummary({ ldc_id: null });
    await saveSnapshot('national', payload);
    ok++;
  } catch (err) {
    console.error('Snapshot failed for scope=national:', err.message);
    failed++;
  }

  const ldcs = await query(`SELECT id FROM ldcs WHERE is_active = true`);
  for (const row of ldcs.rows) {
    try {
      const payload = await computeSummary({ ldc_id: row.id });
      await saveSnapshot(row.id, payload);
      ok++;
    } catch (err) {
      console.error(`Snapshot failed for scope=${row.id}:`, err.message);
      failed++;
    }
  }

  const duration_ms = Date.now() - startedAt;
  console.log(`Dashboard snapshots refreshed: ${ok} ok, ${failed} failed in ${duration_ms}ms`);
  return { ok, failed, duration_ms, scopes_refreshed: ok };
}

// ── Read a snapshot (lazy compute if missing) ───────────────────
async function getSnapshot({ ldc_id = null } = {}) {
  const scope = ldc_id || 'national';
  const res = await query(
    `SELECT payload, generated_at FROM dashboard_snapshots WHERE scope = $1`,
    [scope]
  );
  if (res.rows.length > 0) {
    return { payload: res.rows[0].payload, generated_at: res.rows[0].generated_at };
  }
  // Lazy compute on first request (ensures fresh installs work before the cron runs).
  const payload = await computeSummary({ ldc_id });
  await saveSnapshot(scope, payload);
  const after = await query(
    `SELECT generated_at FROM dashboard_snapshots WHERE scope = $1`,
    [scope]
  );
  return { payload, generated_at: after.rows[0].generated_at };
}

module.exports = { computeSummary, refreshAllSnapshots, getSnapshot };
