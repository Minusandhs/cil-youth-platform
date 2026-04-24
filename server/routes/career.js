// ================================================================
// CIL Youth Development Platform — Career Routes
// Career plan (one per participant), career readiness checklist
// (one per item per participant), and job-interest flag.
// ================================================================
const express    = require('express');
const { query }  = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const config = require('../config/career_config');

const router = express.Router();

// Build quick validation sets from the config
const READINESS_ITEMS = new Set(config.readiness_items.map(i => i.value));
const INDUSTRIES      = new Set(config.industries.map(i => i.value));
const HOLLAND_CODES   = new Set(config.holland_codes.map(i => i.value));

// ── GET /api/career/config ──────────────────────────────────────
// Returns readiness items + industries from the config file.
router.get('/config', verifyToken, (req, res) => {
  res.json(config);
});

// ── GET /api/career/:participantId ──────────────────────────────
// Returns { plan, readiness: [...] } for the participant.
// Readiness entries each carry their audit history.
router.get('/:participantId', verifyToken, async (req, res) => {
  try {
    const { participantId } = req.params;

    // LDC staff can only view their own LDC's participants
    if (req.user.role === 'ldc_staff') {
      const check = await query(
        'SELECT ldc_id FROM participants WHERE id = $1',
        [participantId]
      );
      if (!check.rows[0] || check.rows[0].ldc_id !== req.user.ldc_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [planRes, readinessRes, historyRes] = await Promise.all([
      query(
        `SELECT cp.*,
                u.full_name   AS created_by_name,
                upd.full_name AS updated_by_name
         FROM participant_career_plans cp
         LEFT JOIN users u   ON u.id   = cp.created_by
         LEFT JOIN users upd ON upd.id = cp.updated_by
         WHERE cp.participant_id = $1`,
        [participantId]
      ),
      query(
        `SELECT r.*,
                u.full_name   AS created_by_name,
                upd.full_name AS updated_by_name
         FROM participant_career_readiness r
         LEFT JOIN users u   ON u.id   = r.created_by
         LEFT JOIN users upd ON upd.id = r.updated_by
         WHERE r.participant_id = $1
         ORDER BY r.created_at ASC`,
        [participantId]
      ),
      query(
        `SELECT h.*, u.full_name AS changed_by_name
         FROM participant_career_readiness_history h
         LEFT JOIN users u ON u.id = h.changed_by
         WHERE h.entry_id IN (
           SELECT id FROM participant_career_readiness WHERE participant_id = $1
         )
         ORDER BY h.changed_at ASC`,
        [participantId]
      ),
    ]);

    // Attach history array to each readiness entry
    const historyByEntry = {};
    for (const row of historyRes.rows) {
      if (!historyByEntry[row.entry_id]) historyByEntry[row.entry_id] = [];
      historyByEntry[row.entry_id].push(row);
    }
    const readiness = readinessRes.rows.map(e => ({
      ...e,
      history: historyByEntry[e.id] || [],
    }));

    res.json({
      plan: planRes.rows[0] || null,
      readiness,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load career data' });
  }
});

// ── Shared: lock + LDC check ────────────────────────────────────
async function assertWritable(req, participantId) {
  if (req.user.role !== 'ldc_staff') return null;
  const check = await query(
    'SELECT is_exited, ldc_id FROM participants WHERE id = $1',
    [participantId]
  );
  if (!check.rows[0] || check.rows[0].ldc_id !== req.user.ldc_id) {
    return { status: 403, error: 'Access denied' };
  }
  if (check.rows[0].is_exited) {
    return { status: 403, error: 'This participant has exited the program. Profile is locked.' };
  }
  return null;
}

// ── Shared: validate plan payload enums ─────────────────────────
function validatePlan(p) {
  if (p.aspired_industry && !INDUSTRIES.has(p.aspired_industry)) {
    return `Invalid aspired_industry: ${p.aspired_industry}`;
  }
  if (p.interest_industry && !INDUSTRIES.has(p.interest_industry)) {
    return `Invalid interest_industry: ${p.interest_industry}`;
  }
  for (const k of ['holland_primary', 'holland_secondary', 'holland_tertiary']) {
    if (p[k] && !HOLLAND_CODES.has(p[k])) {
      return `Invalid ${k}: ${p[k]} (expected R, I, A, S, E, or C)`;
    }
  }
  return null;
}

// ── POST /api/career/:participantId/plan ────────────────────────
// Create the career plan row (errors if one already exists).
router.post('/:participantId/plan', verifyToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    const p = req.body;

    const err = await assertWritable(req, participantId);
    if (err) return res.status(err.status).json({ error: err.error });

    const v = validatePlan(p);
    if (v) return res.status(400).json({ error: v });

    const result = await query(
      `INSERT INTO participant_career_plans (
         participant_id, career_aspiration, aspired_industry,
         long_term_plan, further_education, education_details,
         interested_to_apply, interest_industry, interest_notes,
         holland_primary, holland_secondary, holland_tertiary,
         career_choice_1, career_choice_2, career_choice_3,
         created_by, updated_by
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16
       ) RETURNING *`,
      [
        participantId,
        p.career_aspiration   || null,
        p.aspired_industry    || null,
        p.long_term_plan      || null,
        p.further_education   || false,
        p.education_details   || null,
        p.interested_to_apply || false,
        p.interest_industry   || null,
        p.interest_notes      || null,
        p.holland_primary     || null,
        p.holland_secondary   || null,
        p.holland_tertiary    || null,
        p.career_choice_1     || null,
        p.career_choice_2     || null,
        p.career_choice_3     || null,
        req.user.id,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A career plan already exists for this participant. Use PUT to update it.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create career plan' });
  }
});

// ── PUT /api/career/:participantId/plan ─────────────────────────
// Update the career plan row.
router.put('/:participantId/plan', verifyToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    const p = req.body;

    const err = await assertWritable(req, participantId);
    if (err) return res.status(err.status).json({ error: err.error });

    const v = validatePlan(p);
    if (v) return res.status(400).json({ error: v });

    const result = await query(
      `UPDATE participant_career_plans SET
         career_aspiration   = $1,
         aspired_industry    = $2,
         long_term_plan      = $3,
         further_education   = $4,
         education_details   = $5,
         interested_to_apply = $6,
         interest_industry   = $7,
         interest_notes      = $8,
         holland_primary     = $9,
         holland_secondary   = $10,
         holland_tertiary    = $11,
         career_choice_1     = $12,
         career_choice_2     = $13,
         career_choice_3     = $14,
         updated_by          = $15,
         updated_at          = NOW()
       WHERE participant_id = $16
       RETURNING *`,
      [
        p.career_aspiration   || null,
        p.aspired_industry    || null,
        p.long_term_plan      || null,
        p.further_education   || false,
        p.education_details   || null,
        p.interested_to_apply || false,
        p.interest_industry   || null,
        p.interest_notes      || null,
        p.holland_primary     || null,
        p.holland_secondary   || null,
        p.holland_tertiary    || null,
        p.career_choice_1     || null,
        p.career_choice_2     || null,
        p.career_choice_3     || null,
        req.user.id,
        participantId,
      ]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Career plan not found — create it first' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update career plan' });
  }
});

// ── POST /api/career/:participantId/readiness ───────────────────
// Toggle/create a readiness entry. If an entry exists for (participant, item)
// we upsert so the UI can treat the checklist as idempotent.
router.post('/:participantId/readiness', verifyToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    const { item, completed, completed_date, notes } = req.body;

    const err = await assertWritable(req, participantId);
    if (err) return res.status(err.status).json({ error: err.error });

    if (!item || !READINESS_ITEMS.has(item)) {
      return res.status(400).json({ error: 'Invalid readiness item' });
    }

    const result = await query(
      `INSERT INTO participant_career_readiness
         (participant_id, item, completed, completed_date, notes, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$6)
       ON CONFLICT (participant_id, item) DO UPDATE SET
         completed      = EXCLUDED.completed,
         completed_date = EXCLUDED.completed_date,
         notes          = EXCLUDED.notes,
         updated_by     = EXCLUDED.updated_by,
         updated_at     = NOW()
       RETURNING *`,
      [
        participantId,
        item,
        completed === true,
        completed_date || null,
        notes || null,
        req.user.id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record readiness item' });
  }
});

// ── PATCH /api/career/:participantId/readiness/:entryId ─────────
// Update completed / completed_date / notes; writes history rows.
router.patch('/:participantId/readiness/:entryId', verifyToken, async (req, res) => {
  try {
    const { participantId, entryId } = req.params;
    const { completed, completed_date, notes } = req.body;

    const err = await assertWritable(req, participantId);
    if (err) return res.status(err.status).json({ error: err.error });

    const current = await query(
      'SELECT * FROM participant_career_readiness WHERE id = $1 AND participant_id = $2',
      [entryId, participantId]
    );
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Readiness entry not found' });
    }
    const entry = current.rows[0];

    // Diff and write history rows per changed field
    const changes = [];
    if (completed !== undefined && completed !== entry.completed) {
      changes.push(['completed', String(entry.completed), String(completed)]);
    }
    if (completed_date !== undefined) {
      const oldDate = entry.completed_date
        ? new Date(entry.completed_date).toISOString().slice(0, 10)
        : '';
      const newDate = completed_date || '';
      if (oldDate !== newDate) {
        changes.push(['completed_date', oldDate, newDate]);
      }
    }
    if (notes !== undefined && (notes || '') !== (entry.notes || '')) {
      changes.push(['notes', entry.notes || '', notes || '']);
    }

    for (const [field, oldVal, newVal] of changes) {
      await query(
        `INSERT INTO participant_career_readiness_history
           (entry_id, changed_field, old_value, new_value, changed_by)
         VALUES ($1,$2,$3,$4,$5)`,
        [entryId, field, oldVal, newVal, req.user.id]
      );
    }

    const updated = await query(
      `UPDATE participant_career_readiness SET
         completed      = COALESCE($1, completed),
         completed_date = $2,
         notes          = COALESCE($3, notes),
         updated_by     = $4,
         updated_at     = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        completed === undefined ? null : completed,
        completed_date === undefined ? entry.completed_date : (completed_date || null),
        notes === undefined ? null : (notes || ''),
        req.user.id,
        entryId,
      ]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update readiness entry' });
  }
});

module.exports = router;
