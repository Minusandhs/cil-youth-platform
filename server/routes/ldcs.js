// ================================================================
// CIL Youth Development Platform — LDC Routes
// ================================================================
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// ── GET /api/ldcs ────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM ldcs ORDER BY ldc_id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get LDCs' });
  }
});

// ── POST /api/ldcs ───────────────────────────────────────────────
router.post('/', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { ldc_id, name, region, church_partner, address } = req.body;

    if (!ldc_id || !name) {
      return res.status(400).json({ error: 'LDC ID and name are required' });
    }

    const result = await query(
      `INSERT INTO ldcs (ldc_id, name, region, church_partner, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [ldc_id.toUpperCase().trim(), name, region, church_partner, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'LDC ID already exists' });
    }
    res.status(500).json({ error: 'Failed to create LDC' });
  }
});

// ── PUT /api/ldcs/:id ────────────────────────────────────────────
router.put('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { name, region, church_partner, address, is_active } = req.body;
    const result = await query(
      `UPDATE ldcs
       SET name=$1, region=$2, church_partner=$3,
           address=$4, is_active=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, region, church_partner, address, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update LDC' });
  }
});

module.exports = router;