// ================================================================
// CIL Youth Development Platform — Needs & Risks Routes
// ================================================================
const express    = require('express');
const { query }  = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const categories = require('../config/needs_risks_categories');

const router = express.Router();

// ── GET /api/needs-risks/categories ─────────────────────────────
// Returns the category lists from the config file (no DB hit needed)
router.get('/categories', verifyToken, (req, res) => {
  res.json(categories);
});

// ── GET /api/needs-risks/:participantId ──────────────────────────
// Returns all entries for a participant, each with its history array
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

    const entriesRes = await query(
      `SELECT e.*,
              u.full_name AS created_by_name,
              upd.full_name AS updated_by_name
       FROM participant_needs_risks e
       LEFT JOIN users u   ON u.id   = e.created_by
       LEFT JOIN users upd ON upd.id = e.updated_by
       WHERE e.participant_id = $1
       ORDER BY e.created_at DESC`,
      [participantId]
    );

    const historyRes = await query(
      `SELECT h.*, u.full_name AS changed_by_name
       FROM participant_needs_risks_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.entry_id IN (
         SELECT id FROM participant_needs_risks WHERE participant_id = $1
       )
       ORDER BY h.changed_at ASC`,
      [participantId]
    );

    // Attach history array to each entry
    const historyByEntry = {};
    for (const row of historyRes.rows) {
      if (!historyByEntry[row.entry_id]) historyByEntry[row.entry_id] = [];
      historyByEntry[row.entry_id].push(row);
    }

    const entries = entriesRes.rows.map(e => ({
      ...e,
      history: historyByEntry[e.id] || [],
    }));

    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load needs/risks' });
  }
});

// ── POST /api/needs-risks/:participantId ─────────────────────────
// Create a new entry
router.post('/:participantId', verifyToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    const { type, category, severity, notes } = req.body;

    if (!type || !category || !severity) {
      return res.status(400).json({ error: 'Type, category, and severity are required' });
    }

    // Lock check for LDC staff
    if (req.user.role === 'ldc_staff') {
      const check = await query(
        'SELECT is_exited, ldc_id FROM participants WHERE id = $1',
        [participantId]
      );
      if (!check.rows[0] || check.rows[0].ldc_id !== req.user.ldc_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (check.rows[0].is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    const result = await query(
      `INSERT INTO participant_needs_risks
         (participant_id, type, category, severity, notes, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [participantId, type, category, severity, notes || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This category has already been logged for this participant.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// ── PATCH /api/needs-risks/:participantId/:entryId ───────────────
// Update status and/or severity; writes history rows for each change
router.patch('/:participantId/:entryId', verifyToken, async (req, res) => {
  try {
    const { participantId, entryId } = req.params;
    const { status, severity } = req.body;

    // Lock check for LDC staff
    if (req.user.role === 'ldc_staff') {
      const check = await query(
        'SELECT is_exited, ldc_id FROM participants WHERE id = $1',
        [participantId]
      );
      if (!check.rows[0] || check.rows[0].ldc_id !== req.user.ldc_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (check.rows[0].is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    // Fetch current row to diff against
    const current = await query(
      'SELECT * FROM participant_needs_risks WHERE id = $1 AND participant_id = $2',
      [entryId, participantId]
    );
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    const entry = current.rows[0];

    // Write history rows for each field that changed
    const changes = [];
    if (status   && status   !== entry.status)   changes.push(['status',   entry.status,   status]);
    if (severity && severity !== entry.severity) changes.push(['severity', entry.severity, severity]);

    for (const [field, oldVal, newVal] of changes) {
      await query(
        `INSERT INTO participant_needs_risks_history
           (entry_id, changed_field, old_value, new_value, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [entryId, field, oldVal, newVal, req.user.id]
      );
    }

    // Update the main row
    const updated = await query(
      `UPDATE participant_needs_risks SET
         status     = COALESCE($1, status),
         severity   = COALESCE($2, severity),
         updated_by = $3,
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status || null, severity || null, req.user.id, entryId]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

module.exports = router;
