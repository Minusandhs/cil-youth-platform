// ================================================================
// Career — Readiness Items & Industry Definitions
// Edit this file to add, remove, or rename items or industries.
// Each entry: { value (stored in DB), label (shown in UI) }
// ================================================================

module.exports = {

  // ── Career readiness checklist items ─────────────────────────
  readiness_items: [
    { value: 'career_guidance',       label: 'Career Guidance Completed' },
    { value: 'cv_prepared',           label: 'CV/Resume Prepared' },
    { value: 'interview_skills',      label: 'Interview Skills Training' },
    { value: 'job_search',            label: 'Job Search Guidance' },
    { value: 'financial_literacy',    label: 'Financial Literacy Training' },
    { value: 'digital_skills',        label: 'Digital Skills for Employment' },
    { value: 'entrepreneurship',      label: 'Entrepreneurship Training' },
    { value: 'communication',         label: 'Communication Skills Training' },
  ],

  // ── Industries for aspirations & job interest ────────────────
  industries: [
    { value: 'it_tech',       label: 'IT & Technology' },
    { value: 'healthcare',    label: 'Healthcare' },
    { value: 'education',     label: 'Education & Teaching' },
    { value: 'agriculture',   label: 'Agriculture & Farming' },
    { value: 'hospitality',   label: 'Hospitality & Tourism' },
    { value: 'construction',  label: 'Construction & Engineering' },
    { value: 'retail',        label: 'Retail & Sales' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'finance',       label: 'Finance & Banking' },
    { value: 'creative',      label: 'Creative & Media' },
    { value: 'government',    label: 'Government & Public Service' },
    { value: 'transport',     label: 'Transport & Logistics' },
    { value: 'other',         label: 'Other' },
  ],

  // ── Holland Code (RIASEC) personality types ──────────────────
  holland_codes: [
    { value: 'R', label: 'Realistic',     description: 'Hands-on, practical, physical work — builders, mechanics, athletes' },
    { value: 'I', label: 'Investigative', description: 'Analytical, curious, scientific — researchers, analysts, scientists' },
    { value: 'A', label: 'Artistic',      description: 'Creative, expressive, original — designers, writers, performers' },
    { value: 'S', label: 'Social',        description: 'Helping, teaching, collaborative — teachers, counsellors, nurses' },
    { value: 'E', label: 'Enterprising',  description: 'Persuasive, leading, business-minded — managers, entrepreneurs, sales' },
    { value: 'C', label: 'Conventional',  description: 'Organised, detail-oriented, structured — accountants, administrators, clerks' },
  ],

};
