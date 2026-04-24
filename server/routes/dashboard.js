// ================================================================
// CIL Youth Development Platform — Dashboard Routes
// Reads precomputed snapshots so the dashboard doesn't re-aggregate
// per request. Snapshots are refreshed nightly (cron in index.js)
// and on-demand via POST /refresh.
// ================================================================

const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { getSnapshot, refreshAllSnapshots } = require('../utils/dashboardSnapshot');

const router = express.Router();

// Single-flight guard so concurrent /refresh calls don't pile up.
let refreshInFlight = null;

// ── GET /api/dashboard/summary ───────────────────────────────────
// LDC staff: always scoped to their own LDC (query param ignored).
// Admins : optional ?ldc_id=<uuid> to filter; otherwise national.
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const ldc_id = req.user.role === 'ldc_staff'
      ? req.user.ldc_id
      : (req.query.ldc_id || null);

    const { payload, generated_at } = await getSnapshot({ ldc_id });
    res.json({ ...payload, generated_at });
  } catch (error) {
    console.error('GET /api/dashboard/summary failed:', error);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

// ── POST /api/dashboard/refresh ──────────────────────────────────
// Super-admin only. Rebuilds all snapshots (national + one per LDC).
router.post('/refresh', verifyToken, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin only.' });
  }

  if (refreshInFlight) {
    try {
      const result = await refreshInFlight;
      return res.json({ ok: true, reused_in_flight: true, ...result });
    } catch {
      return res.status(500).json({ error: 'Previous refresh failed — try again.' });
    }
  }

  refreshInFlight = refreshAllSnapshots();
  try {
    const result = await refreshInFlight;
    res.json({ ok: true, ...result });
  } catch (error) {
    console.error('POST /api/dashboard/refresh failed:', error);
    res.status(500).json({ error: 'Refresh failed' });
  } finally {
    refreshInFlight = null;
  }
});

module.exports = router;
