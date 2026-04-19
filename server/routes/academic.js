// ================================================================
// CIL Youth Development Platform — Academic Routes
// ================================================================
const express = require('express');
const { query, transaction } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { VALID } = require('../constants');

const router = express.Router();

// ── GET /api/academic/ol/:participantId ──────────────────────────
router.get('/ol/:participantId', verifyToken, async (req, res) => {
  try {
    const results = await query(
      `SELECT r.*, 
        json_agg(
          json_build_object(
            'id', s.id,
            'subject_name', s.subject_name,
            'grade', s.grade,
            'is_core', s.is_core
          ) ORDER BY s.is_core DESC
        ) as subjects
       FROM ol_results r
       LEFT JOIN ol_result_subjects s ON s.ol_result_id = r.id
       WHERE r.participant_id = $1
       GROUP BY r.id
       ORDER BY r.exam_year DESC`,
      [req.params.participantId]
    );
    res.json(results.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get OL results' });
  }
});

// ── POST /api/academic/ol ────────────────────────────────────────
router.post('/ol', verifyToken, async (req, res) => {
  try {
    const {
      participant_id, exam_year, index_number,
      school_name, no_of_passes, passed, plan_after,
      results_verified, notes, subjects
    } = req.body;

    if (req.user.role === 'ldc_staff') {
      const check = await query('SELECT is_exited FROM participants WHERE id = $1', [participant_id]);
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    await transaction(async (client) => {
      const resultRow = await client.query(
        `INSERT INTO ol_results
          (participant_id, exam_year, index_number,
           school_name, no_of_passes, passed, plan_after,
           results_verified, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [
          participant_id, exam_year, index_number || null,
          school_name || null, no_of_passes || null,
          passed || false, JSON.stringify(plan_after || []),
          results_verified || false, notes || null,
          req.user.id
        ]
      );

      const olResult = resultRow.rows[0];

      if (subjects && subjects.length > 0) {
        const seen = new Set();
        for (const s of subjects) {
          if (!s.subject_name) continue;
          if (seen.has(s.subject_name)) continue;
          seen.add(s.subject_name);
          await client.query(
            `INSERT INTO ol_result_subjects
              (ol_result_id, subject_name, grade, is_core)
             VALUES ($1,$2,$3,$4)`,
            [olResult.id, s.subject_name, s.grade, s.is_core || false]
          );
        }
      }

      res.status(201).json(olResult);
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'OL result for this year already exists'
      });
    }
    res.status(500).json({ error: 'Failed to save OL result' });
  }
});

// ── PUT /api/academic/ol/:id ─────────────────────────────────────
router.put('/ol/:id', verifyToken, async (req, res) => {
  try {
    const {
      exam_year, index_number, school_name,
      no_of_passes, passed, plan_after,
      results_verified, notes, subjects
    } = req.body;

    if (req.user.role === 'ldc_staff') {
      const check = await query(
        `SELECT p.is_exited FROM participants p
         JOIN ol_results r ON r.participant_id = p.id
         WHERE r.id = $1`, [req.params.id]
      );
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    await transaction(async (client) => {
      await client.query(
        `UPDATE ol_results SET
          exam_year        = $1,
          index_number     = $2,
          school_name      = $3,
          no_of_passes     = $4,
          passed           = $5,
          plan_after       = $6,
          results_verified = $7,
          notes            = $8,
          updated_at       = NOW()
         WHERE id = $9`,
        [
          exam_year, index_number || null,
          school_name || null, no_of_passes || null,
          passed || false, JSON.stringify(plan_after || []),
          results_verified || false, notes || null,
          req.params.id
        ]
      );

      await client.query(
        'DELETE FROM ol_result_subjects WHERE ol_result_id = $1',
        [req.params.id]
      );

      if (subjects && subjects.length > 0) {
        const seen = new Set();
        for (const s of subjects) {
          if (!s.subject_name) continue;
          if (seen.has(s.subject_name)) continue;
          seen.add(s.subject_name);
          await client.query(
            `INSERT INTO ol_result_subjects
              (ol_result_id, subject_name, grade, is_core)
             VALUES ($1,$2,$3,$4)`,
            [req.params.id, s.subject_name, s.grade, s.is_core || false]
          );
        }
      }

      res.json({ message: 'OL result updated' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update OL result' });
  }
});

// ── GET /api/academic/al/:participantId ──────────────────────────
router.get('/al/:participantId', verifyToken, async (req, res) => {
  try {
    const results = await query(
      `SELECT r.*,
        json_agg(
          json_build_object(
            'id', s.id,
            'subject_name', s.subject_name,
            'grade', s.grade,
            'subject_type', s.subject_type
          ) ORDER BY s.subject_type
        ) as subjects
       FROM al_results r
       LEFT JOIN al_result_subjects s ON s.al_result_id = r.id
       WHERE r.participant_id = $1
       GROUP BY r.id
       ORDER BY r.exam_year DESC`,
      [req.params.participantId]
    );
    res.json(results.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get AL results' });
  }
});

// ── POST /api/academic/al ────────────────────────────────────────
router.post('/al', verifyToken, async (req, res) => {
  try {
    const {
      participant_id, exam_year, index_number,
      school_name, stream, medium, z_score,
      passed, plan_after,
      district_rank, island_rank, university_selected,
      university_name, course_selected,
      results_verified, notes, subjects
    } = req.body;

    // ── Enum validation ──────────────────────────────────────────
    if (stream && !VALID.alStream.includes(stream))
      return res.status(400).json({ error: `Invalid stream: ${stream}` });
    if (medium && !VALID.alMedium.includes(medium))
      return res.status(400).json({ error: `Invalid medium: ${medium}` });

    if (req.user.role === 'ldc_staff') {
      const check = await query('SELECT is_exited FROM participants WHERE id = $1', [participant_id]);
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    await transaction(async (client) => {
      const resultRow = await client.query(
        `INSERT INTO al_results
          (participant_id, exam_year, index_number,
           school_name, stream, medium, z_score,
           passed, plan_after,
           district_rank, island_rank, university_selected,
           university_name, course_selected,
           results_verified, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *`,
        [
          participant_id, exam_year, index_number || null,
          school_name || null, stream || null, medium || null,
          z_score || null, passed || false, JSON.stringify(plan_after || []),
          district_rank || null,
          island_rank || null, university_selected || false,
          university_name || null, course_selected || null,
          results_verified || false, notes || null,
          req.user.id
        ]
      );

      const alResult = resultRow.rows[0];

      if (subjects && subjects.length > 0) {
        const seen = new Set();
        for (const s of subjects) {
          if (!s.subject_name) continue;
          if (seen.has(s.subject_name)) continue;
          seen.add(s.subject_name);
          await client.query(
            `INSERT INTO al_result_subjects
              (al_result_id, subject_name, grade, subject_type)
             VALUES ($1,$2,$3,$4)`,
            [alResult.id, s.subject_name, s.grade,
             s.subject_type || 'main']
          );
        }
      }

      res.status(201).json(alResult);
    });
  } catch (error) {
    console.error(error);
    if (error.code === '23505') {
      return res.status(400).json({
        error: 'AL result for this year already exists'
      });
    }
    res.status(500).json({ error: 'Failed to save AL result' });
  }
});

// ── PUT /api/academic/al/:id ─────────────────────────────────────
router.put('/al/:id', verifyToken, async (req, res) => {
  try {
    const {
      exam_year, index_number, school_name,
      stream, medium, z_score, passed, plan_after,
      district_rank, island_rank, university_selected,
      university_name, course_selected, results_verified,
      notes, subjects
    } = req.body;

    // ── Enum validation ──────────────────────────────────────────
    if (stream && !VALID.alStream.includes(stream))
      return res.status(400).json({ error: `Invalid stream: ${stream}` });
    if (medium && !VALID.alMedium.includes(medium))
      return res.status(400).json({ error: `Invalid medium: ${medium}` });

    if (req.user.role === 'ldc_staff') {
      const check = await query(
        `SELECT p.is_exited FROM participants p
         JOIN al_results r ON r.participant_id = p.id
         WHERE r.id = $1`, [req.params.id]
      );
      if (check.rows[0]?.is_exited) {
        return res.status(403).json({ error: 'This participant has exited the program. Profile is locked.' });
      }
    }

    await transaction(async (client) => {
      await client.query(
        `UPDATE al_results SET
          exam_year          = $1,
          index_number       = $2,
          school_name        = $3,
          stream             = $4,
          medium             = $5,
          z_score            = $6,
          passed             = $7,
          plan_after         = $8,
          district_rank      = $9,
          island_rank        = $10,
          university_selected= $11,
          university_name    = $12,
          course_selected    = $13,
          results_verified   = $14,
          notes              = $15,
          updated_at         = NOW()
         WHERE id = $16`,
        [
          exam_year, index_number || null,
          school_name || null, stream || null,
          medium || null, z_score || null,
          passed || false, JSON.stringify(plan_after || []),
          district_rank || null, island_rank || null,
          university_selected || false,
          university_name || null, course_selected || null,
          results_verified || false, notes || null,
          req.params.id
        ]
      );

      await client.query(
        'DELETE FROM al_result_subjects WHERE al_result_id = $1',
        [req.params.id]
      );

      if (subjects && subjects.length > 0) {
        const seen = new Set();
        for (const s of subjects) {
          if (!s.subject_name) continue;
          if (seen.has(s.subject_name)) continue;
          seen.add(s.subject_name);
          await client.query(
            `INSERT INTO al_result_subjects
              (al_result_id, subject_name, grade, subject_type)
             VALUES ($1,$2,$3,$4)`,
            [req.params.id, s.subject_name, s.grade,
             s.subject_type || 'main']
          );
        }
      }

      res.json({ message: 'AL result updated' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update AL result' });
  }
});

module.exports = router;