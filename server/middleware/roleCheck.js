function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Access denied. Super admin only.'
    });
  }
  next();
}

function requireLDCStaff(req, res, next) {
  if (req.user.role !== 'ldc_staff' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Access denied.'
    });
  }
  next();
}

module.exports = { requireSuperAdmin, requireLDCStaff };
