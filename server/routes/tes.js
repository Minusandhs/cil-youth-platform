// ================================================================
// CIL Youth Development Platform — TES Routes
// ================================================================
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');
const { VALID } = require('../config/dropdowns');
const { sendTESRejectionEmail } = require('../utils/notifications');

const router = express.Router();

// ════════════════════════════════════════════════════════════════
// BATCH ROUTES
// ════════════════════════════════════════════════════════════════

router.get('/batches', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.full_name as created_by_name,
        COUNT(a.id) as application_count
       FROM tes_batches b
       LEFT JOIN users u ON b.created_by = u.id
       LEFT JOIN tes_applications a ON a.batch_id = b.id
       GROUP BY b.id, u.full_name
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get batches' });
  }
});

router.get('/batches/:id', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT b.*, u.full_name as created_by_name
       FROM tes_batches b
       LEFT JOIN users u ON b.created_by = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get batch' });
  }
});

router.post('/batches', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { batch_name, application_end_date, update_notes } = req.body;
    if (!batch_name || !application_end_date) {
      return res.status(400).json({
        error: 'Batch name and application end date are required'
      });
    }
    const result = await query(
      `INSERT INTO tes_batches
        (batch_name, application_end_date, update_notes, created_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [batch_name, application_end_date, update_notes || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

router.put('/batches/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const {
      batch_name, status, application_end_date,
      funded_date, update_notes
    } = req.body;

    // Get current batch status before update
    const currentBatch = await query(
      'SELECT status FROM tes_batches WHERE id = $1',
      [req.params.id]
    );
    const oldStatus = currentBatch.rows[0]?.status;

    // Update batch
    const result = await query(
      `UPDATE tes_batches SET
        batch_name           = $1,
        status               = $2,
        application_end_date = $3,
        funded_date          = $4,
        update_notes         = $5,
        updated_at           = NOW()
       WHERE id = $6 RETURNING *`,
      [
        batch_name, status, application_end_date,
        funded_date || null, update_notes || null,
        req.params.id
      ]
    );

    const batch = result.rows[0];

    // ── Auto-record TES history when batch → funded or completed ─
    if (
      ['funded', 'completed'].includes(status) &&
      !['funded', 'completed'].includes(oldStatus)
    ) {
      // Get all approved applications in this batch
      const apps = await query(
        `SELECT a.*, p.id as p_id
         FROM tes_applications a
         JOIN participants p ON a.participant_id = p.id
         WHERE a.batch_id = $1
         AND a.approval_status = 'approved'`,
        [req.params.id]
      );

      for (const app of apps.rows) {
        // Insert history record (ignore if already exists)
        await query(
          `INSERT INTO participant_tes_history (
            participant_id, batch_id, application_id,
            batch_name, institution_name, course_name,
            institution_type, course_duration, course_year,
            amount_received, status, recorded_by
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (application_id, batch_id) DO UPDATE SET
            status      = $11,
            recorded_by = $12,
            recorded_at = NOW()`,
          [
            app.p_id, req.params.id, app.id,
            batch.batch_name,
            app.institution_name || null,
            app.course_name      || null,
            app.institution_type || null,
            app.course_duration  || null,
            app.course_year      || null,
            app.amount_approved  || null,
            status,
            req.user.id
          ]
        );
      }
    }

    // ── Mark as reverted when batch goes back from funded ────────
    if (
      oldStatus === 'funded' &&
      status === 'closed'
    ) {
      await query(
        `UPDATE participant_tes_history
         SET status = 'reverted', recorded_at = NOW()
         WHERE batch_id = $1`,
        [req.params.id]
      );
    }

    res.json(batch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// ════════════════════════════════════════════════════════════════
// APPLICATION ROUTES
// ════════════════════════════════════════════════════════════════

router.get('/batches/:id/applications', verifyToken, async (req, res) => {
  try {
    let whereClause = 'WHERE a.batch_id = $1';
    let params = [req.params.id];

    if (req.user.role === 'ldc_staff') {
      whereClause += ' AND a.ldc_id = $2';
      params.push(req.user.ldc_id);
    }

    const result = await query(
      `SELECT a.*,
        p.full_name, p.participant_id as pid,
        p.date_of_birth, p.gender,
        l.ldc_id as ldc_code, l.name as ldc_name,
        u.full_name as submitted_by_name
       FROM tes_applications a
       JOIN participants p ON a.participant_id = p.id
       JOIN ldcs l ON a.ldc_id = l.id
       LEFT JOIN users u ON a.submitted_by = u.id
       ${whereClause}
       ORDER BY a.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

router.get('/applications/:id', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*,
        p.full_name, p.participant_id as pid,
        p.date_of_birth, p.gender,
        l.ldc_id as ldc_code, l.name as ldc_name
       FROM tes_applications a
       JOIN participants p ON a.participant_id = p.id
       JOIN ldcs l ON a.ldc_id = l.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get application' });
  }
});

router.post('/applications', verifyToken, async (req, res) => {
  try {
    const {
      batch_id, participant_id,
      contact_number, email, nic_number, guardian_name,
      institution_name, institution_type, course_name,
      course_duration, course_year, course_start_date,
      course_end_date, registration_number,
      financial_justification, community_contribution,
      fee_tuition, fee_materials, family_contribution, requested_amount,
      doc_application_form, doc_certificates,
      doc_admission_letter, doc_income_proof,
      doc_nic, doc_recommendation, commitment_confirmed,
      amount_approved, official_notes
    } = req.body;

    if (!batch_id || !participant_id) {
      return res.status(400).json({
        error: 'Batch and participant are required'
      });
    }

    // ── Enum validation ──────────────────────────────────────────
    if (institution_type && !VALID.instType.includes(institution_type))
      return res.status(400).json({ error: `Invalid institution_type: ${institution_type}` });

    const partResult = await query(
      'SELECT ldc_id FROM participants WHERE id = $1',
      [participant_id]
    );
    if (partResult.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const ldc_id = req.user.role === 'ldc_staff'
      ? req.user.ldc_id
      : partResult.rows[0].ldc_id;

    const result = await query(
      `INSERT INTO tes_applications (
        batch_id, participant_id, ldc_id, submitted_by,
        contact_number, email, nic_number, guardian_name,
        institution_name, institution_type, course_name,
        course_duration, course_year, course_start_date,
        course_end_date, registration_number,
        financial_justification, community_contribution,
        fee_tuition, fee_materials, family_contribution, requested_amount,
        doc_application_form, doc_certificates,
        doc_admission_letter, doc_income_proof,
        doc_nic, doc_recommendation, commitment_confirmed,
        amount_approved, official_notes
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
        $12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,
        $23,$24,$25,$26,$27,$28,$29,$30,$31
      ) RETURNING *`,
      [
        batch_id, participant_id, ldc_id, req.user.id,
        contact_number || null, email || null,
        nic_number || null, guardian_name || null,
        institution_name || null, institution_type || null,
        course_name || null, course_duration || null,
        course_year || null, course_start_date || null,
        course_end_date || null, registration_number || null,
        financial_justification || null, community_contribution || null,
        fee_tuition || null, fee_materials || null,
        family_contribution || null, requested_amount || null,
        doc_application_form || false, doc_certificates || false,
        doc_admission_letter || false, doc_income_proof || false,
        doc_nic || false, doc_recommendation || false,
        commitment_confirmed || false,
        amount_approved || null, official_notes || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'This participant has already applied to this batch'
      });
    }
    res.status(500).json({ error: 'Failed to create application' });
  }
});

router.put('/applications/:id', verifyToken, async (req, res) => {
  try {
    const {
      contact_number, email, nic_number, guardian_name,
      institution_name, institution_type, course_name,
      course_duration, course_year, course_start_date,
      course_end_date, registration_number,
      financial_justification, community_contribution,
      fee_tuition, fee_materials, family_contribution, requested_amount,
      doc_application_form, doc_certificates,
      doc_admission_letter, doc_income_proof,
      doc_nic, doc_recommendation, commitment_confirmed,
      amount_approved, official_notes
    } = req.body;

    // ── Enum validation ──────────────────────────────────────────
    if (institution_type && !VALID.instType.includes(institution_type))
      return res.status(400).json({ error: `Invalid institution_type: ${institution_type}` });

    // Fetch application + batch status
    const current = await query(
      `SELECT a.approval_status, b.status as batch_status
       FROM tes_applications a
       JOIN tes_batches b ON a.batch_id = b.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const currentStatus = current.rows[0].approval_status;
    const batchStatus   = current.rows[0].batch_status;

    // LDC staff can only edit when batch is open, or when resubmitting a rejected app
    if (req.user.role === 'ldc_staff') {
      const canEdit = batchStatus === 'open' || currentStatus === 'rejected';
      if (!canEdit) {
        return res.status(403).json({
          error: 'This application can no longer be edited — the batch is no longer open.'
        });
      }
    }

    const newStatus = currentStatus === 'rejected' ? 'resubmitted' : currentStatus;

    const result = await query(
      `UPDATE tes_applications SET
        contact_number          = $1,  email                   = $2,
        nic_number              = $3,  guardian_name           = $4,
        institution_name        = $5,  institution_type        = $6,
        course_name             = $7,  course_duration         = $8,
        course_year             = $9,  course_start_date       = $10,
        course_end_date         = $11, registration_number     = $12,
        financial_justification = $13, community_contribution  = $14,
        fee_tuition             = $15, fee_materials           = $16,
        family_contribution     = $17, requested_amount        = $18,
        doc_application_form    = $19, doc_certificates        = $20,
        doc_admission_letter    = $21, doc_income_proof        = $22,
        doc_nic                 = $23, doc_recommendation      = $24,
        commitment_confirmed    = $25,
        amount_approved         = $26, official_notes          = $27,
        approval_status         = $28,
        updated_at              = NOW()
       WHERE id = $29 RETURNING *`,
      [
        contact_number || null, email || null,
        nic_number || null, guardian_name || null,
        institution_name || null, institution_type || null,
        course_name || null, course_duration || null,
        course_year || null, course_start_date || null,
        course_end_date || null, registration_number || null,
        financial_justification || null, community_contribution || null,
        fee_tuition || null, fee_materials || null,
        family_contribution || null, requested_amount || null,
        doc_application_form || false, doc_certificates || false,
        doc_admission_letter || false, doc_income_proof || false,
        doc_nic || false, doc_recommendation || false,
        commitment_confirmed || false,
        amount_approved || null, official_notes || null,
        newStatus,
        req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// ── Admin only — update approval status ─────────────────────────
router.put('/applications/:id/official', verifyToken, requireSuperAdmin,
  async (req, res) => {
  try {
    const { approval_status, admin_notes } = req.body;
    
    // Fetch participant info and current notes before update
    const currentApp = await query(
      `SELECT a.official_notes, a.ldc_id, p.full_name, p.participant_id, b.batch_name, a.participant_id AS numeric_id, b.status AS batch_status
       FROM tes_applications a
       JOIN participants p ON a.participant_id = p.id
       JOIN tes_batches b ON a.batch_id = b.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (currentApp.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = currentApp.rows[0];

    const result = await query(
      `UPDATE tes_applications SET
        approval_status = $1,
        admin_notes     = $2,
        reviewed_by     = $3,
        reviewed_at     = NOW(),
        updated_at      = NOW()
       WHERE id = $4 RETURNING *`,
      [
        approval_status || 'pending',
        admin_notes     || null,
        req.user.id,
        req.params.id
      ]
    );

    // ── Trigger Rejection Email ──────────────────────────────────
    if (approval_status === 'rejected') {
      // Await so we catch any immediate config/credential errors, 
      // but wrap in try/catch to not block the API response
      try {
        await sendTESRejectionEmail(
          app.full_name,
          app.participant_id,
          app.ldc_id,
          admin_notes,
          app.batch_name,
          app.numeric_id
        );
      } catch (emailErr) {
        console.error('❌ Notification trigger failed:', emailErr.message);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Decision update error:', error);
    res.status(500).json({ error: 'Failed to update official decision' });
  }
});

// ── PATCH /api/tes/applications/:id/monitoring ──────────────────
// Update monitoring_status and disbursed_amount (LDC staff + admins)
router.patch('/applications/:id/monitoring', verifyToken, async (req, res) => {
  try {
    const { monitoring_status, disbursed_amount } = req.body;

    const VALID_MONITORING = ['not_started','continuing','stopped','temporarily_stopped','other'];
    if (monitoring_status && !VALID_MONITORING.includes(monitoring_status)) {
      return res.status(400).json({ error: 'Invalid monitoring_status' });
    }

    const appRes = await query(
      `SELECT a.ldc_id, a.approval_status, a.amount_approved, b.status as batch_status
       FROM tes_applications a
       JOIN tes_batches b ON a.batch_id = b.id
       WHERE a.id = $1`,
      [req.params.id]
    );
    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const { ldc_id, approval_status, amount_approved, batch_status } = appRes.rows[0];

    if (approval_status !== 'approved') {
      return res.status(403).json({ error: 'Monitoring can only be updated for approved applications' });
    }

    if (req.user.role === 'ldc_staff') {
      if (ldc_id !== req.user.ldc_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (!['funded', 'completed'].includes(batch_status)) {
        return res.status(403).json({
          error: 'Monitoring can only be updated for funded or completed batches'
        });
      }
    }

    if (disbursed_amount != null && amount_approved != null &&
        parseFloat(disbursed_amount) > parseFloat(amount_approved)) {
      return res.status(400).json({
        error: `Disbursed amount cannot exceed the approved amount (${amount_approved})`
      });
    }

    const result = await query(
      `UPDATE tes_applications SET
         monitoring_status = COALESCE($1, monitoring_status),
         disbursed_amount  = $2,
         updated_at        = NOW()
       WHERE id = $3 RETURNING *`,
      [monitoring_status || null, disbursed_amount ?? null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update monitoring data' });
  }
});

// ── DELETE /api/tes/applications/:id ────────────────────────────
router.delete('/applications/:id', verifyToken, async (req, res) => {
  try {
    // Only allow delete if batch is open and application is pending
    const appResult = await query(
      `SELECT a.*, b.status as batch_status
       FROM tes_applications a
       JOIN tes_batches b ON a.batch_id = b.id
       WHERE a.id = $1`,
      [req.params.id]
    );

    if (appResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const app = appResult.rows[0];

    if (app.batch_status !== 'open') {
      return res.status(400).json({
        error: 'Cannot remove application from a closed batch'
      });
    }

    if (app.approval_status !== 'pending') {
      return res.status(400).json({
        error: 'Cannot remove an approved or rejected application'
      });
    }

    // LDC staff can only delete their own LDC applications
    if (req.user.role === 'ldc_staff' && app.ldc_id !== req.user.ldc_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM tes_applications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Application removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove application' });
  }
});

// ── Export ───────────────────────────────────────────────────────
router.get('/batches/:id/export', verifyToken, async (req, res) => {
  try {
    let whereClause = 'WHERE a.batch_id = $1';
    let params = [req.params.id];

    if (req.user.role === 'ldc_staff') {
      whereClause += ' AND a.ldc_id = $2';
      params.push(req.user.ldc_id);
    }

    const result = await query(
      `SELECT
        p.id as internal_id,
        p.participant_id as pid, p.full_name,
        p.date_of_birth, p.gender,
        l.ldc_id as ldc_code, l.name as ldc_name,
        pp.marital_status, pp.number_of_children,
        pp.current_status, pp.current_institution,
        pp.current_course, pp.family_income,
        pp.no_of_dependants, pp.other_assistance,
        COALESCE(cp.long_term_plan, pp.long_term_plan) AS long_term_plan,
        COALESCE(cp.career_aspiration, pp.career_goal) AS career_aspiration,
        cp.aspired_industry,
        cp.interested_to_apply,
        cp.interest_industry,
        cp.interest_notes,
        cp.holland_primary, cp.holland_secondary, cp.holland_tertiary,
        cp.career_choice_1, cp.career_choice_2, cp.career_choice_3,
        a.contact_number, a.email, a.nic_number, a.guardian_name,
        a.institution_name, a.institution_type, a.course_name,
        a.course_duration, a.course_year,
        a.course_start_date, a.course_end_date,
        a.registration_number,
        a.financial_justification, a.community_contribution,
        a.fee_tuition, a.fee_materials,
        a.family_contribution, a.requested_amount,
        a.doc_application_form, a.doc_certificates,
        a.doc_admission_letter, a.doc_income_proof,
        a.doc_nic, a.doc_recommendation,
        a.commitment_confirmed,
        a.amount_approved, a.approval_status,
        a.official_notes
       FROM tes_applications a
       JOIN participants p ON a.participant_id = p.id
       JOIN ldcs l ON a.ldc_id = l.id
       LEFT JOIN participant_profiles pp ON pp.participant_id = p.id
       LEFT JOIN participant_career_plans cp ON cp.participant_id = p.id
       ${whereClause}
       ORDER BY l.ldc_id, p.full_name`,
      params
    );

    const apps = result.rows;
    if (apps.length === 0) return res.json([]);

    const internalIds = apps.map(a => a.internal_id);

    // Bulk fetch OL (most recent per participant)
    const [olAll, alAll, certAll, devAll] = await Promise.all([
      query(
        `SELECT DISTINCT ON (r.participant_id)
           r.participant_id, r.exam_year, r.school_name,
           string_agg(s.subject_name || ': ' || s.grade, ', '
             ORDER BY s.is_core DESC) as subjects
         FROM ol_results r
         LEFT JOIN ol_result_subjects s ON s.ol_result_id = r.id
         WHERE r.participant_id = ANY($1)
         GROUP BY r.participant_id, r.id
         ORDER BY r.participant_id, r.exam_year DESC`,
        [internalIds]
      ),
      query(
        `SELECT DISTINCT ON (r.participant_id)
           r.participant_id, r.exam_year, r.stream, r.z_score,
           string_agg(s.subject_name || ': ' || s.grade, ', '
             ORDER BY s.subject_type) as subjects
         FROM al_results r
         LEFT JOIN al_result_subjects s ON s.al_result_id = r.id
         WHERE r.participant_id = ANY($1)
         GROUP BY r.participant_id, r.id
         ORDER BY r.participant_id, r.exam_year DESC`,
        [internalIds]
      ),
      query(
        `SELECT c.participant_id, c.cert_name, t.type_name, c.grade_result
         FROM certifications c
         JOIN cert_types t ON c.cert_type_id = t.id
         WHERE c.participant_id = ANY($1)
         ORDER BY c.participant_id, c.issued_date DESC`,
        [internalIds]
      ),
      query(
        `SELECT DISTINCT ON (participant_id)
           participant_id, spiritual_goal, academic_goal, social_goal,
           vocational_goal, health_goal, progress_status, completion_rate
         FROM development_plans
         WHERE participant_id = ANY($1)
         ORDER BY participant_id, plan_year DESC`,
        [internalIds]
      ),
    ]);

    // Build lookup maps
    const olMap   = Object.fromEntries(olAll.rows.map(r  => [r.participant_id, r]));
    const alMap   = Object.fromEntries(alAll.rows.map(r  => [r.participant_id, r]));
    const devMap  = Object.fromEntries(devAll.rows.map(r => [r.participant_id, r]));
    const certMap = {};
    certAll.rows.forEach(r => {
      if (!certMap[r.participant_id]) certMap[r.participant_id] = [];
      certMap[r.participant_id].push(r);
    });

    // Attach to apps
    apps.forEach(app => {
      const ol = olMap[app.internal_id];
      app.ol_text = ol
        ? `OL ${ol.exam_year} (${ol.school_name || ''}): ${ol.subjects || ''}`
        : '';

      const al = alMap[app.internal_id];
      app.al_text = al
        ? `AL ${al.exam_year} (${al.stream || ''}): ${al.subjects || ''} | Z-Score: ${al.z_score || 'N/A'}`
        : '';

      const certs = certMap[app.internal_id] || [];
      app.certs_text = certs
        .map(c => `${c.cert_name} (${c.type_name})${c.grade_result ? ': '+c.grade_result : ''}`)
        .join(' | ');

      const d = devMap[app.internal_id];
      if (d) {
        const goals = [
          d.spiritual_goal  ? `Spiritual: ${d.spiritual_goal}`   : null,
          d.academic_goal   ? `Academic: ${d.academic_goal}`     : null,
          d.social_goal     ? `Social: ${d.social_goal}`         : null,
          d.vocational_goal ? `Vocational: ${d.vocational_goal}` : null,
          d.health_goal     ? `Health: ${d.health_goal}`         : null,
        ].filter(Boolean);
        app.dev_plan_text = goals.join(' | ') +
          ` | Status: ${d.progress_status} (${d.completion_rate}%)`;
      } else {
        app.dev_plan_text = '';
      }
    });

    res.json(apps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ── GET /api/tes/history/:participantId ──────────────────────────
router.get('/history/:participantId', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*,
        b.status as batch_status,
        b.funded_date
       FROM participant_tes_history h
       JOIN tes_batches b ON h.batch_id = b.id
       WHERE h.participant_id = $1
       ORDER BY h.recorded_at DESC`,
      [req.params.participantId]
    );

    // Calculate total received (exclude reverted)
    const total = result.rows
      .filter(h => h.status !== 'reverted')
      .reduce((sum, h) => sum + (parseFloat(h.amount_received) || 0), 0);

    res.json({ history: result.rows, total_received: total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get TES history' });
  }
});

// ════════════════════════════════════════════════════════════════
// DISBURSEMENT PLAN ROUTES
// ════════════════════════════════════════════════════════════════

// Shared helper — fetch application with ldc_id + batch status + amount_approved
async function getAppForDisbursement(appId, userId, userRole, userLdcId) {
  const res = await query(
    `SELECT a.id, a.ldc_id, a.approval_status, a.amount_approved, b.status as batch_status
     FROM tes_applications a
     JOIN tes_batches b ON a.batch_id = b.id
     WHERE a.id = $1`,
    [appId]
  );
  if (!res.rows[0]) return { error: 'Application not found', status: 404 };
  const app = res.rows[0];
  if (app.approval_status !== 'approved')
    return { error: 'Disbursement plan only available for approved applications', status: 403 };
  if (userRole === 'ldc_staff') {
    if (app.ldc_id !== userLdcId)
      return { error: 'Access denied', status: 403 };
    if (!['funded', 'completed'].includes(app.batch_status))
      return { error: 'Disbursement plan only available for funded or completed batches', status: 403 };
  }
  return { app };
}

// ── GET /api/tes/applications/:id/disbursement ───────────────────
router.get('/applications/:id/disbursement', verifyToken, async (req, res) => {
  try {
    const { app, error, status } = await getAppForDisbursement(
      req.params.id, req.user.id, req.user.role, req.user.ldc_id
    );
    if (error) return res.status(status).json({ error });

    const result = await query(
      `SELECT t.*, u.full_name as created_by_name, upd.full_name as updated_by_name
       FROM tes_disbursement_tranches t
       LEFT JOIN users u   ON u.id   = t.created_by
       LEFT JOIN users upd ON upd.id = t.updated_by
       WHERE t.application_id = $1
       ORDER BY t.tranche_number ASC, t.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load disbursement plan' });
  }
});

// ── POST /api/tes/applications/:id/disbursement ──────────────────
router.post('/applications/:id/disbursement', verifyToken, async (req, res) => {
  try {
    const { app, error, status } = await getAppForDisbursement(
      req.params.id, req.user.id, req.user.role, req.user.ldc_id
    );
    if (error) return res.status(status).json({ error });

    const { label, planned_amount, planned_date, notes } = req.body;
    if (!planned_amount || parseFloat(planned_amount) <= 0)
      return res.status(400).json({ error: 'Planned amount must be greater than 0' });
    if (!planned_date)
      return res.status(400).json({ error: 'Planned date is required' });

    // Check sum would not exceed amount_approved
    const sumRes = await query(
      `SELECT COALESCE(SUM(planned_amount), 0) as total
       FROM tes_disbursement_tranches WHERE application_id = $1`,
      [req.params.id]
    );
    const currentTotal = parseFloat(sumRes.rows[0].total);
    const newTotal = currentTotal + parseFloat(planned_amount);
    if (app.amount_approved != null && newTotal > parseFloat(app.amount_approved)) {
      return res.status(400).json({
        error: `Total planned amount (${newTotal}) would exceed the approved amount (${app.amount_approved})`
      });
    }

    // Assign next tranche number
    const numRes = await query(
      `SELECT COALESCE(MAX(tranche_number), 0) + 1 as next_num
       FROM tes_disbursement_tranches WHERE application_id = $1`,
      [req.params.id]
    );
    const tranche_number = numRes.rows[0].next_num;

    const result = await query(
      `INSERT INTO tes_disbursement_tranches
         (application_id, tranche_number, label, planned_amount, planned_date, notes, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING *`,
      [req.params.id, tranche_number, label || null, planned_amount, planned_date, notes || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add installment' });
  }
});

// ── PATCH /api/tes/disbursement/:trancheId ───────────────────────
router.patch('/disbursement/:trancheId', verifyToken, async (req, res) => {
  try {
    const trancheRes = await query(
      `SELECT t.*, a.ldc_id, a.approval_status, a.amount_approved, b.status as batch_status
       FROM tes_disbursement_tranches t
       JOIN tes_applications a ON a.id = t.application_id
       JOIN tes_batches b ON b.id = a.batch_id
       WHERE t.id = $1`,
      [req.params.trancheId]
    );
    if (!trancheRes.rows[0]) return res.status(404).json({ error: 'Installment not found' });
    const tranche = trancheRes.rows[0];

    if (req.user.role === 'ldc_staff') {
      if (tranche.ldc_id !== req.user.ldc_id) return res.status(403).json({ error: 'Access denied' });
      if (!['funded', 'completed'].includes(tranche.batch_status))
        return res.status(403).json({ error: 'Access denied' });
    }

    const { label, planned_amount, planned_date, notes, status, disbursed_amount, disbursed_date } = req.body;

    // Cannot change planned_amount once disbursed
    if (planned_amount && tranche.status === 'disbursed')
      return res.status(400).json({ error: 'Cannot change planned amount of a disbursed installment' });

    const result = await query(
      `UPDATE tes_disbursement_tranches SET
         label            = COALESCE($1, label),
         planned_amount   = COALESCE($2, planned_amount),
         planned_date     = COALESCE($3, planned_date),
         notes            = COALESCE($4, notes),
         status           = COALESCE($5, status),
         disbursed_amount = COALESCE($6, disbursed_amount),
         disbursed_date   = COALESCE($7, disbursed_date),
         updated_by       = $8,
         updated_at       = NOW()
       WHERE id = $9 RETURNING *`,
      [
        label || null, planned_amount || null, planned_date || null,
        notes || null, status || null, disbursed_amount || null,
        disbursed_date || null, req.user.id, req.params.trancheId
      ]
    );

    // Auto-sync disbursed_amount on the application from sum of disbursed tranches
    await query(
      `UPDATE tes_applications SET
         disbursed_amount = (
           SELECT COALESCE(SUM(disbursed_amount), 0)
           FROM tes_disbursement_tranches
           WHERE application_id = $1 AND status = 'disbursed'
         ),
         updated_at = NOW()
       WHERE id = $1`,
      [tranche.application_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update installment' });
  }
});

// ── DELETE /api/tes/disbursement/:trancheId ──────────────────────
router.delete('/disbursement/:trancheId', verifyToken, async (req, res) => {
  try {
    const trancheRes = await query(
      `SELECT t.*, a.ldc_id, b.status as batch_status
       FROM tes_disbursement_tranches t
       JOIN tes_applications a ON a.id = t.application_id
       JOIN tes_batches b ON b.id = a.batch_id
       WHERE t.id = $1`,
      [req.params.trancheId]
    );
    if (!trancheRes.rows[0]) return res.status(404).json({ error: 'Installment not found' });
    const tranche = trancheRes.rows[0];

    if (req.user.role === 'ldc_staff' && tranche.ldc_id !== req.user.ldc_id)
      return res.status(403).json({ error: 'Access denied' });
    if (tranche.status !== 'planned')
      return res.status(400).json({ error: 'Only planned installments can be deleted' });

    await query('DELETE FROM tes_disbursement_tranches WHERE id = $1', [req.params.trancheId]);
    res.json({ message: 'Installment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete installment' });
  }
});

module.exports = router;