// ================================================================
// CIL Youth Development Platform — Certifications Routes
// ================================================================
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// ── GET /api/certifications/types ────────────────────────────────
router.get('/types', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM cert_types WHERE is_active = true ORDER BY display_order'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get certificate types' });
  }
});

// ── GET /api/certifications/types/all ────────────────────────────
// For admin management — includes inactive
router.get('/types/all', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM cert_types ORDER BY display_order'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get certificate types' });
  }
});

// ── POST /api/certifications/types ───────────────────────────────
router.post('/types', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { type_name, has_nvq_level, display_order } = req.body;
    if (!type_name) {
      return res.status(400).json({ error: 'Type name is required' });
    }

    // Check duplicate
    const existing = await query(
      'SELECT id FROM cert_types WHERE type_name = $1',
      [type_name]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: `Certificate type "${type_name}" already exists`
      });
    }

    const result = await query(
      `INSERT INTO cert_types (type_name, has_nvq_level, display_order)
       VALUES ($1,$2,$3) RETURNING *`,
      [type_name, has_nvq_level || false, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Certificate type already exists' });
    }
    res.status(500).json({ error: 'Failed to create certificate type' });
  }
});

// ── PUT /api/certifications/types/:id ────────────────────────────
router.put('/types/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { type_name, has_nvq_level, is_active, display_order } = req.body;
    const result = await query(
      `UPDATE cert_types SET
        type_name     = $1,
        has_nvq_level = $2,
        is_active     = $3,
        display_order = $4
       WHERE id = $5 RETURNING *`,
      [type_name, has_nvq_level, is_active, display_order, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update certificate type' });
  }
});

// ── GET /api/certifications/:participantId ────────────────────────
router.get('/:participantId', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, t.type_name, t.has_nvq_level
       FROM certifications c
       JOIN cert_types t ON c.cert_type_id = t.id
       WHERE c.participant_id = $1
       ORDER BY c.issued_date DESC NULLS LAST`,
      [req.params.participantId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get certifications' });
  }
});

// ── POST /api/certifications ──────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      participant_id, cert_type_id, cert_name,
      issuing_body, issued_date, expiry_date,
      grade_result, nvq_level, results_verified, notes
    } = req.body;

    if (req.user.role === 'ldc_staff') {
      const check = await query('SELECT is_exited FROM participants WHERE id = $1', [participant_id]);
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    if (!participant_id || !cert_type_id || !cert_name) {
      return res.status(400).json({
        error: 'Participant, type and certificate name are required'
      });
    }

    const result = await query(
      `INSERT INTO certifications
        (participant_id, cert_type_id, cert_name, issuing_body,
         issued_date, expiry_date, grade_result, nvq_level,
         results_verified, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        participant_id, cert_type_id, cert_name,
        issuing_body   || null,
        issued_date    || null,
        expiry_date    || null,
        grade_result   || null,
        nvq_level      || null,
        results_verified || false,
        notes          || null,
        req.user.id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save certification' });
  }
});

// ── PUT /api/certifications/:id ───────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      cert_type_id, cert_name, issuing_body,
      issued_date, expiry_date, grade_result,
      nvq_level, results_verified, notes
    } = req.body;

    if (req.user.role === 'ldc_staff') {
      const check = await query(
        `SELECT p.is_exited FROM participants p
         JOIN certifications c ON c.participant_id = p.id
         WHERE c.id = $1`, [req.params.id]
      );
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    const result = await query(
      `UPDATE certifications SET
        cert_type_id     = $1,
        cert_name        = $2,
        issuing_body     = $3,
        issued_date      = $4,
        expiry_date      = $5,
        grade_result     = $6,
        nvq_level        = $7,
        results_verified = $8,
        notes            = $9,
        updated_at       = NOW()
       WHERE id = $10 RETURNING *`,
      [
        cert_type_id, cert_name,
        issuing_body     || null,
        issued_date      || null,
        expiry_date      || null,
        grade_result     || null,
        nvq_level        || null,
        results_verified || false,
        notes            || null,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update certification' });
  }
});

// ── DELETE /api/certifications/:id ───────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'ldc_staff') {
      const check = await query(
        `SELECT p.is_exited FROM participants p
         JOIN certifications c ON c.participant_id = p.id
         WHERE c.id = $1`, [req.params.id]
      );
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }
    await query(
      'DELETE FROM certifications WHERE id = $1',
      [req.params.id]
    );
    res.json({ message: 'Certification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete certification' });
  }
});

module.exports = router;