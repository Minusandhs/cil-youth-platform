// ================================================================
// CIL Youth Development Platform — School Grade Levels Routes
// ================================================================
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// ── GET /api/school-grades ───────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM school_grade_levels ORDER BY sort_order ASC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get school grade levels' });
  }
});

// ── POST /api/school-grades ──────────────────────────────────────
router.post('/', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { grade_label, sort_order } = req.body;
    if (!grade_label) {
      return res.status(400).json({ error: 'Grade label is required' });
    }
    const result = await query(
      `INSERT INTO school_grade_levels (grade_label, sort_order)
       VALUES ($1, $2) RETURNING *`,
      [grade_label, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grade level' });
  }
});

// ── PUT /api/school-grades/:id ───────────────────────────────────
router.put('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { grade_label, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE school_grade_levels SET
        grade_label = $1, sort_order = $2, is_active = $3
       WHERE id = $4 RETURNING *`,
      [grade_label, sort_order, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade level' });
  }
});

module.exports = router;
