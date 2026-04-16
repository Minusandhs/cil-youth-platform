// ================================================================
// CIL Youth Platform — Frontend UI Constants
//
// This file holds UI-specific logic that the server doesn't need:
//   • CURRENT_STATUS — sub-field definitions, colors, show_year
//   • PLAN_GOALS     — goal field definitions (one DB column each)
//   • AL_STREAMS / AL_MEDIUMS — stable academic reference values
//   • Helper functions (statusLabel, statusColor, etc.)
//
// Dropdown OPTION LISTS (the {value, label} arrays) are served by
// GET /api/constants and consumed via useConstants() in components.
// The exports here (MARITAL_STATUS, OL_STATUS, etc.) are kept as
// static fallbacks used by useConstants() before the API responds.
//
// ── Adding a new CURRENT_STATUS ──────────────────────────────────
// 1. server/constants.js  — add { value, label } to CURRENT_STATUS_OPTIONS
// 2. client/constants.js  — add the entry below with color + fields
// 3. DB migration         — extend the CHECK constraint
// ================================================================


// ── Current Status ───────────────────────────────────────────────
// Used in: PersonalInfo (form + view), AdminOverview, LDCOverview
//
// Each entry defines:
//   label  — human-readable display string
//   color  — CSS variable for status badges / charts
//   fields — sub-fields shown when this status is selected in the form
//             key         : maps to form field & DB column
//             label       : shown to the user
//             placeholder : hint text inside the input
//             type        : omit for plain text | 'grade_select' renders
//                           the school-grade dropdown (from /api/school-grades)
//
// NOTE: 'no_profile' is a synthetic entry used only in overview charts.
// It must never appear in the form dropdown.

export const CURRENT_STATUS = {
  studying_school: {
    label : 'Studying — School',
    color : 'var(--color-info)',
    fields: [
      { key: 'current_institution', label: 'School Name', placeholder: 'e.g. Negombo Central College' },
      { key: 'current_year',        label: 'Year',        placeholder: 'e.g. 2024' },
      { key: 'current_course',      label: 'Grade',       placeholder: '',           type: 'grade_select' },
    ],
  },
  studying_tertiary: {
    label : 'Studying — Tertiary',
    color : 'var(--color-success)',
    fields: [
      { key: 'current_institution', label: 'University / Institute', placeholder: 'e.g. University of Kelaniya' },
      { key: 'current_course',      label: 'Course / Degree',        placeholder: 'e.g. BSc Computer Science'   },
      { key: 'current_year',        label: 'Year of Study',          placeholder: 'e.g. Year 2'                 },
    ],
  },
  studying_vocational: {
    label : 'Studying — Vocational',
    color : 'var(--color-special)',
    fields: [
      { key: 'current_institution', label: 'Institution', placeholder: 'e.g. NAITA'                    },
      { key: 'current_course',      label: 'Course',      placeholder: 'e.g. NVQ Level 3 Electrical'   },
      { key: 'current_year',        label: 'Duration',    placeholder: 'e.g. 6 months'                 },
    ],
  },
  employed_full: {
    label : 'Employed — Full Time',
    color : 'var(--color-brand-accent)',
    fields: [
      { key: 'current_institution', label: 'Employer',       placeholder: 'Company name'        },
      { key: 'current_course',      label: 'Job Title',      placeholder: 'e.g. Sales Assistant' },
      { key: 'current_year',        label: 'Years Employed', placeholder: 'e.g. 2 years'         },
    ],
  },
  employed_part: {
    label : 'Employed — Part Time',
    color : '#9b6e2a',
    fields: [
      { key: 'current_institution', label: 'Employer',   placeholder: 'Company name'      },
      { key: 'current_course',      label: 'Job Title',  placeholder: 'e.g. Cashier'      },
      { key: 'current_year',        label: 'Hours/Week', placeholder: 'e.g. 20 hours/week' },
    ],
  },
  self_employed: {
    label : 'Self Employed',
    color : 'var(--color-text-subdued)',
    fields: [
      { key: 'current_institution', label: 'Business Type', placeholder: 'e.g. Small shop'      },
      { key: 'current_course',      label: 'Description',   placeholder: 'Brief description'     },
      { key: 'current_year',        label: 'Years Running', placeholder: 'e.g. 1 year'           },
    ],
  },
  unemployed_seeking: {
    label : 'Unemployed — Seeking',
    color : 'var(--color-danger)',
    fields: [
      { key: 'current_course', label: 'Type of Work Seeking', placeholder: 'e.g. Factory work' },
      { key: 'current_year',   label: 'Duration Unemployed',  placeholder: 'e.g. 3 months'     },
    ],
  },
  unemployed_not: {
    label : 'NEET - Not in Education, Employment and Training',
    color : '#7a1a2a',
    fields: [
      { key: 'current_course', label: 'Reason', placeholder: 'Reasons for NEET (Not in Education, Employment, or Training)' },
    ],
  },
  other: {
    label : 'Other',
    color : 'var(--color-text-muted)',
    fields: [
      { key: 'current_institution', label: 'Details', placeholder: 'Describe current situation' },
    ],
  },
  // Synthetic — overview charts only, never shown in the form dropdown
  no_profile: {
    label : 'No Profile Recorded',
    color : 'var(--color-border-subtle)',
    fields: [],
  },
};


// ── Marital Status ───────────────────────────────────────────────
// Used in: PersonalInfo
export const MARITAL_STATUS = [
  { value: 'single',    label: 'Single'    },
  { value: 'married',   label: 'Married'   },
  { value: 'divorced',  label: 'Divorced'  },
  { value: 'widowed',   label: 'Widowed'   },
  { value: 'separated', label: 'Separated' },
];


// ── O/L Exam Status ──────────────────────────────────────────────
// Used in: PersonalInfo
// show_year: true → render a year input when this option is selected
export const OL_STATUS = [
  { value: 'not_yet',          label: 'Not Yet',            show_year: false },
  { value: 'awaiting_results', label: 'Awaiting Results',   show_year: true  },
  { value: 'completed_passed', label: 'Completed — Passed', show_year: true  },
  { value: 'completed_failed', label: 'Completed — Failed', show_year: true  },
  { value: 'not_applicable',   label: 'Not Applicable',     show_year: false },
];


// ── A/L Exam Status ──────────────────────────────────────────────
// Used in: PersonalInfo
export const AL_STATUS = [
  { value: 'not_yet',          label: 'Not Yet',            show_year: false },
  { value: 'awaiting_results', label: 'Awaiting Results',   show_year: true  },
  { value: 'completed_passed', label: 'Completed — Passed', show_year: true  },
  { value: 'completed_failed', label: 'Completed — Failed', show_year: true  },
  { value: 'not_sitting',      label: 'Not Sitting',        show_year: false },
  { value: 'not_applicable',   label: 'Not Applicable',     show_year: false },
];


// ── TES Institution Types ────────────────────────────────────────
// Used in: TESApplicationForm, TESApplicationDetail, overview exports
export const INST_TYPES = [
  { value: 'university', label: 'University'       },
  { value: 'college',    label: 'College'          },
  { value: 'vocational', label: 'Vocational / TVET' },
  { value: 'other',      label: 'Other'            },
];


// ── Language Proficiency Levels ──────────────────────────────────
// Used in: TESApplicationForm, TESApplicationDetail
// Values are stored as-is in the DB (lowercase strings).
export const LANG_LEVELS = [
  { value: 'beginner',     label: 'Beginner'     },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced'     },
  { value: 'proficient',   label: 'Proficient'   },
];


// ── A/L Streams ──────────────────────────────────────────────────
// Used in: AcademicRecords
export const AL_STREAMS = [
  'Physical Science', 'Biological Science', 'Commerce',
  'Arts', 'Technology', 'Engineering Technology',
  'Bio Systems Technology', 'Other',
];


// ── Exam Mediums ─────────────────────────────────────────────────
// Used in: AcademicRecords
export const AL_MEDIUMS = ['Sinhala', 'Tamil', 'English'];


// ── Development Plan — Goal Status ──────────────────────────────
// Used in: DevelopmentPlan
export const PLAN_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: '#a09080', bg: '#f0ece2' },
  { value: 'in_progress', label: 'In Progress', color: '#1a4068', bg: '#dce9f5' },
  { value: 'completed',   label: 'Completed',   color: '#2d6a4f', bg: '#d8ede4' },
  { value: 'on_hold',     label: 'On Hold',     color: '#b85c00', bg: '#fdecd8' },
];


// ── Development Plan — Goal Fields ───────────────────────────────
// Used in: DevelopmentPlan
// To add a new goal area, add an entry here — the form and view render it automatically.
export const PLAN_GOALS = [
  { key: 'spiritual_goal',  label: 'Spiritual Goal',           placeholder: 'e.g. Attend church regularly, join youth group' },
  { key: 'academic_goal',   label: 'Academic Goal',            placeholder: 'e.g. Complete A/L with 3 passes'                },
  { key: 'social_goal',     label: 'Social / Community Goal',  placeholder: 'e.g. Participate in community service'          },
  { key: 'vocational_goal', label: 'Vocational / Career Goal', placeholder: 'e.g. Complete NVQ Level 3 course'               },
  { key: 'health_goal',     label: 'Health Goal',              placeholder: 'e.g. Maintain healthy lifestyle'                },
];


// ── Convenience helpers ──────────────────────────────────────────

/** Returns the label for a current_status value */
export function statusLabel(value) {
  return CURRENT_STATUS[value]?.label || value || '—';
}

/** Returns the display color for a current_status value */
export function statusColor(value) {
  return CURRENT_STATUS[value]?.color || 'var(--color-text-muted)';
}

/** Returns the label for an institution type value */
export function instLabel(value) {
  return INST_TYPES.find(t => t.value === value)?.label || value || '—';
}

/** Returns the label for a marital status value */
export function maritalLabel(value) {
  return MARITAL_STATUS.find(s => s.value === value)?.label || value || '—';
}

/** Returns the label for an OL status value */
export function olLabel(value) {
  return OL_STATUS.find(s => s.value === value)?.label || value || '—';
}

/** Returns the label for an AL status value */
export function alLabel(value) {
  return AL_STATUS.find(s => s.value === value)?.label || value || '—';
}

/** Returns true if this OL or AL status value should reveal a year input */
export function examStatusShowYear(list, value) {
  return list.find(s => s.value === value)?.show_year ?? false;
}
