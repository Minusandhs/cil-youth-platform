// ================================================================
// CIL Youth Development Platform — Subjects Routes
// ================================================================
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// ── GET /api/subjects ────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM subjects WHERE is_active = true';
    let params = [];
    if (type) {
      sql += ' AND (subject_type = $1 OR subject_type = \'both\')';
      params.push(type);
    }
    sql += ' ORDER BY is_core DESC, display_order ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subjects' });
  }
});

// ── POST /api/subjects ───────────────────────────────────────────
router.post('/', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { subject_name, subject_type, is_core, display_order } = req.body;

    if (!subject_name || !subject_type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Check for duplicate
    const existing = await query(
      'SELECT id FROM subjects WHERE subject_name = $1 AND subject_type = $2',
      [subject_name, subject_type]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: `Subject "${subject_name}" already exists for ${subject_type.toUpperCase()}`
      });
    }

    const result = await query(
      `INSERT INTO subjects
        (subject_name, subject_type, is_core, display_order)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [subject_name, subject_type, is_core || false, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Subject already exists' });
    }
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// ── PUT /api/subjects/:id ────────────────────────────────────────
router.put('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { subject_name, is_active, is_core, display_order } = req.body;
    const result = await query(
      `UPDATE subjects SET
        subject_name  = $1,
        is_active     = $2,
        is_core       = $3,
        display_order = $4
       WHERE id = $5 RETURNING *`,
      [subject_name, is_active, is_core, display_order, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

module.exports = router;