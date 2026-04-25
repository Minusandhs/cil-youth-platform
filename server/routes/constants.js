// ================================================================
// CIL Youth Development Platform — Constants Route
// GET /api/constants
// Serves all dropdown option lists to the frontend.
// No auth required — these are non-sensitive configuration values.
// ================================================================
const express = require('express');
const {
  CURRENT_STATUS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  OL_STATUS_OPTIONS,
  AL_STATUS_OPTIONS,
  OUTSIDE_PURPOSE_OPTIONS,
  INST_TYPE_OPTIONS,
  LANG_LEVEL_OPTIONS,
  AL_STREAM_OPTIONS,
  AL_MEDIUM_OPTIONS,
  PLAN_STATUS_OPTIONS,
} = require('../config/dropdowns');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    currentStatuses  : CURRENT_STATUS_OPTIONS,
    maritalStatuses  : MARITAL_STATUS_OPTIONS,
    olStatuses       : OL_STATUS_OPTIONS,
    alStatuses       : AL_STATUS_OPTIONS,
    outsidePurposes  : OUTSIDE_PURPOSE_OPTIONS,
    instTypes        : INST_TYPE_OPTIONS,
    langLevels       : LANG_LEVEL_OPTIONS,
    alStreams         : AL_STREAM_OPTIONS,
    alMediums        : AL_MEDIUM_OPTIONS,
    planStatuses     : PLAN_STATUS_OPTIONS,
  });
});

module.exports = router;
