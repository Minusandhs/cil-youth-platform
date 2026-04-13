// ================================================================
// CIL Youth Development Platform — Development Plan Routes
// ================================================================
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/development/:participantId ──────────────────────────
router.get('/:participantId', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, plan_year, progress_status, completion_rate
       FROM development_plans
       WHERE participant_id = $1
       ORDER BY plan_year DESC`,
      [req.params.participantId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get development plans' });
  }
});

// ── GET /api/development/:participantId/:year ────────────────────
router.get('/:participantId/:year', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM development_plans
       WHERE participant_id = $1 AND plan_year = $2`,
      [req.params.participantId, req.params.year]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get development plan' });
  }
});

// ── GET /api/development/:planId/history/all ─────────────────────
router.get('/:planId/history/all', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*, u.full_name as recorded_by_name,
              s.spiritual_goal, s.academic_goal, s.social_goal,
              s.vocational_goal, s.health_goal
       FROM development_plan_history h
       LEFT JOIN users u ON h.recorded_by = u.id
       LEFT JOIN development_plan_goal_snapshots s ON s.history_id = h.id
       WHERE h.plan_id = $1
       ORDER BY h.recorded_at DESC`,
      [req.params.planId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// ── POST /api/development ────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      participant_id, plan_year,
      spiritual_goal, academic_goal, social_goal,
      vocational_goal, health_goal,
      actions, resources_needed, timeline,
      primary_mentor, mentor_contact, mentor_notes,
      last_reviewed, next_review,
      notes
    } = req.body;

    if (!participant_id || !plan_year) {
      return res.status(400).json({
        error: 'Participant and plan year are required'
      });
    }

    if (req.user.role === 'ldc_staff') {
      const check = await query('SELECT is_exited FROM participants WHERE id = $1', [participant_id]);
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        error: 'Notes are required when saving a plan'
      });
    }

    await transaction(async (client) => {
      // Create plan
      const planResult = await client.query(
        `INSERT INTO development_plans (
          participant_id, plan_year,
          spiritual_goal, academic_goal, social_goal,
          vocational_goal, health_goal,
          actions, resources_needed, timeline,
          progress_status, completion_rate,
          primary_mentor, mentor_contact, mentor_notes,
          last_reviewed, next_review,
          created_by, updated_by
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          'not_started',0,
          $11,$12,$13,$14,$15,$16,$16
        ) RETURNING *`,
        [
          participant_id, plan_year,
          spiritual_goal   || null, academic_goal  || null,
          social_goal      || null, vocational_goal|| null,
          health_goal      || null, actions        || null,
          resources_needed || null, timeline       || null,
          primary_mentor   || null, mentor_contact || null,
          mentor_notes     || null,
          last_reviewed    || null, next_review    || null,
          req.user.id
        ]
      );

      const plan = planResult.rows[0];

      // Create initial history entry
      const histResult = await client.query(
        `INSERT INTO development_plan_history
          (plan_id, change_type, progress_status,
           completion_rate, notes, recorded_by)
         VALUES ($1,'goals','not_started',0,$2,$3)
         RETURNING *`,
        [plan.id, notes.trim(), req.user.id]
      );

      // Save goal snapshot
      await client.query(
        `INSERT INTO development_plan_goal_snapshots
          (history_id, spiritual_goal, academic_goal,
           social_goal, vocational_goal, health_goal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          histResult.rows[0].id,
          spiritual_goal || null, academic_goal  || null,
          social_goal    || null, vocational_goal|| null,
          health_goal    || null
        ]
      );

      res.status(201).json(plan);
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'A plan for this year already exists'
      });
    }
    res.status(500).json({ error: 'Failed to create development plan' });
  }
});

// ── PUT /api/development/:id ─────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      spiritual_goal, academic_goal, social_goal,
      vocational_goal, health_goal,
      actions, resources_needed, timeline,
      progress_status, completion_rate,
      primary_mentor, mentor_contact, mentor_notes,
      last_reviewed, next_review,
      notes, goals_changed, progress_changed
    } = req.body;

    if (req.user.role === 'ldc_staff') {
      const check = await query(
        `SELECT p.is_exited FROM participants p
         JOIN development_plans d ON d.participant_id = p.id
         WHERE d.id = $1`, [req.params.id]
      );
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        error: 'Notes are required when saving changes'
      });
    }

    await transaction(async (client) => {
      // Update plan
      const planResult = await client.query(
        `UPDATE development_plans SET
          spiritual_goal   = $1,  academic_goal    = $2,
          social_goal      = $3,  vocational_goal  = $4,
          health_goal      = $5,  actions          = $6,
          resources_needed = $7,  timeline         = $8,
          progress_status  = $9,  completion_rate  = $10,
          primary_mentor   = $11, mentor_contact   = $12,
          mentor_notes     = $13, last_reviewed    = $14,
          next_review      = $15, updated_by       = $16,
          updated_at       = NOW()
         WHERE id = $17 RETURNING *`,
        [
          spiritual_goal   || null, academic_goal  || null,
          social_goal      || null, vocational_goal|| null,
          health_goal      || null, actions        || null,
          resources_needed || null, timeline       || null,
          progress_status  || 'not_started',
          completion_rate  || 0,
          primary_mentor   || null, mentor_contact || null,
          mentor_notes     || null,
          last_reviewed    || null, next_review    || null,
          req.user.id, req.params.id
        ]
      );

      const plan = planResult.rows[0];

      // Determine change type
      let changeType = 'both';
      if (goals_changed && !progress_changed) changeType = 'goals';
      if (!goals_changed && progress_changed) changeType = 'progress';

      // Create history entry
      const histResult = await client.query(
        `INSERT INTO development_plan_history
          (plan_id, change_type, progress_status,
           completion_rate, notes, recorded_by)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [
          plan.id, changeType,
          progress_status || 'not_started',
          completion_rate || 0,
          notes.trim(), req.user.id
        ]
      );

      // Save goal snapshot if goals changed
      if (goals_changed || changeType === 'both') {
        await client.query(
          `INSERT INTO development_plan_goal_snapshots
            (history_id, spiritual_goal, academic_goal,
             social_goal, vocational_goal, health_goal)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [
            histResult.rows[0].id,
            spiritual_goal || null, academic_goal  || null,
            social_goal    || null, vocational_goal|| null,
            health_goal    || null
          ]
        );
      }

      res.json(plan);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update development plan' });
  }
});

module.exports = router;