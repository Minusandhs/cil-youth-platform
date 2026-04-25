// ================================================================
// Needs & Risks Category Definitions
// Edit this file to add, remove, or rename categories.
// Each entry: { value (stored in DB), label (shown in UI) }
// ================================================================

module.exports = {

  // ── NEEDS ──────────────────────────────────────────────────────
  needs: [

    // ── Academic ─────────────────────────────────────────────────
    { value: 'academic_literacy', label: 'Academic: Foundational Literacy Support (Sinhala/Tamil)' },
    { value: 'academic_numeracy', label: 'Academic: Foundational Numeracy Support' },
    { value: 'academic_ol_al', label: 'Academic: G.C.E. O/L or A/L Remedial Coaching' },
    { value: 'academic_it', label: 'Academic: Access to IT / Coding Resources' },
    { value: 'academic_english', label: 'Academic: Spoken English Practice' },

    // ── Development ───────────────────────────────────────────────
    { value: 'dev_life_skills', label: 'Development: Structured Life Skills / Leadership Training' },
    { value: 'dev_mentorship', label: 'Development: Mentorship & Career Guidance' },
    { value: 'dev_public_speaking', label: 'Development: Public Speaking / Confidence Building Opportunities' },
    { value: 'dev_vocational', label: 'Development: Vocational Training Referrals' },

    // ── Material ──────────────────────────────────────────────────
    { value: 'material_transport', label: 'Material: Transport Assistance (Bus fare)' },
    { value: 'material_digital', label: 'Material: Digital Access (Devices or internet data)' },
    { value: 'material_nutrition', label: 'Material: Nutritional Support' },
    { value: 'material_supplies', label: 'Material: Basic School Supplies / Stationery' },

    // ── Psychosocial ──────────────────────────────────────────────
    { value: 'psycho_counseling', label: 'Psychosocial: One-on-One Counseling / Emotional Support' },
    { value: 'psycho_family', label: 'Psychosocial: Family Engagement / Mediation' },
    { value: 'psycho_safe_space', label: 'Psychosocial: Safe, quiet space for studying' },

  ],

  // ── RISKS ──────────────────────────────────────────────────────
  risks: [

    // ── Academic ─────────────────────────────────────────────────
    { value: 'risk_academic_absenteeism', label: 'Academic: Severe Absenteeism from School or Center' },
    { value: 'risk_academic_ol_al_fail', label: 'Academic: High Risk of G.C.E. O/L or A/L Failure' },
    { value: 'risk_academic_dropout', label: 'Academic: Imminent Risk of Dropping Out' },
    { value: 'risk_academic_stagnant', label: 'Academic: Stagnant Progress in Current Interventions' },

    // ── Economic ──────────────────────────────────────────────────
    { value: 'risk_econ_child_labour', label: 'Economic: Pressure for Early/Informal Employment (Child labor)' },
    { value: 'risk_econ_hardship', label: 'Economic: Extreme Financial Hardship at Home' },
    { value: 'risk_econ_housing', label: 'Economic: Unstable Housing or Relocation' },

    // ── Social / Behavioral ───────────────────────────────────────
    { value: 'risk_social_peer', label: 'Social/Behavioral: Negative Peer Influence / Gang Association' },
    { value: 'risk_social_substance', label: 'Social/Behavioral: Smoking & Alcohol' },
    { value: 'risk_social_behavioral', label: 'Social/Behavioral: Consistent Behavioral Disruptions at the Center' },

    // ── Psychological ─────────────────────────────────────────────
    { value: 'risk_psych_exam_stress', label: 'Psychological: Severe Exam-Related Stress or Anxiety' },
    { value: 'risk_psych_withdrawal', label: 'Psychological: Sudden Withdrawal or Isolation from Peers' },
    { value: 'risk_psych_abuse', label: 'Psychological: Suspected Domestic Conflict or Abuse' },

  ],

};
