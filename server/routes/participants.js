// ================================================================
// CIL Youth Development Platform — Participant Routes
// ================================================================
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// ── GET /api/participants ────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { ldc_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // LDC staff can only see their own LDC
    let ldcFilter = '';
    let params = [];

    if (req.user.role === 'ldc_staff') {
      ldcFilter = 'AND p.ldc_id = $1';
      params.push(req.user.ldc_id);
    } else if (ldc_id) {
      ldcFilter = 'AND p.ldc_id = $1';
      params.push(ldc_id);
    }

    let searchFilter = '';
    if (search) {
      params.push(`%${search}%`);
      searchFilter = `AND (p.full_name ILIKE $${params.length}
                     OR p.participant_id ILIKE $${params.length})`;
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT p.*, l.ldc_id as ldc_code, l.name as ldc_name
       FROM participants p
       LEFT JOIN ldcs l ON p.ldc_id = l.id
       WHERE p.is_active = true ${ldcFilter} ${searchFilter}
       ORDER BY p.full_name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

// ── GET /api/participants/:id ────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, l.ldc_id as ldc_code, l.name as ldc_name
       FROM participants p
       LEFT JOIN ldcs l ON p.ldc_id = l.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get participant' });
  }
});

// ── POST /api/participants/sync ──────────────────────────────────
// Upload and sync participants from Salesforce export
router.post('/sync', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { participants, batch_label } = req.body;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ error: 'No participant data provided' });
    }

    let inserted = 0;
    let updated  = 0;
    let errors   = 0;

    for (const p of participants) {
      try {
        // Find LDC by ldc_id code
        const ldcResult = await query(
          'SELECT id FROM ldcs WHERE ldc_id = $1',
          [p.ldc_id]
        );

        if (ldcResult.rows.length === 0) {
          errors++;
          continue; // Skip if LDC not found
        }

        const ldc_uuid = ldcResult.rows[0].id;

        // Upsert participant
        const existing = await query(
          'SELECT id FROM participants WHERE participant_id = $1',
          [p.participant_id]
        );

        if (existing.rows.length > 0) {
          // Update existing
          await query(
            `UPDATE participants SET
              full_name          = $1,
              ldc_id             = $2,
              date_of_birth      = $3,
              gender             = $4,
              planned_completion = $5,
              last_synced_at     = NOW(),
              sync_batch         = $6,
              imported_by        = $7,
              updated_at         = NOW()
             WHERE participant_id = $8`,
            [
              p.full_name, ldc_uuid, p.date_of_birth || null,
              p.gender, p.planned_completion || null,
              batch_label, req.user.id, p.participant_id
            ]
          );
          updated++;
        } else {
          // Insert new
          await query(
            `INSERT INTO participants
              (participant_id, ldc_id, full_name, date_of_birth,
               gender, planned_completion, last_synced_at,
               sync_batch, imported_by)
             VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7,$8)`,
            [
              p.participant_id, ldc_uuid, p.full_name,
              p.date_of_birth || null, p.gender,
              p.planned_completion || null,
              batch_label, req.user.id
            ]
          );
          inserted++;
        }
      } catch (err) {
        console.error('Row error:', err.message);
        errors++;
      }
    }

    res.json({
      message  : 'Sync completed',
      inserted,
      updated,
      errors,
      total    : participants.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;