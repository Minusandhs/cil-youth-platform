// ================================================================
// CIL Youth Development Platform — Development Plan Routes
// ================================================================
const express = require('express');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { VALID } = require('../constants');

const router = express.Router();

// ── helpers ─────────────────────────────────────────────────────
async function checkExited(role, planId) {
  if (role !== 'ldc_staff') return false;
  const r = await query(
    `SELECT p.is_exited FROM participants p
     JOIN development_plans d ON d.participant_id = p.id
     WHERE d.id = $1`, [planId]
  );
  return r.rows[0]?.is_exited || false;
}

async function checkParticipantExited(role, participantId) {
  if (role !== 'ldc_staff') return false;
  const r = await query(
    'SELECT is_exited FROM participants WHERE id = $1', [participantId]
  );
  return r.rows[0]?.is_exited || false;
}

// ── GET /api/development/:participantId ──────────────────────────
router.get('/:participantId', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, plan_year, progress_status, completion_rate, created_at
       FROM development_plans
       WHERE participant_id = $1
       ORDER BY plan_year DESC`,
      [req.params.participantId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to get development plans' });
  }
});

// IMPORTANT: specific two-segment routes (:planId/actions, :planId/conversations)
// must be defined BEFORE the generic /:participantId/:year route, otherwise Express
// matches them as year='actions' / year='conversations'.

// ── GET /api/development/:planId/actions ─────────────────────────
router.get('/:planId/actions', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, goal_type, action, due_date, status, created_at
       FROM development_plan_action_items
       WHERE plan_id = $1
       ORDER BY created_at ASC`,
      [req.params.planId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to get action items' });
  }
});

// ── GET /api/development/:planId/conversations ───────────────────
router.get('/:planId/conversations', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.conversation_date, c.discussion_points,
              c.next_meeting_date, c.completion_rate, c.created_at,
              u.full_name AS recorded_by_name
       FROM mentor_conversations c
       LEFT JOIN users u ON u.id = c.recorded_by
       WHERE c.plan_id = $1
       ORDER BY c.conversation_date DESC`,
      [req.params.planId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// ── GET /api/development/:participantId/:year ────────────────────
router.get('/:participantId/:year', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, plan_year, spiritual_goal, academic_goal, social_goal,
              vocational_goal, health_goal, primary_mentor,
              progress_status, completion_rate, created_at, updated_at
       FROM development_plans
       WHERE participant_id = $1 AND plan_year = $2`,
      [req.params.participantId, req.params.year]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to get development plan' });
  }
});

// ── POST /api/development ────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { participant_id, plan_year } = req.body;
    if (!participant_id || !plan_year)
      return res.status(400).json({ error: 'Participant and plan year are required' });

    if (await checkParticipantExited(req.user.role, participant_id))
      return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const result = await query(
      `INSERT INTO development_plans
         (participant_id, plan_year, progress_status, completion_rate, created_by, updated_by)
       VALUES ($1, $2, 'not_started', 0, $3, $3)
       RETURNING id, plan_year, progress_status, completion_rate, created_at`,
      [participant_id, plan_year, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505')
      return res.status(400).json({ error: 'A plan for this year already exists' });
    res.status(500).json({ error: 'Failed to create development plan' });
  }
});

// ── PUT /api/development/:id ─────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const {
      spiritual_goal, academic_goal, social_goal,
      vocational_goal, health_goal, primary_mentor,
      progress_status, completion_rate
    } = req.body;

    if (progress_status && !VALID.planStatus.includes(progress_status))
      return res.status(400).json({ error: `Invalid progress_status: ${progress_status}` });

    if (await checkExited(req.user.role, req.params.id))
      return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const result = await query(
      `UPDATE development_plans SET
         spiritual_goal  = $1, academic_goal  = $2,
         social_goal     = $3, vocational_goal = $4,
         health_goal     = $5, primary_mentor  = $6,
         progress_status = $7, completion_rate = $8,
         updated_by      = $9, updated_at      = NOW()
       WHERE id = $10 RETURNING
         id, plan_year, spiritual_goal, academic_goal, social_goal,
         vocational_goal, health_goal, primary_mentor,
         progress_status, completion_rate, created_at, updated_at`,
      [
        spiritual_goal  || null, academic_goal   || null,
        social_goal     || null, vocational_goal || null,
        health_goal     || null, primary_mentor  || null,
        progress_status || 'not_started',
        completion_rate ?? 0,
        req.user.id, req.params.id
      ]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update development plan' });
  }
});

// ================================================================
// Action Items
// ================================================================

// ── POST /api/development/:planId/actions ────────────────────────
router.post('/:planId/actions', verifyToken, async (req, res) => {
  try {
    const { goal_type, action, due_date, status } = req.body;
    if (!goal_type || !action?.trim())
      return res.status(400).json({ error: 'Goal type and action are required' });

    if (await checkExited(req.user.role, req.params.planId))
      return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const result = await query(
      `INSERT INTO development_plan_action_items
         (plan_id, goal_type, action, due_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, goal_type, action, due_date, status, created_at`,
      [
        req.params.planId, goal_type, action.trim(),
        due_date || null,
        status || 'pending',
        req.user.id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create action item' });
  }
});

// ── PUT /api/development/:planId/actions/:itemId ─────────────────
router.put('/:planId/actions/:itemId', verifyToken, async (req, res) => {
  try {
    const { goal_type, action, due_date, status } = req.body;
    if (!goal_type || !action?.trim())
      return res.status(400).json({ error: 'Goal type and action are required' });

    if (await checkExited(req.user.role, req.params.planId))
      return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const result = await query(
      `UPDATE development_plan_action_items SET
         goal_type  = $1, action    = $2,
         due_date   = $3, status    = $4,
         updated_at = NOW()
       WHERE id = $5 AND plan_id = $6
       RETURNING id, goal_type, action, due_date, status, created_at`,
      [
        goal_type, action.trim(),
        due_date || null, status || 'pending',
        req.params.itemId, req.params.planId
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update action item' });
  }
});

// ── DELETE /api/development/:planId/actions/:itemId ──────────────
router.delete('/:planId/actions/:itemId', verifyToken, async (req, res) => {
  try {
    if (await checkExited(req.user.role, req.params.planId))
      return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    await query(
      `DELETE FROM development_plan_action_items WHERE id = $1 AND plan_id = $2`,
      [req.params.itemId, req.params.planId]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete action item' });
  }
});

// ================================================================
// Mentor Conversations
// ================================================================

// ── POST /api/development/:planId/conversations ──────────────────
router.post('/:planId/conversations', verifyToken, async (req, res) => {
  try {
    const { conversation_date, discussion_points, next_meeting_date, completion_rate } = req.body;
    if (!conversation_date || !discussion_points?.trim())
      return res.status(400).json({ error: 'Date and discussion points are required' });

    if (await checkExited(req.user.role, req.params.planId))
      return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    const result = await query(
      `INSERT INTO mentor_conversations
         (plan_id, conversation_date, discussion_points, next_meeting_date,
          completion_rate, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, conversation_date, discussion_points,
                 next_meeting_date, completion_rate, created_at`,
      [
        req.params.planId, conversation_date, discussion_points.trim(),
        next_meeting_date || null,
        completion_rate ?? 0,
        req.user.id
      ]
    );

    // Update plan's completion_rate to match latest conversation
    await query(
      `UPDATE development_plans SET completion_rate = $1, updated_at = NOW()
       WHERE id = $2`,
      [completion_rate ?? 0, req.params.planId]
    );

    const conv = result.rows[0];
    res.status(201).json(conv);
  } catch {
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// ── DELETE /api/development/:planId/conversations/:convId ────────
router.delete('/:planId/conversations/:convId', verifyToken, async (req, res) => {
  try {
    if (await checkExited(req.user.role, req.params.planId))
      return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });

    await query(
      `DELETE FROM mentor_conversations WHERE id = $1 AND plan_id = $2`,
      [req.params.convId, req.params.planId]
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
