// ================================================================
// CIL Youth Development Platform — Auth Routes
// Handles login, logout, user management
// ================================================================
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// ── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Find user
    const result = await query(
      `SELECT u.*, l.ldc_id as ldc_code, l.name as ldc_name
       FROM users u
       LEFT JOIN ldcs l ON u.ldc_id = l.id
       WHERE u.username = $1 AND u.is_active = true`,
      [username.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id       : user.id,
        username : user.username,
        role     : user.role,
        ldc_id   : user.ldc_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Return token and user info
    res.json({
      token,
      user: {
        id        : user.id,
        username  : user.username,
        full_name : user.full_name,
        role      : user.role,
        ldc_id    : user.ldc_id,
        ldc_code  : user.ldc_code,
        ldc_name  : user.ldc_name,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.role,
              u.ldc_id, l.ldc_id as ldc_code, l.name as ldc_name
       FROM users u
       LEFT JOIN ldcs l ON u.ldc_id = l.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ── GET /api/auth/users ──────────────────────────────────────────
// Super admin only — get all users
router.get('/users', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.full_name, u.role,
              u.is_active, u.last_login, u.created_at,
              u.ldc_id,
              l.ldc_id as ldc_code, l.name as ldc_name
       FROM users u
       LEFT JOIN ldcs l ON u.ldc_id = l.id
       ORDER BY u.role, u.full_name`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// ── POST /api/auth/users ─────────────────────────────────────────
// Super admin only — create new user
router.post('/users', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, password, full_name, role, ldc_id } = req.body;

    // Validate
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({
        error: 'Username, password, full name and role are required'
      });
    }

    if (role === 'ldc_staff' && !ldc_id) {
      return res.status(400).json({
        error: 'LDC must be assigned for LDC staff'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await query(
      `INSERT INTO users
        (username, password_hash, full_name, role, ldc_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, full_name, role, ldc_id, created_at`,
      [
        username.toLowerCase().trim(),
        password_hash,
        full_name,
        role,
        ldc_id || null,
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── PUT /api/auth/users/:id ──────────────────────────────────────
// Super admin only — update user
router.put('/users/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { full_name, is_active, ldc_id } = req.body;
    const result = await query(
      `UPDATE users
       SET full_name = $1, is_active = $2, ldc_id = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, full_name, role, is_active, ldc_id`,
      [full_name, is_active, ldc_id || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── PUT /api/auth/users/:id/password ────────────────────────────
// Super admin only — reset user password
router.put('/users/:id/password', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters'
      });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, req.params.id]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ── GET /api/auth/stats ──────────────────────────────────────────
router.get('/stats', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const [users, ldcs, participants, tes] = await Promise.all([
      query('SELECT COUNT(*) FROM users WHERE is_active = true'),
      query('SELECT COUNT(*) FROM ldcs WHERE is_active = true'),
      query('SELECT COUNT(*) FROM participants WHERE is_active = true'),
      query('SELECT COUNT(*) FROM tes_applications'),
    ]);
    res.json({
      users        : parseInt(users.rows[0].count),
      ldcs         : parseInt(ldcs.rows[0].count),
      participants : parseInt(participants.rows[0].count),
      tes          : parseInt(tes.rows[0].count),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
