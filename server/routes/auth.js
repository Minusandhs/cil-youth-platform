// ================================================================
// CIL Youth Development Platform — Auth Routes
// Handles login, logout, user management
// ================================================================
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');
const { sendPasswordResetEmail } = require('../utils/notifications');

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

    // Find user (Allow login via username OR email)
    const result = await query(
      `SELECT u.*, l.ldc_id as ldc_code, l.name as ldc_name, l.is_active as ldc_active
       FROM users u
       LEFT JOIN ldcs l ON u.ldc_id = l.id
       WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true`,
      [username.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    const user = result.rows[0];

    // Check if LDC is deactivated (for LDC staff)
    if (user.role === 'ldc_staff' && user.ldc_id && user.ldc_active === false) {
      return res.status(403).json({
        error: 'Your LDC has been deactivated. Access denied.'
      });
    }

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
        id: user.id,
        username: user.username,
        role: user.role,
        ldc_id: user.ldc_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Return token and user info
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        ldc_id: user.ldc_id,
        ldc_code: user.ldc_code,
        ldc_name: user.ldc_name,
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
      `SELECT u.id, u.username, u.full_name, u.email, u.role,
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
    const { username, password, full_name, email, role, ldc_id } = req.body;

    // Validate
    if (!username || !password || !full_name || !email || !role) {
      return res.status(400).json({
        error: 'Username, password, full name, email and role are required'
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
        (username, password_hash, full_name, email, role, ldc_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, full_name, email, role, ldc_id, created_at`,
      [
        username.toLowerCase().trim(),
        password_hash,
        full_name,
        email.toLowerCase().trim(),
        role,
        ldc_id || null,
        req.user.id
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    if (error.code === '23505') {
      const field = error.detail.includes('username') ? 'Username' : 'Email';
      return res.status(400).json({ error: `${field} already exists` });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── PUT /api/auth/users/:id ──────────────────────────────────────
// Super admin only — update user
router.put('/users/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { full_name, email, is_active, ldc_id } = req.body;
    const result = await query(
      `UPDATE users
       SET full_name = $1, email = $2, is_active = $3, ldc_id = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, username, full_name, email, role, is_active, ldc_id`,
      [full_name, email, is_active, ldc_id || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
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

// ── PUT /api/auth/me/password ────────────────────────────────────
// Any logged-in user can change their own password
router.put('/me/password', verifyToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    const password_hash = await bcrypt.hash(new_password, 10);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [password_hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ── GET /api/auth/stats ──────────────────────────────────────────
// Super admin: global stats. LDC staff: their LDC's stats only.
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const isLDC = req.user.role === 'ldc_staff';
    const ldcId = isLDC ? req.user.ldc_id : null;
    const ldcWhere = ldcId ? 'AND p.ldc_id = $1' : '';
    const ldcWhereOnly = ldcId ? 'AND ldc_id = $1' : '';
    const ldcWhereApp = ldcId ? 'AND a.ldc_id = $1' : '';
    const ldcWhereHist = ldcId ? 'AND p.ldc_id = $1' : '';
    const p = ldcId ? [ldcId] : [];

    const queries = [
      // 0: active participants
      query(`SELECT COUNT(*) FROM participants WHERE is_active = true ${ldcWhereOnly}`, p),
      // 1: inactive participants
      query(`SELECT COUNT(*) FROM participants WHERE is_active = false ${ldcWhereOnly}`, p),
      // 2: active male
      query(`SELECT COUNT(*) FROM participants WHERE is_active = true AND gender = 'Male' ${ldcWhereOnly}`, p),
      // 3: active female
      query(`SELECT COUNT(*) FROM participants WHERE is_active = true AND gender = 'Female' ${ldcWhereOnly}`, p),
    ];

    // Admin-only extras (4, 5)
    if (!isLDC) {
      queries.push(
        query('SELECT COUNT(*) FROM users WHERE is_active = true'),
        query('SELECT COUNT(*) FROM ldcs WHERE is_active = true'),
      );
    }

    const results = await Promise.all(queries);
    const [participants, inactiveParticipants, activeMale, activeFemale] = results;

    const out = {
      participants: parseInt(participants.rows[0].count),
      inactive_participants: parseInt(inactiveParticipants.rows[0].count),
      active_male: parseInt(activeMale.rows[0].count),
      active_female: parseInt(activeFemale.rows[0].count),
    };

    if (!isLDC) {
      out.users = parseInt(results[4].rows[0].count);
      out.ldcs = parseInt(results[5].rows[0].count);
    }

    res.json(out);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});


// ── POST /api/auth/forgot-password ──────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const result = await query(
      'SELECT id, full_name, username FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      // For security, don't reveal if email exists
      return res.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store token
    await query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Prepare link dynamically based on where the request came from
    const reqOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : null);
    
    const defaultUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://cilyouth.org';
    const portalUrl = reqOrigin || (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',')[0] : defaultUrl);
    
    const resetLink = `${portalUrl}/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail(email, user.full_name, resetLink);

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/reset-password ───────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Verify token
    const result = await query(
      `SELECT pr.user_id, u.username 
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token = $1 AND pr.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const { user_id } = result.rows[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Update user password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, user_id]
    );

    // Delete token
    await query('DELETE FROM password_resets WHERE token = $1', [token]);

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
