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

// ── GET /api/participants/:id/profile ────────────────────────────
router.get('/:id/profile', verifyToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM participant_profiles WHERE participant_id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No profile found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ── POST /api/participants/:id/profile ───────────────────────────
router.post('/:id/profile', verifyToken, async (req, res) => {
  try {
    const p = req.body;
    const result = await query(
      `INSERT INTO participant_profiles (
        participant_id, marital_status, is_pregnant,
        number_of_children, ol_status, ol_completion_year,
        al_status, al_completion_year, current_status,
        current_institution, current_course, current_year,
        monthly_income, short_term_plan, long_term_plan,
        career_goal, further_education, education_details,
        family_income, no_of_dependants, other_assistance,
        last_updated_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,$20,$21,$22
      ) RETURNING *`,
      [
        req.params.id,
        p.marital_status     || null,
        p.is_pregnant        || false,
        p.number_of_children || 0,
        p.ol_status          || null,
        p.ol_completion_year || null,
        p.al_status          || null,
        p.al_completion_year || null,
        p.current_status     || null,
        p.current_institution|| null,
        p.current_course     || null,
        p.current_year       || null,
        p.monthly_income     || null,
        p.short_term_plan    || null,
        p.long_term_plan     || null,
        p.career_goal        || null,
        p.further_education  || false,
        p.education_details  || null,
        p.family_income      || null,
        p.no_of_dependants   || null,
        p.other_assistance   || null,
        req.user.id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// ── PUT /api/participants/:id/profile ────────────────────────────
router.put('/:id/profile', verifyToken, async (req, res) => {
  try {
    const p = req.body;
    const result = await query(
      `UPDATE participant_profiles SET
        marital_status      = $1,
        is_pregnant         = $2,
        number_of_children  = $3,
        ol_status           = $4,
        ol_completion_year  = $5,
        al_status           = $6,
        al_completion_year  = $7,
        current_status      = $8,
        current_institution = $9,
        current_course      = $10,
        current_year        = $11,
        monthly_income      = $12,
        short_term_plan     = $13,
        long_term_plan      = $14,
        career_goal         = $15,
        further_education   = $16,
        education_details   = $17,
        family_income       = $18,
        no_of_dependants    = $19,
        other_assistance    = $20,
        last_updated_by     = $21,
        updated_at          = NOW()
       WHERE participant_id = $22
       RETURNING *`,
      [
        p.marital_status     || null,
        p.is_pregnant        || false,
        p.number_of_children || 0,
        p.ol_status          || null,
        p.ol_completion_year || null,
        p.al_status          || null,
        p.al_completion_year || null,
        p.current_status     || null,
        p.current_institution|| null,
        p.current_course     || null,
        p.current_year       || null,
        p.monthly_income     || null,
        p.short_term_plan    || null,
        p.long_term_plan     || null,
        p.career_goal        || null,
        p.further_education  || false,
        p.education_details  || null,
        p.family_income      || null,
        p.no_of_dependants   || null,
        p.other_assistance   || null,
        req.user.id,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── GET /api/participants/:id/status-history ─────────────────────
router.get('/:id/status-history', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*, u.full_name as recorded_by_name
       FROM participant_status_history h
       LEFT JOIN users u ON h.recorded_by = u.id
       WHERE h.participant_id = $1
       ORDER BY h.recorded_at DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status history' });
  }
});

// ── POST /api/participants/:id/status-history ────────────────────
router.post('/:id/status-history', verifyToken, async (req, res) => {
  try {
    const { status, institution, course, year_level, notes } = req.body;
    const result = await query(
      `INSERT INTO participant_status_history
        (participant_id, status, institution, course, year_level, notes, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        req.params.id, status,
        institution || null, course || null,
        year_level  || null, notes  || null,
        req.user.id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save status history' });
  }
});

module.exports = router;