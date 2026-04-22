// ================================================================
// CIL Youth Development Platform — Talents Routes
// Records and audits participant talents across 7 categories
// at 5 proficiency levels (Emerging → Mastery).
// ================================================================
const express    = require('express');
const { query }  = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const categories = require('../config/talents_categories');

const router = express.Router();

// ── GET /api/talents/categories ─────────────────────────────────
// Returns the category + level definitions from the config file.
router.get('/categories', verifyToken, (req, res) => {
  res.json(categories);
});

// ── GET /api/talents/:participantId ──────────────────────────────
// Returns all talent entries for a participant, each with its history.
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
       FROM participant_talents e
       LEFT JOIN users u   ON u.id   = e.created_by
       LEFT JOIN users upd ON upd.id = e.updated_by
       WHERE e.participant_id = $1
       ORDER BY e.category, e.created_at DESC`,
      [participantId]
    );

    const historyRes = await query(
      `SELECT h.*, u.full_name AS changed_by_name
       FROM participant_talents_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.entry_id IN (
         SELECT id FROM participant_talents WHERE participant_id = $1
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
    res.status(500).json({ error: 'Failed to load talents' });
  }
});

// ── POST /api/talents/:participantId ─────────────────────────────
// Create a new talent rating
router.post('/:participantId', verifyToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    const { category, talent, level, notes } = req.body;

    if (!category || !talent || !level) {
      return res.status(400).json({ error: 'Category, talent, and level are required' });
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
      `INSERT INTO participant_talents
         (participant_id, category, talent, level, notes, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [participantId, category, talent, level, notes || null, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This talent has already been recorded for this participant. Edit the existing entry instead.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create talent entry' });
  }
});

// ── PATCH /api/talents/:participantId/:entryId ───────────────────
// Update level and/or notes; writes history rows for each change
router.patch('/:participantId/:entryId', verifyToken, async (req, res) => {
  try {
    const { participantId, entryId } = req.params;
    const { level, notes } = req.body;

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
      'SELECT * FROM participant_talents WHERE id = $1 AND participant_id = $2',
      [entryId, participantId]
    );
    if (!current.rows[0]) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    const entry = current.rows[0];

    // Write history rows for each field that changed
    const changes = [];
    if (level !== undefined && level !== entry.level) {
      changes.push(['level', entry.level, level]);
    }
    if (notes !== undefined && (notes || '') !== (entry.notes || '')) {
      changes.push(['notes', entry.notes || '', notes || '']);
    }

    for (const [field, oldVal, newVal] of changes) {
      await query(
        `INSERT INTO participant_talents_history
           (entry_id, changed_field, old_value, new_value, changed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [entryId, field, oldVal, newVal, req.user.id]
      );
    }

    // Update the main row
    const updated = await query(
      `UPDATE participant_talents SET
         level      = COALESCE($1, level),
         notes      = COALESCE($2, notes),
         updated_by = $3,
         updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [level || null, notes ?? null, req.user.id, entryId]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update talent entry' });
  }
});

module.exports = router;
