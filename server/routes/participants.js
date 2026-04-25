// ================================================================
// CIL Youth Development Platform — Participant Routes
// ================================================================
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');
const { VALID } = require('../config/dropdowns');

const router = express.Router();

// ── GET /api/participants ────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { ldc_id, search, page = 1, limit = 50, include_inactive } = req.query;
    const offset = (page - 1) * limit;

    const params = [];
    const whereClauses = ['1=1']; // Start with a true condition to easily append AND clauses
    let paramIndex = 1;

    // LDC staff can only see their own LDC and only active participants
    if (req.user.role === 'ldc_staff') {
      whereClauses.push(`p.ldc_id = $${paramIndex++}`);
      params.push(req.user.ldc_id);
    } else if (ldc_id) {
      // For super_admin, if ldc_id is provided, filter by it
      whereClauses.push(`p.ldc_id = $${paramIndex++}`);
      params.push(ldc_id);
    }

    if (search) {
      whereClauses.push(`(p.full_name ILIKE $${paramIndex} OR p.participant_id ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // LDC staff always see active only; admins can opt in to see inactive too
    const showAll = req.user.role !== 'ldc_staff' && include_inactive === 'true';
    if (!showAll) {
      whereClauses.push(`p.is_active = true`);
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT p.*, l.ldc_id as ldc_code, l.name as ldc_name
       FROM participants p
       LEFT JOIN ldcs l ON p.ldc_id = l.id
       WHERE ${whereClauses.join(' AND ')}
       ORDER BY p.is_active DESC, p.full_name
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get participants' });
  }
});

// ── GET /api/participants/overview ──────────────────────────────
// Admin: optional ?ldc_id= filter. LDC staff: auto-filtered to their LDC.
router.get('/overview', verifyToken, async (req, res) => {
  try {
    const ldc_id = req.user.role === 'ldc_staff'
      ? req.user.ldc_id
      : req.query.ldc_id || null;
    const params = ldc_id ? [ldc_id] : [];
    const ldcWhere = ldc_id ? 'AND p.ldc_id = $1' : '';
    const ldcWhereOnly = ldc_id ? 'AND ldc_id = $1' : '';

    const [statusRows, profileCounts, totalCount] = await Promise.all([
      // Status breakdown
      query(
        `SELECT COALESCE(pp.current_status, 'no_profile') AS status, COUNT(*) AS count
         FROM participants p
         LEFT JOIN participant_profiles pp ON pp.participant_id = p.id
         WHERE p.is_active = true ${ldcWhere}
         GROUP BY COALESCE(pp.current_status, 'no_profile')
         ORDER BY count DESC`,
        params
      ),
      // Married / children / pregnant / outside LDC
      query(
        `SELECT
           COUNT(*) FILTER (WHERE pp.marital_status = 'married')   AS married,
           COUNT(*) FILTER (WHERE pp.number_of_children > 0)       AS has_children,
           COUNT(*) FILTER (WHERE pp.is_pregnant = true)           AS pregnant,
           COUNT(*) FILTER (WHERE pp.living_outside_ldc = true)    AS outside_ldc
         FROM participants p
         JOIN participant_profiles pp ON pp.participant_id = p.id
         WHERE p.is_active = true ${ldcWhere}`,
        params
      ),
      // Total active participants for this filter
      query(
        `SELECT COUNT(*) FROM participants WHERE is_active = true ${ldcWhereOnly}`,
        params
      ),
    ]);

    const pc = profileCounts.rows[0];
    res.json({
      total_participants : parseInt(totalCount.rows[0].count),
      status_breakdown   : statusRows.rows.map(r => ({ status: r.status, count: parseInt(r.count) })),
      married            : parseInt(pc.married),
      has_children       : parseInt(pc.has_children),
      pregnant           : parseInt(pc.pregnant),
      outside_ldc        : parseInt(pc.outside_ldc),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get overview' });
  }
});

// ── GET /api/participants/export/participants ────────────────────
router.get('/export/participants', verifyToken, async (req, res) => {
  try {
    const ldc_id = req.user.role === 'ldc_staff' ? req.user.ldc_id : req.query.ldc_id || null;
    const params = ldc_id ? [ldc_id] : [];
    const ldcWhere = ldc_id ? 'AND p.ldc_id = $1' : '';

    const result = await query(
      `SELECT
         p.participant_id, p.full_name,
         l.ldc_id AS ldc_code, l.name AS ldc_name,
         p.date_of_birth, p.gender, p.planned_completion,
         p.is_exited,
         pp.current_status, pp.marital_status,
         pp.number_of_children, pp.is_pregnant,
         pp.living_outside_ldc, pp.outside_purpose, pp.outside_location,
         pp.family_income, pp.no_of_dependants, pp.other_assistance,
         pp.current_exam_type,
         pp.long_term_plan, pp.career_goal,
         (SELECT string_agg(
            'OL ' || r.exam_year || ': ' ||
            COALESCE((SELECT string_agg(s.subject_name || '-' || s.grade, ', ' ORDER BY s.is_core DESC)
                      FROM ol_result_subjects s WHERE s.ol_result_id = r.id), ''),
            ' | ' ORDER BY r.exam_year DESC)
          FROM ol_results r WHERE r.participant_id = p.id) AS ol_results,
         (SELECT string_agg(
            'AL ' || r.exam_year || ' (' || COALESCE(r.stream,'') || '): ' ||
            COALESCE((SELECT string_agg(s.subject_name || '-' || s.grade, ', ')
                      FROM al_result_subjects s WHERE s.al_result_id = r.id), '') ||
            CASE WHEN r.z_score IS NOT NULL THEN ' Z:' || r.z_score::text ELSE '' END,
            ' | ' ORDER BY r.exam_year DESC)
          FROM al_results r WHERE r.participant_id = p.id) AS al_results,
         (SELECT string_agg(
            c.cert_name || ' (' || ct.type_name || ')' ||
            CASE WHEN c.grade_result IS NOT NULL THEN ': ' || c.grade_result ELSE '' END,
            ' | ')
          FROM certifications c
          JOIN cert_types ct ON c.cert_type_id = ct.id
          WHERE c.participant_id = p.id) AS certifications
       FROM participants p
       LEFT JOIN ldcs l ON p.ldc_id = l.id
       LEFT JOIN participant_profiles pp ON pp.participant_id = p.id
       WHERE p.is_active = true ${ldcWhere}
       ORDER BY l.ldc_id, p.full_name`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ── GET /api/participants/export/academic ────────────────────────
router.get('/export/academic', verifyToken, async (req, res) => {
  try {
    const ldc_id = req.user.role === 'ldc_staff' ? req.user.ldc_id : req.query.ldc_id || null;
    const params = ldc_id ? [ldc_id] : [];
    const ldcWhere = ldc_id ? 'AND p.ldc_id = $1' : '';

    const [olRows, alRows] = await Promise.all([
      query(
        `SELECT p.participant_id, p.full_name, l.ldc_id AS ldc_code,
                'OL' AS level, r.exam_year, r.school_name, r.no_of_passes,
                r.results_verified, s.subject_name, s.grade,
                CASE WHEN s.is_core THEN 'Core' ELSE 'Optional' END AS subject_type
         FROM participants p
         JOIN ldcs l ON p.ldc_id = l.id
         JOIN ol_results r ON r.participant_id = p.id
         LEFT JOIN ol_result_subjects s ON s.ol_result_id = r.id
         WHERE p.is_active = true ${ldcWhere}
         ORDER BY l.ldc_id, p.full_name, r.exam_year, s.is_core DESC`,
        params
      ),
      query(
        `SELECT p.participant_id, p.full_name, l.ldc_id AS ldc_code,
                'AL' AS level, r.exam_year, r.school_name, r.stream, r.medium,
                r.z_score, r.district_rank, r.island_rank,
                r.university_selected, r.university_name, r.course_selected,
                r.results_verified, s.subject_name, s.grade, s.subject_type
         FROM participants p
         JOIN ldcs l ON p.ldc_id = l.id
         JOIN al_results r ON r.participant_id = p.id
         LEFT JOIN al_result_subjects s ON s.al_result_id = r.id
         WHERE p.is_active = true ${ldcWhere}
         ORDER BY l.ldc_id, p.full_name, r.exam_year`,
        params
      ),
    ]);
    res.json({ ol: olRows.rows, al: alRows.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ── GET /api/participants/export/certifications ──────────────────
router.get('/export/certifications', verifyToken, async (req, res) => {
  try {
    const ldc_id = req.user.role === 'ldc_staff' ? req.user.ldc_id : req.query.ldc_id || null;
    const params = ldc_id ? [ldc_id] : [];
    const ldcWhere = ldc_id ? 'AND p.ldc_id = $1' : '';

    const result = await query(
      `SELECT p.participant_id, p.full_name, l.ldc_id AS ldc_code,
              ct.type_name AS cert_type, c.cert_name, c.issuing_body,
              c.issued_date, c.expiry_date, c.grade_result, c.nvq_level,
              c.results_verified, c.notes
       FROM certifications c
       JOIN participants p ON c.participant_id = p.id
       JOIN ldcs l ON p.ldc_id = l.id
       JOIN cert_types ct ON c.cert_type_id = ct.id
       WHERE p.is_active = true ${ldcWhere}
       ORDER BY l.ldc_id, p.full_name`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ── GET /api/participants/export/development ─────────────────────
router.get('/export/development', verifyToken, async (req, res) => {
  try {
    const ldc_id = req.user.role === 'ldc_staff' ? req.user.ldc_id : req.query.ldc_id || null;
    const params = ldc_id ? [ldc_id] : [];
    const ldcWhere = ldc_id ? 'AND p.ldc_id = $1' : '';

    const result = await query(
      `SELECT p.participant_id, p.full_name, l.ldc_id AS ldc_code,
              d.plan_year, d.spiritual_goal, d.academic_goal, d.social_goal,
              d.vocational_goal, d.health_goal, d.actions, d.resources_needed,
              d.timeline, d.progress_status, d.completion_rate,
              d.primary_mentor, d.mentor_contact, d.last_reviewed, d.next_review
       FROM development_plans d
       JOIN participants p ON d.participant_id = p.id
       JOIN ldcs l ON p.ldc_id = l.id
       WHERE p.is_active = true ${ldcWhere}
       ORDER BY l.ldc_id, p.full_name, d.plan_year DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ── GET /api/participants/export/tes-history ─────────────────────
router.get('/export/tes-history', verifyToken, async (req, res) => {
  try {
    const ldc_id = req.user.role === 'ldc_staff' ? req.user.ldc_id : req.query.ldc_id || null;
    const params = ldc_id ? [ldc_id] : [];
    const ldcWhere = ldc_id ? 'AND p.ldc_id = $1' : '';

    const result = await query(
      `SELECT p.participant_id, p.full_name, l.ldc_id AS ldc_code,
              h.batch_name, h.institution_name, h.institution_type,
              h.course_name, h.course_duration, h.course_year,
              h.amount_received, h.status, h.recorded_at
       FROM participant_tes_history h
       JOIN participants p ON h.participant_id = p.id
       JOIN ldcs l ON p.ldc_id = l.id
       WHERE p.is_active = true ${ldcWhere}
       ORDER BY l.ldc_id, p.full_name, h.recorded_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// ── GET /api/participants/:id ────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    let queryText = `
      SELECT p.*, l.ldc_id as ldc_code, l.name as ldc_name
      FROM participants p
      LEFT JOIN ldcs l ON p.ldc_id = l.id
      WHERE p.id = $1
    `;
    const params = [req.params.id];

    if (req.user.role === 'ldc_staff') {
      queryText += ` AND p.ldc_id = $2`;
      params.push(req.user.ldc_id);
    }

    const result = await query(queryText, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get participant' });
  }
});

// ── PATCH /api/participants/:id/active ──────────────────────────
// Admin only — deactivate or reactivate a participant
router.patch('/:id/active', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'is_active must be true or false' });
    }
    const result = await query(
      `UPDATE participants
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, participant_id, full_name, is_active`,
      [is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update participant status' });
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

    const csvParticipantIds = [];
    const ldcUuidSet = new Set();

    for (const p of participants) {
      try {
        // Find LDC by ldc_id code
        const ldcResult = await query(
          'SELECT id FROM ldcs WHERE ldc_id = $1',
          [p.ldc_id]
        );

        if (ldcResult.rows.length === 0) {
          console.warn(`LDC not found for ID: ${p.ldc_id}. Skipping participant ${p.participant_id}`);
          errors++;
          continue; // Skip if LDC not found
        }

        const ldc_uuid = ldcResult.rows[0].id;
        ldcUuidSet.add(ldc_uuid);
        csvParticipantIds.push(p.participant_id);

        // Upsert participant
        const existing = await query(
          'SELECT id FROM participants WHERE participant_id = $1',
          [p.participant_id]
        );

        if (existing.rows.length > 0) {
          // Update existing — also re-activate if they were previously exited
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
              updated_at         = NOW(),
              is_exited          = FALSE,
              exited_at          = NULL,
              is_active          = TRUE
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

    // Mark participants from synced LDCs who are absent from this CSV as exited
    let exited = 0;
    const ldcUuids = [...ldcUuidSet];
    if (ldcUuids.length > 0 && csvParticipantIds.length > 0) {
      const exitResult = await query(
        `UPDATE participants
         SET is_exited = TRUE, exited_at = NOW(), is_active = FALSE
         WHERE ldc_id = ANY($1)
           AND participant_id != ALL($2)
           AND is_exited = FALSE
           AND is_active = TRUE`,
        [ldcUuids, csvParticipantIds]
      );
      exited = exitResult.rowCount;
    }

    res.json({
      message  : 'Sync completed',
      inserted,
      updated,
      exited,
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
    let queryText = `
      SELECT pp.*
      FROM participant_profiles pp
      JOIN participants p ON pp.participant_id = p.id
      WHERE pp.participant_id = $1
    `;
    const params = [req.params.id];

    if (req.user.role === 'ldc_staff') {
      queryText += ` AND p.ldc_id = $2`;
      params.push(req.user.ldc_id);
    }

    const result = await query(queryText, params);
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
    if (req.user.role === 'ldc_staff') {
      const participantLdcCheck = await query('SELECT ldc_id, is_exited FROM participants WHERE id = $1', [req.params.id]);
      if (participantLdcCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      if (participantLdcCheck.rows[0].ldc_id !== req.user.ldc_id) {
        return res.status(403).json({ error: 'Access denied: Participant does not belong to your LDC.' });
      }
      if (participantLdcCheck.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }
    const p = req.body;

    // ── Enum validation ──────────────────────────────────────────
    if (p.marital_status  && !VALID.maritalStatus.includes(p.marital_status))
      return res.status(400).json({ error: `Invalid marital_status: ${p.marital_status}` });
    if (p.current_status  && !VALID.currentStatus.includes(p.current_status))
      return res.status(400).json({ error: `Invalid current_status: ${p.current_status}` });
    if (p.outside_purpose && !VALID.outsidePurpose.includes(p.outside_purpose))
      return res.status(400).json({ error: `Invalid outside_purpose: ${p.outside_purpose}` });

    const result = await query(
      `INSERT INTO participant_profiles (
        participant_id, marital_status, is_pregnant,
        number_of_children, current_status,
        current_institution, current_course, current_year,
        current_exam_type,
        monthly_income,
        family_income, no_of_dependants, other_assistance,
        living_outside_ldc, outside_purpose, outside_location,
        last_updated_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17
        ) RETURNING *`,
      [
        req.params.id,
        p.marital_status     || null,
        p.is_pregnant        || false,
        p.number_of_children || 0,
        p.current_status     || null,
        p.current_institution|| null,
        p.current_course     || null,
        p.current_year       || null,
        p.current_exam_type  || null,
        p.monthly_income     || null,
        p.family_income      || null,
        p.no_of_dependants   || 0,
        p.other_assistance   || null,
        p.living_outside_ldc || false,
        p.outside_purpose    || null,
        p.outside_location   || null,
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
    if (req.user.role === 'ldc_staff') {
      const participantLdcCheck = await query('SELECT ldc_id, is_exited FROM participants WHERE id = $1', [req.params.id]);
      if (participantLdcCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      if (participantLdcCheck.rows[0].ldc_id !== req.user.ldc_id) {
        return res.status(403).json({ error: 'Access denied: Participant does not belong to your LDC.' });
      }
      if (participantLdcCheck.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }
    const p = req.body;

    // ── Enum validation ──────────────────────────────────────────
    if (p.marital_status  && !VALID.maritalStatus.includes(p.marital_status))
      return res.status(400).json({ error: `Invalid marital_status: ${p.marital_status}` });
    if (p.current_status  && !VALID.currentStatus.includes(p.current_status))
      return res.status(400).json({ error: `Invalid current_status: ${p.current_status}` });
    if (p.outside_purpose && !VALID.outsidePurpose.includes(p.outside_purpose))
      return res.status(400).json({ error: `Invalid outside_purpose: ${p.outside_purpose}` });

    const result = await query(
      `UPDATE participant_profiles SET
        marital_status      = $1,
        is_pregnant         = $2,
        number_of_children  = $3,
        current_status      = $4,
        current_institution = $5,
        current_course      = $6,
        current_year        = $7,
        current_exam_type   = $8,
        monthly_income      = $9,
        family_income       = $10,
        no_of_dependants    = $11,
        other_assistance    = $12,
        living_outside_ldc  = $13,
        outside_purpose     = $14,
        outside_location    = $15,
        last_updated_by     = $16,
        updated_at          = NOW()
        WHERE participant_id = $17
       RETURNING *`,
      [
        p.marital_status     || null,
        p.is_pregnant        || false,
        p.number_of_children || 0,
        p.current_status     || null,
        p.current_institution|| null,
        p.current_course     || null,
        p.current_year       || null,
        p.current_exam_type  || null,
        p.monthly_income     || null,
        p.family_income      || null,
        p.no_of_dependants   || 0,
        p.other_assistance   || null,
        p.living_outside_ldc || false,
        p.outside_purpose    || null,
        p.outside_location   || null,
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
    let queryText = `
      SELECT h.*, u.full_name as recorded_by_name
      FROM participant_status_history h
      JOIN participants p ON h.participant_id = p.id
      LEFT JOIN users u ON h.recorded_by = u.id
      WHERE h.participant_id = $1
    `;
    const params = [req.params.id];

    if (req.user.role === 'ldc_staff') {
      queryText += ` AND p.ldc_id = $2`;
      params.push(req.user.ldc_id);
    }
    queryText += ` ORDER BY h.recorded_at DESC`;

    const result = await query(queryText, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Status history not found or access denied' });
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status history' });
  }
});

// ── POST /api/participants/:id/status-history ────────────────────
router.post('/:id/status-history', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'ldc_staff') {
      const participantLdcCheck = await query('SELECT ldc_id, is_exited FROM participants WHERE id = $1', [req.params.id]);
      if (participantLdcCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      if (participantLdcCheck.rows[0].ldc_id !== req.user.ldc_id) {
        return res.status(403).json({ error: 'Access denied: Participant does not belong to your LDC.' });
      }
      if (participantLdcCheck.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Status history is locked.' });
      }
    }
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