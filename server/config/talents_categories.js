// ================================================================
// Talents — Category & Level Definitions
// Edit this file to add, remove, or rename talents.
// Each talent: { value (stored in DB), label (shown in UI) }
// ================================================================

module.exports = {

  // ── 1. Digital & Technical Proficiency ───────────────────────
  digital: {
    label: 'Digital & Technical Proficiency',
    talents: [
      { value: 'coding',                        label: 'Coding & Software Development' },
      { value: 'web_design',                    label: 'Web Design' },
      { value: 'social_media',                  label: 'Social Media Management' },
      { value: 'content_creation',              label: 'Content Creation' },
      { value: 'tech_troubleshoot',             label: 'Technical Troubleshooting' },
      { value: 'graphic_design',                label: 'Graphic Designing' },
      { value: 'multimedia_video_editing',      label: 'Animation and multimedia production' },
      { value: 'artificial_intelligence',       label: 'Artificial Intelligence / Machine Learning'},
      { value: 'foundational_digital_literacy', label: 'Foundational Digital Literacy Skills'},
    ],
  },

  // ── 2. Cognitive & Analytical Abilities ──────────────────────
  cognitive: {
    label: 'Cognitive & Analytical Abilities',
    talents: [
      { value: 'rapid_adapt',     label: 'Rapid Adaptability' },
      { value: 'quick_learning',  label: 'Quick Learning' },
      { value: 'critical_think',  label: 'Critical Thinking' },
      { value: 'problem_solving', label: 'Complex Problem-Solving' },
      { value: 'strategic_think', label: 'Strategic Thinking' },
      { value: 'goal_setting',    label: 'Goal Setting' },
    ],
  },

  // ── 3. Creative & Performing Arts ────────────────────────────
  creative: {
    label: 'Creative & Performing Arts',
    talents: [
      { value: 'musical',               label: 'Musical Instrument' },
      { value: 'musical_singing',       label: 'Singing'},
      { value: 'musical_programing',    label: 'Music Production'},
      { value: 'visual_art',            label: 'Visual Artistry' },
      { value: 'performing_arts',       label: 'Performance Arts' },
      { value: 'creative_compose',      label: 'Creative Composition' },
      { value: 'dance',                 label: 'Dance (traditional, contemporary)'},
      { value: 'drama',                 label: 'Drama and theatre'},
      { value: 'stage_performance',     label: 'Stage performance skills'},
      { value: 'creative_writing',      label: 'Creative Writing (stories/poetry)'},
      { value: 'storytelling',          label: 'Spoken word and storytelling'},
      { value: 'cultural_performance',  label: 'Cultural Performance'},
      { value: 'photography',           label: 'Photography'},
    ],
  },

  // ── 4. Social & Emotional Intelligence ───────────────────────
  social: {
    label: 'Social & Emotional Intelligence',
    talents: [
      { value: 'empathy',           label: 'Empathy & Awareness' },
      { value: 'teamwork',          label: 'Teamwork & Collaboration' },
      { value: 'emotional',         label: 'Emotional Regulation' },
      { value: 'networking',        label: 'Networking' },
      { value: 'mentorship',        label: 'Mentorship' },
      { value: 'growth_mindset',    label: 'Growth Mindset' },
      { value: 'active_listening',  label: 'Active Listening' },
    ],
  },

  // ── 5. Communication & Leadership ────────────────────────────
  communication: {
    label: 'Communication & Leadership',
    talents: [
      { value: 'public_speaking',     label: 'Public Speaking' },
      { value: 'debate_persuasion',   label: 'Debating & Persuasion' },
      { value: 'org_leadership',      label: 'Leadership' },
      { value: 'conflict_resolution', label: 'Conflict Resolution' },
      { value: 'advocacy',            label: 'Advocacy' },
      { value: 'event_planning',      label: 'Event Planning' },
    ],
  },

  // ── 6. Athletic & Physical Skills ────────────────────────────
  athletic: {
    label: 'Athletic & Physical Skills',
    talents: [
      { value: 'kinesthetic',       label: 'Kinesthetic Control' },
      { value: 'endurance',         label: 'Endurance & Stamina' },
      { value: 'balance',           label: 'Balance & Agility' },
      { value: 'sports',            label: 'Sports' },
      { value: 'sports_criket',     label: 'Sports Criket' },
      { value: 'sports_athletics',  label: 'Sports Athletics' },
      { value: 'sports_football',   label: 'Sports Football' },
      { value: 'sports_vollyball',  label: 'Sports Vollyball' },
      { value: 'sports_basketball', label: 'Sports Basketball' },
      { value: 'sports_others',     label: 'Sports Others' },
    ],
  },

  // ── 7. Practical Life Talents ────────────────────────────────
  practical: {
    label: 'Practical Life Talents',
    talents: [
      { value: 'financial',      label: 'Financial Literacy' },
      { value: 'culinary',       label: 'Culinary Arts' },
      { value: 'basic_mechanics',label: 'Basic Mechanics' },
      { value: 'multilingual',   label: 'Multilingualism' },
    ],
  },

  // ── 8. Language Proficiency ──────────────────────────────────
  language: {
    label: 'Language Proficiency',
    talents: [
      { value: 'english', label: 'English' },
      { value: 'sinhala', label: 'Sinhala' },
      { value: 'tamil',   label: 'Tamil'   },
    ],
  },

};

// ── Proficiency levels (ordered low → high) ──────────────────────
// `order` lets the UI sort them and lets future code compare growth.
module.exports.LEVELS = [
  { value: 'emerging',   label: 'Emerging',   order: 1 },
  { value: 'developing', label: 'Developing', order: 2 },
  { value: 'proficient', label: 'Proficient', order: 3 },
  { value: 'advanced',   label: 'Advanced',   order: 4 },
  { value: 'mastery',    label: 'Mastery',    order: 5 },
];
