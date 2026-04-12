// ================================================================
// CIL Youth Development Platform — Grades Routes
// ================================================================
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// ── GET /api/grades ──────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM grades WHERE is_active = true';
    let params = [];
    if (type) {
      sql += ' AND (grade_type = $1 OR grade_type = \'both\')';
      params.push(type);
    }
    sql += ' ORDER BY display_order ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get grades' });
  }
});

// ── POST /api/grades ─────────────────────────────────────────────
router.post('/', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { grade_name, grade_type, description, is_pass, display_order } = req.body;

    if (!grade_name || !grade_type) {
      return res.status(400).json({ error: 'Grade name and type are required' });
    }

    // Check for duplicate
    const existing = await query(
      'SELECT id FROM grades WHERE grade_name = $1 AND grade_type = $2',
      [grade_name, grade_type]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: `Grade "${grade_name}" already exists for ${grade_type.toUpperCase()}`
      });
    }

    const result = await query(
      `INSERT INTO grades
        (grade_name, grade_type, description, is_pass, display_order)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [grade_name, grade_type, description || null,
       is_pass !== undefined ? is_pass : true,
       display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Grade already exists' });
    }
    res.status(500).json({ error: 'Failed to create grade' });
  }
});

// ── PUT /api/grades/:id ──────────────────────────────────────────
router.put('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { grade_name, description, is_pass, is_active, display_order } = req.body;
    const result = await query(
      `UPDATE grades SET
        grade_name    = $1,
        description   = $2,
        is_pass       = $3,
        is_active     = $4,
        display_order = $5
       WHERE id = $6 RETURNING *`,
      [grade_name, description || null, is_pass,
       is_active, display_order, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

module.exports = router;