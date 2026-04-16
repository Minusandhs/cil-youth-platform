// ================================================================
// CIL Youth Development Platform — Server Constants
// ================================================================
// Single source of truth for all enum/dropdown values.
//
// THIS FILE drives:
//   1. Backend validation  — routes import VALID_* arrays
//   2. Frontend dropdowns  — GET /api/constants serves these to React
//
// Adding a new option:
//   - Simple enum (lang, inst type, etc.) → add here only.
//   - current_status / marital / ol / al  → add here + DB migration
//     (those columns have CHECK constraints in schema.sql)
// ================================================================

// ── Current Status ───────────────────────────────────────────────
// DB has a CHECK constraint — migration required when adding here.
const CURRENT_STATUS_OPTIONS = [
  { value: 'studying_school',    label: 'Studying — School'                               },
  { value: 'studying_tertiary',  label: 'Studying — Tertiary'                             },
  { value: 'studying_vocational',label: 'Studying — Vocational'                           },
  { value: 'employed_full',      label: 'Employed — Full Time'                            },
  { value: 'employed_part',      label: 'Employed — Part Time'                            },
  { value: 'self_employed',      label: 'Self Employed'                                   },
  { value: 'unemployed_seeking', label: 'Unemployed — Seeking'                            },
  { value: 'unemployed_not',     label: 'NEET - Not in Education, Employment and Training' },
  { value: 'other',              label: 'Other'                                           },
];

// ── Marital Status ───────────────────────────────────────────────
// DB has a CHECK constraint — migration required when adding here.
const MARITAL_STATUS_OPTIONS = [
  { value: 'single',    label: 'Single'    },
  { value: 'married',   label: 'Married'   },
  { value: 'divorced',  label: 'Divorced'  },
  { value: 'widowed',   label: 'Widowed'   },
  { value: 'separated', label: 'Separated' },
];

// ── O/L Exam Status ──────────────────────────────────────────────
// DB has a CHECK constraint — migration required when adding here.
// show_year: true → frontend shows a year input when selected
const OL_STATUS_OPTIONS = [
  { value: 'not_yet',          label: 'Not Yet',            show_year: false },
  { value: 'awaiting_results', label: 'Awaiting Results',   show_year: true  },
  { value: 'completed_passed', label: 'Completed — Passed', show_year: true  },
  { value: 'completed_failed', label: 'Completed — Failed', show_year: true  },
  { value: 'not_applicable',   label: 'Not Applicable',     show_year: false },
];

// ── A/L Exam Status ──────────────────────────────────────────────
// DB has a CHECK constraint — migration required when adding here.
const AL_STATUS_OPTIONS = [
  { value: 'not_yet',          label: 'Not Yet',            show_year: false },
  { value: 'awaiting_results', label: 'Awaiting Results',   show_year: true  },
  { value: 'completed_passed', label: 'Completed — Passed', show_year: true  },
  { value: 'completed_failed', label: 'Completed — Failed', show_year: true  },
  { value: 'not_sitting',      label: 'Not Sitting',        show_year: false },
  { value: 'not_applicable',   label: 'Not Applicable',     show_year: false },
];

// ── Living Outside LDC — Purpose ────────────────────────────────
// Plain VARCHAR in DB — no migration needed when adding here.
const OUTSIDE_PURPOSE_OPTIONS = [
  { value: 'Study',            label: 'Study'            },
  { value: 'Work / Business',  label: 'Work / Business'  },
  { value: 'Other',            label: 'Other'            },
];

// ── TES Institution Types ────────────────────────────────────────
// Plain VARCHAR in DB — no migration needed when adding here.
const INST_TYPE_OPTIONS = [
  { value: 'university', label: 'University'        },
  { value: 'college',    label: 'College'           },
  { value: 'vocational', label: 'Vocational / TVET' },
  { value: 'other',      label: 'Other'             },
];

// ── Language Proficiency Levels ──────────────────────────────────
// Plain VARCHAR in DB — no migration needed when adding here.
const LANG_LEVEL_OPTIONS = [
  { value: 'beginner',     label: 'Beginner'     },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced'     },
  { value: 'proficient',   label: 'Proficient'   },
];

// ── A/L Streams ──────────────────────────────────────────────────
// Plain VARCHAR in DB — no migration needed when adding here.
const AL_STREAM_OPTIONS = [
  { value: 'Physical Science',       label: 'Physical Science'       },
  { value: 'Biological Science',     label: 'Biological Science'     },
  { value: 'Commerce',               label: 'Commerce'               },
  { value: 'Arts',                   label: 'Arts'                   },
  { value: 'Technology',             label: 'Technology'             },
  { value: 'Engineering Technology', label: 'Engineering Technology' },
  { value: 'Bio Systems Technology', label: 'Bio Systems Technology' },
  { value: 'Other',                  label: 'Other'                  },
];

// ── Exam Mediums ─────────────────────────────────────────────────
// Plain VARCHAR in DB — no migration needed when adding here.
const AL_MEDIUM_OPTIONS = [
  { value: 'Sinhala', label: 'Sinhala' },
  { value: 'Tamil',   label: 'Tamil'   },
  { value: 'English', label: 'English' },
];

// ── Development Plan Statuses ────────────────────────────────────
// Plain VARCHAR in DB — no migration needed when adding here.
const PLAN_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#a09080', bg: '#f0ece2' },
  { value: 'in_progress', label: 'In Progress', color: '#1a4068', bg: '#dce9f5' },
  { value: 'completed',   label: 'Completed',   color: '#2d6a4f', bg: '#d8ede4' },
  { value: 'on_hold',     label: 'On Hold',     color: '#b85c00', bg: '#fdecd8' },
];


// ── Valid value sets for backend validation ──────────────────────
// These are derived from the option arrays above so they never drift.
const VALID = {
  currentStatus  : CURRENT_STATUS_OPTIONS.map(o => o.value),
  maritalStatus  : MARITAL_STATUS_OPTIONS.map(o => o.value),
  olStatus       : OL_STATUS_OPTIONS.map(o => o.value),
  alStatus       : AL_STATUS_OPTIONS.map(o => o.value),
  outsidePurpose : OUTSIDE_PURPOSE_OPTIONS.map(o => o.value),
  instType       : INST_TYPE_OPTIONS.map(o => o.value),
  langLevel      : LANG_LEVEL_OPTIONS.map(o => o.value),
  alStream       : AL_STREAM_OPTIONS.map(o => o.value),
  alMedium       : AL_MEDIUM_OPTIONS.map(o => o.value),
  planStatus     : PLAN_STATUS_OPTIONS.map(o => o.value),
};


module.exports = {
  // Option arrays — served to frontend via GET /api/constants
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

  // Valid value sets — used in route validation
  VALID,
};
