const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check LDC status for LDC staff
    if (req.user.role === 'ldc_staff' && req.user.ldc_id) {
      const result = await query(
        'SELECT is_active FROM ldcs WHERE id = $1',
        [req.user.ldc_id]
      );

      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(403).json({ 
          error: 'LDC_DEACTIVATED',
          message: 'Your LDC has been deactivated. Access denied.' 
        });
      }
    }

    next();

  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { verifyToken };
