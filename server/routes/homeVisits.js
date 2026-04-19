const express   = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

async function checkAccess(req, participantId) {
  if (req.user.role === 'ldc_staff') {
    const check = await query(
      'SELECT ldc_id, is_exited FROM participants WHERE id = $1',
      [participantId]
    );
    if (!check.rows[0] || check.rows[0].ldc_id !== req.user.ldc_id) {
      return { denied: true, reason: 'Access denied' };
    }
    return { denied: false, exited: check.rows[0].is_exited };
  }
  return { denied: false, exited: false };
}

// GET /api/home-visits/:participantId
router.get('/:participantId', verifyToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    const access = await checkAccess(req, participantId);
    if (access.denied) return res.status(403).json({ error: access.reason });

    const result = await query(
      `SELECT v.*, u.full_name AS created_by_name
       FROM participant_home_visits v
       LEFT JOIN users u ON u.id = v.created_by
       WHERE v.participant_id = $1
       ORDER BY v.visited_date DESC, v.visited_time DESC NULLS LAST`,
      [participantId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load home visits' });
  }
});

// POST /api/home-visits/:participantId
router.post('/:participantId', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'national_admin') {
      return res.status(403).json({ error: 'Read-only access' });
    }
    const { participantId } = req.params;
    const access = await checkAccess(req, participantId);
    if (access.denied) return res.status(403).json({ error: access.reason });
    if (access.exited) return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const { visited_date, visited_time, purpose, people_in_home, discussion_points, suggestions } = req.body;
    if (!visited_date || !purpose) {
      return res.status(400).json({ error: 'Visited date and purpose are required' });
    }

    const result = await query(
      `INSERT INTO participant_home_visits
         (participant_id, visited_date, visited_time, purpose, people_in_home, discussion_points, suggestions, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
       RETURNING *`,
      [participantId, visited_date, visited_time || null, purpose,
       people_in_home || null, discussion_points || null, suggestions || null, req.user.id]
    );

    const row = result.rows[0];
    const userRes = await query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
    row.created_by_name = userRes.rows[0]?.full_name || null;
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create home visit' });
  }
});

// PATCH /api/home-visits/:participantId/:visitId
router.patch('/:participantId/:visitId', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'national_admin') {
      return res.status(403).json({ error: 'Read-only access' });
    }
    const { participantId, visitId } = req.params;
    const access = await checkAccess(req, participantId);
    if (access.denied) return res.status(403).json({ error: access.reason });
    if (access.exited) return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const { visited_date, visited_time, purpose, people_in_home, discussion_points, suggestions } = req.body;
    if (!visited_date || !purpose) {
      return res.status(400).json({ error: 'Visited date and purpose are required' });
    }

    const result = await query(
      `UPDATE participant_home_visits SET
         visited_date      = $1,
         visited_time      = $2,
         purpose           = $3,
         people_in_home    = $4,
         discussion_points = $5,
         suggestions       = $6,
         updated_by        = $7,
         updated_at        = NOW()
       WHERE id = $8 AND participant_id = $9
       RETURNING *`,
      [visited_date, visited_time || null, purpose,
       people_in_home || null, discussion_points || null, suggestions || null,
       req.user.id, visitId, participantId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Visit not found' });

    const row = result.rows[0];
    const userRes = await query('SELECT full_name FROM users WHERE id = $1', [row.created_by]);
    row.created_by_name = userRes.rows[0]?.full_name || null;
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update home visit' });
  }
});

// DELETE /api/home-visits/:participantId/:visitId
router.delete('/:participantId/:visitId', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'national_admin') {
      return res.status(403).json({ error: 'Read-only access' });
    }
    const { participantId, visitId } = req.params;
    const access = await checkAccess(req, participantId);
    if (access.denied) return res.status(403).json({ error: access.reason });
    if (access.exited) return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const result = await query(
      'DELETE FROM participant_home_visits WHERE id = $1 AND participant_id = $2 RETURNING id',
      [visitId, participantId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Visit not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete home visit' });
  }
});

module.exports = router;
