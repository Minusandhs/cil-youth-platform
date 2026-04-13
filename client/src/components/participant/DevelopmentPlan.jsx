import { useState, useEffect } from 'react';
import api from '../../lib/api';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: '#a09080', bg: '#f0ece2' },
  { value: 'in_progress', label: 'In Progress', color: '#1a4068', bg: '#dce9f5' },
  { value: 'completed',   label: 'Completed',   color: '#2d6a4f', bg: '#d8ede4' },
  { value: 'on_hold',     label: 'On Hold',     color: '#b85c00', bg: '#fdecd8' },
];

const GOALS = [
  { key: 'spiritual_goal',  label: 'Spiritual Goal',           placeholder: 'e.g. Attend church regularly, join youth group'    },
  { key: 'academic_goal',   label: 'Academic Goal',            placeholder: 'e.g. Complete A/L with 3 passes'                   },
  { key: 'social_goal',     label: 'Social / Community Goal',  placeholder: 'e.g. Participate in community service'             },
  { key: 'vocational_goal', label: 'Vocational / Career Goal', placeholder: 'e.g. Complete NVQ Level 3 course'                  },
  { key: 'health_goal',     label: 'Health Goal',              placeholder: 'e.g. Maintain healthy lifestyle'                   },
];

function ProgressBar({ value, onChange, readonly }) {
  const segments = 10;
  const filled   = Math.round((value / 100) * segments);
  return (
    <div>
      <div style={{display:'flex', gap:'3px', marginBottom:'6px'}}>
        {Array.from({ length: segments }, (_, i) => (
          <div key={i}
            onClick={() => {
              if (readonly) return;
              const newVal = Math.round(((i + 1) / segments) * 100);
              onChange(newVal === value ? 0 : newVal);
            }}
            style={{
              flex:1, height:'22px', borderRadius:'3px',
              background: i < filled ? '#c49a3c' : '#e8e0d0',
              cursor: readonly ? 'default' : 'pointer',
              transition:'background 0.15s'
            }}
          />
        ))}
      </div>
      <div style={{fontSize:'12px', fontWeight:'700', color:'#c49a3c'}}>
        {value}% Complete
      </div>
    </div>
  );
}

export default function DevelopmentPlan({ participantId, participant }) {
  const [plans,       setPlans      ] = useState([]);
  const [plan,        setPlan       ] = useState(null);
  const [history,     setHistory    ] = useState([]);
  const [selYear,     setSelYear    ] = useState(CURRENT_YEAR);
  const [yearLocked,  setYearLocked ] = useState(false);
  const [loading,     setLoading    ] = useState(true);
  const [saving,      setSaving     ] = useState(false);
  const [editMode,    setEditMode   ] = useState(false);
  const [showAllHist, setShowAllHist] = useState(false);
  const [expandSnap,  setExpandSnap ] = useState(null);
  const [error,       setError      ] = useState('');
  const [success,     setSuccess    ] = useState('');
  const [origGoals,    setOrigGoals  ] = useState({});
  const [origProgress, setOrigProgress] = useState({});

  const emptyForm = {
    spiritual_goal:'', academic_goal:'', social_goal:'',
    vocational_goal:'', health_goal:'',
    actions:'', resources_needed:'', timeline:'',
    progress_status:'not_started', completion_rate:0,
    primary_mentor:'', mentor_contact:'', mentor_notes:'',
    last_reviewed:'', next_review:'', notes:''
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadPlans(); }, [participantId]);
  useEffect(() => { loadPlan();  }, [selYear]);

  async function loadPlans() {
    try {
      const res = await api.get(`/api/development/${participantId}`);
      setPlans(res.data);
    } catch {
      setError('Failed to load plans');
    }
  }

  async function loadPlan() {
    setLoading(true);
    setPlan(null);
    setHistory([]);
    setEditMode(false);
    setYearLocked(false);
    setShowAllHist(false);
    setExpandSnap(null);
    setError(''); setSuccess('');
    try {
      const res = await api.get(
        `/api/development/${participantId}/${selYear}`
      );
      const p = res.data;
      setPlan(p);
      setYearLocked(true);

      const fd = {
        spiritual_goal  : p.spiritual_goal   || '',
        academic_goal   : p.academic_goal    || '',
        social_goal     : p.social_goal      || '',
        vocational_goal : p.vocational_goal  || '',
        health_goal     : p.health_goal      || '',
        actions         : p.actions          || '',
        resources_needed: p.resources_needed || '',
        timeline        : p.timeline         || '',
        progress_status : p.progress_status  || 'not_started',
        completion_rate : p.completion_rate  || 0,
        primary_mentor  : p.primary_mentor   || '',
        mentor_contact  : p.mentor_contact   || '',
        mentor_notes    : p.mentor_notes     || '',
        last_reviewed   : p.last_reviewed
                          ? p.last_reviewed.split('T')[0] : '',
        next_review     : p.next_review
                          ? p.next_review.split('T')[0] : '',
        notes: ''
      };
      setForm(fd);
      setOrigGoals({
        spiritual_goal : p.spiritual_goal  || '',
        academic_goal  : p.academic_goal   || '',
        social_goal    : p.social_goal     || '',
        vocational_goal: p.vocational_goal || '',
        health_goal    : p.health_goal     || '',
      });
      setOrigProgress({
        progress_status: p.progress_status || 'not_started',
        completion_rate: p.completion_rate || 0,
      });

      const hRes = await api.get(`/api/development/${p.id}/history/all`);
      setHistory(hRes.data);
    } catch {
      setPlan(null);
      setForm(emptyForm);
      setYearLocked(false);
    } finally {
      setLoading(false);
    }
  }

  function detectChanges() {
    const goalsChanged = GOALS.some(
      g => form[g.key] !== (origGoals[g.key] || '')
    );
    const progressChanged =
      form.progress_status !== origProgress.progress_status ||
      form.completion_rate  !== origProgress.completion_rate;
    return { goalsChanged, progressChanged };
  }

  async function handleSave(e) {
    e.preventDefault();

    // Notes only mandatory when progress is being updated
    const { goalsChanged, progressChanged } = detectChanges();
    const isProgressUpdate = plan && progressChanged;

    if (isProgressUpdate && !form.notes.trim()) {
      setError('Notes are required when updating progress.');
      return;
    }

    setSaving(true); setError(''); setSuccess('');
    try {
      if (plan) {
        await api.put(`/api/development/${plan.id}`, {
          ...form,
          goals_changed   : goalsChanged,
          progress_changed: progressChanged
        });
      } else {
        await api.post('/api/development', {
          ...form,
          participant_id: participantId,
          plan_year     : selYear,
          // notes optional on create — use default if empty
          notes: form.notes.trim() || `Initial plan created for ${selYear}`
        });
      }
      setSuccess('Development plan saved successfully');
      setEditMode(false);
      setYearLocked(true);
      loadPlans();
      loadPlan();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  // ── Styles ──────────────────────────────────────────────────────
  const labelStyle = {
    display:'block', fontSize:'11px', fontWeight:'700',
    color:'#3d3528', letterSpacing:'0.3px',
    textTransform:'uppercase', marginBottom:'5px'
  };

  const inputStyle = {
    width:'100%', padding:'9px 11px',
    border:'1px solid #d4c9b0', borderRadius:'5px',
    fontSize:'13px', color:'#1a1610',
    background:'#faf8f3', outline:'none', fontFamily:'inherit'
  };

  const sectionStyle = {
    background:'#fffef9', border:'1px solid #d4c9b0',
    borderRadius:'8px', padding:'20px', marginBottom:'16px'
  };

  const secTitle = {
    fontSize:'11px', fontWeight:'700', color:'#6b5e4a',
    textTransform:'uppercase', letterSpacing:'0.6px',
    marginBottom:'14px', paddingBottom:'8px',
    borderBottom:'1px solid #e8e0d0',
    display:'flex', justifyContent:'space-between', alignItems:'center'
  };

  function ViewField({ label, value }) {
    if (!value) return null;
    return (
      <div style={{marginBottom:'12px'}}>
        <div style={{
          fontSize:'10px', fontWeight:'700', color:'#a09080',
          textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'3px'
        }}>{label}</div>
        <div style={{
          fontSize:'13px', color:'#1a1610',
          lineHeight:'1.6', whiteSpace:'pre-wrap'
        }}>{value}</div>
      </div>
    );
  }

  const statusInfo = STATUS_OPTIONS.find(
    s => s.value === (plan?.progress_status || 'not_started')
  );
  const planYears   = plans.map(p => p.plan_year);
  const visibleHist = showAllHist ? history : history.slice(0, 3);

  function changeTypeBadge(type) {
    const map = {
      goals   : { label:'Goals',            bg:'#d8ede4', color:'#2d6a4f' },
      progress: { label:'Progress',         bg:'#dce9f5', color:'#1a4068' },
      both    : { label:'Goals + Progress', bg:'#f5edd8', color:'#b85c00' },
    };
    const t = map[type] || map.both;
    return (
      <span style={{
        background:t.bg, color:t.color,
        padding:'1px 7px', borderRadius:'8px',
        fontSize:'10px', fontWeight:'700'
      }}>{t.label}</span>
    );
  }

  // Detect if progress is being changed in current form
  const { progressChanged } = plan ? detectChanges() : { progressChanged: false };

  return (
    <div>
      {error && (
        <div style={{
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          color:'#9b2335', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background:'#d8ede4', border:'1px solid #2d6a4f',
          borderRadius:'6px', padding:'10px 14px',
          color:'#2d6a4f', fontSize:'13px', marginBottom:'16px'
        }}>{success}</div>
      )}

      {/* Year Selector */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px',
        flexWrap:'wrap', gap:'10px'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <h3 style={{fontSize:'16px', fontWeight:'700'}}>
            Development Plan
          </h3>

          {/* Year — locked after plan exists */}
          {yearLocked || editMode ? (
            <div style={{
              padding:'7px 14px',
              background:'#1a1610',
              color:'#c49a3c',
              borderRadius:'5px',
              fontSize:'13px',
              fontWeight:'700',
              display:'flex', alignItems:'center', gap:'8px'
            }}>
              {selYear}
              {!editMode && (
                <button
                  onClick={() => {
                    setYearLocked(false);
                    setEditMode(false);
                  }}
                  style={{
                    background:'none', border:'none',
                    color:'#a09080', cursor:'pointer',
                    fontSize:'11px', fontFamily:'inherit',
                    textDecoration:'underline', padding:0
                  }}
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <select
              value={selYear}
              onChange={e => setSelYear(parseInt(e.target.value))}
              style={{
                padding:'7px 11px', border:'1px solid #d4c9b0',
                borderRadius:'5px', fontSize:'13px',
                background:'#faf8f3', outline:'none',
                fontFamily:'inherit', fontWeight:'700', color:'#c49a3c'
              }}
            >
              {YEARS.map(y => (
                <option key={y} value={y}>
                  {y} {planYears.includes(y) ? '✓' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {!editMode && !loading && (
          <button onClick={() => {
            setEditMode(true);
            setYearLocked(true);
          }} style={{
            background:'#1a1610', color:'#c49a3c', border:'none',
            borderRadius:'6px', padding:'9px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {plan ? 'Edit Plan' : `+ Create ${selYear} Plan`}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{padding:'32px', color:'#6b5e4a'}}>Loading...</div>

      ) : editMode ? (
        /* ══ EDIT / CREATE MODE ══════════════════════════════════ */
        <form onSubmit={handleSave}>

          {/* Goals */}
          <div style={sectionStyle}>
            <div style={secTitle}>Development Goals</div>
            <div style={{display:'grid', gap:'14px'}}>
              {GOALS.map(g => (
                <div key={g.key}>
                  <label style={labelStyle}>{g.label}</label>
                  <textarea style={{...inputStyle, minHeight:'70px'}}
                    placeholder={g.placeholder}
                    value={form[g.key]}
                    onChange={e => setForm({...form, [g.key]:e.target.value})} />
                </div>
              ))}
            </div>
          </div>

          {/* Action Plan */}
          <div style={sectionStyle}>
            <div style={secTitle}>Action Plan</div>
            <div style={{display:'grid', gap:'14px'}}>
              <div>
                <label style={labelStyle}>Planned Actions</label>
                <textarea style={{...inputStyle, minHeight:'80px'}}
                  placeholder="Specific steps to achieve the goals"
                  value={form.actions}
                  onChange={e => setForm({...form, actions:e.target.value})} />
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
              }}>
                <div>
                  <label style={labelStyle}>Resources Needed</label>
                  <textarea style={{...inputStyle, minHeight:'60px'}}
                    placeholder="Support or resources required"
                    value={form.resources_needed}
                    onChange={e => setForm({...form, resources_needed:e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Timeline</label>
                  <input style={inputStyle}
                    placeholder="e.g. Jan–Dec 2025"
                    value={form.timeline}
                    onChange={e => setForm({...form, timeline:e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* Mentor */}
          <div style={sectionStyle}>
            <div style={secTitle}>Mentor Details</div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr',
              gap:'14px', marginBottom:'14px'
            }}>
              <div>
                <label style={labelStyle}>Primary Mentor</label>
                <input style={inputStyle}
                  placeholder="Mentor full name"
                  value={form.primary_mentor}
                  onChange={e => setForm({...form, primary_mentor:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Mentor Contact</label>
                <input style={inputStyle}
                  placeholder="Phone or email"
                  value={form.mentor_contact}
                  onChange={e => setForm({...form, mentor_contact:e.target.value})} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Mentor Notes</label>
              <textarea style={{...inputStyle, minHeight:'60px'}}
                value={form.mentor_notes}
                onChange={e => setForm({...form, mentor_notes:e.target.value})} />
            </div>
          </div>

          {/* Review Schedule */}
          <div style={sectionStyle}>
            <div style={secTitle}>Review Schedule</div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
            }}>
              <div>
                <label style={labelStyle}>Last Reviewed</label>
                <input style={inputStyle} type="date"
                  value={form.last_reviewed}
                  onChange={e => setForm({...form, last_reviewed:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Next Review</label>
                <input style={inputStyle} type="date"
                  value={form.next_review}
                  onChange={e => setForm({...form, next_review:e.target.value})} />
              </div>
            </div>
          </div>

          {/* Progress — only when editing existing plan */}
          {plan && (
            <div style={{
              ...sectionStyle,
              border:'1px solid #c49a3c',
              background:'#faf8f0'
            }}>
              <div style={secTitle}>
                Update Progress
                <span style={{
                  fontSize:'10px', color:'#b85c00',
                  fontWeight:'600', textTransform:'none'
                }}>
                  Saves to history
                </span>
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:'20px'
              }}>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select style={inputStyle}
                    value={form.progress_status}
                    onChange={e => setForm({...form, progress_status:e.target.value})}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Completion Rate</label>
                  <ProgressBar
                    value={form.completion_rate}
                    onChange={val => setForm({...form, completion_rate:val})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes — mandatory only when progress changed */}
          <div style={{
            ...sectionStyle,
            border: progressChanged ? '1px solid #9b2335' : '1px solid #d4c9b0',
            background: progressChanged ? '#fff8f8' : '#fffef9'
          }}>
            <div style={secTitle}>
              Save Notes
              {progressChanged ? (
                <span style={{
                  color:'#9b2335', fontSize:'10px',
                  fontWeight:'600', textTransform:'none'
                }}>Required when updating progress *</span>
              ) : (
                <span style={{
                  color:'#a09080', fontSize:'10px',
                  fontWeight:'400', textTransform:'none'
                }}>Optional</span>
              )}
            </div>
            <textarea
              style={{
                ...inputStyle,
                minHeight:'80px',
                border: progressChanged
                  ? '1px solid #9b2335' : '1px solid #d4c9b0'
              }}
              placeholder={
                plan
                  ? progressChanged
                    ? 'Describe what was achieved (required for progress update)'
                    : 'Optional — describe what changed'
                  : 'Optional — describe the starting situation'
              }
              value={form.notes}
              onChange={e => setForm({...form, notes:e.target.value})}
              required={progressChanged}
            />
          </div>

          {/* Buttons */}
          <div style={{display:'flex', gap:'12px'}}>
            <button type="submit" disabled={saving} style={{
              background: saving ? '#a09080' : '#2d6a4f',
              color:'#fff', border:'none', borderRadius:'6px',
              padding:'12px 32px', fontSize:'14px', fontWeight:'700',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit'
            }}>
              {saving ? 'Saving...' : plan ? 'Save Changes' : 'Create Plan'}
            </button>
            <button type="button" onClick={() => {
              setEditMode(false);
              setError(''); setSuccess('');
            }} style={{
              background:'transparent', color:'#6b5e4a',
              border:'1px solid #d4c9b0', borderRadius:'6px',
              padding:'12px 24px', fontSize:'14px',
              cursor:'pointer', fontFamily:'inherit'
            }}>Cancel</button>
          </div>
        </form>

      ) : plan ? (
        /* ══ VIEW MODE ═══════════════════════════════════════════ */
        <div>
          {/* Progress Summary */}
          <div style={{
            background:'#1a1610', borderRadius:'8px',
            padding:'20px', marginBottom:'16px',
            display:'flex', alignItems:'center',
            justifyContent:'space-between', flexWrap:'wrap', gap:'16px'
          }}>
            <div style={{flex:1, minWidth:'200px'}}>
              <div style={{
                fontSize:'11px', color:'#a09080',
                textTransform:'uppercase', letterSpacing:'0.5px',
                marginBottom:'8px'
              }}>
                Current Progress — {selYear}
              </div>
              <ProgressBar value={plan.completion_rate || 0} readonly />
            </div>
            <span style={{
              background: statusInfo?.bg, color: statusInfo?.color,
              padding:'6px 16px', borderRadius:'20px',
              fontSize:'12px', fontWeight:'700'
            }}>
              {statusInfo?.label}
            </span>
          </div>

          {/* Goals */}
          <div style={sectionStyle}>
            <div style={secTitle}>Development Goals</div>
            {GOALS.map(g => (
              <ViewField key={g.key} label={g.label} value={plan[g.key]} />
            ))}
            {!GOALS.some(g => plan[g.key]) && (
              <div style={{color:'#a09080', fontSize:'13px'}}>
                No goals recorded yet.
              </div>
            )}
          </div>

          {/* Action Plan */}
          {(plan.actions || plan.resources_needed || plan.timeline) && (
            <div style={sectionStyle}>
              <div style={secTitle}>Action Plan</div>
              <ViewField label="Planned Actions"  value={plan.actions} />
              <ViewField label="Resources Needed" value={plan.resources_needed} />
              <ViewField label="Timeline"         value={plan.timeline} />
            </div>
          )}

          {/* Mentor */}
          {(plan.primary_mentor || plan.mentor_notes) && (
            <div style={sectionStyle}>
              <div style={secTitle}>Mentor Details</div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:'16px',
                marginBottom: plan.mentor_notes ? '12px' : 0
              }}>
                <ViewField label="Primary Mentor" value={plan.primary_mentor} />
                <ViewField label="Contact"        value={plan.mentor_contact} />
              </div>
              <ViewField label="Mentor Notes" value={plan.mentor_notes} />
            </div>
          )}

          {/* Review Schedule */}
          {(plan.last_reviewed || plan.next_review) && (
            <div style={sectionStyle}>
              <div style={secTitle}>Review Schedule</div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'
              }}>
                <ViewField label="Last Reviewed"
                  value={plan.last_reviewed
                    ? new Date(plan.last_reviewed).toLocaleDateString('en-GB')
                    : null} />
                <ViewField label="Next Review"
                  value={plan.next_review
                    ? new Date(plan.next_review).toLocaleDateString('en-GB')
                    : null} />
              </div>
            </div>
          )}

          {/* History */}
          <div style={sectionStyle}>
            <div style={secTitle}>
              Plan History
              <span style={{
                fontSize:'11px', color:'#a09080',
                fontWeight:'400', textTransform:'none'
              }}>
                {history.length} record{history.length !== 1 ? 's' : ''}
              </span>
            </div>

            {history.length === 0 ? (
              <div style={{color:'#a09080', fontSize:'13px'}}>
                No history yet.
              </div>
            ) : (
              <>
                {visibleHist.map((h, i) => (
                  <div key={h.id} style={{
                    borderBottom: i < visibleHist.length - 1
                      ? '1px solid #e8e0d0' : 'none',
                    paddingBottom:'14px', marginBottom:'14px'
                  }}>
                    <div style={{
                      display:'flex', alignItems:'center',
                      gap:'8px', marginBottom:'6px', flexWrap:'wrap'
                    }}>
                      <div style={{
                        fontSize:'12px', fontWeight:'700', color:'#1a1610'
                      }}>
                        {new Date(h.recorded_at).toLocaleDateString('en-GB')}
                      </div>
                      {changeTypeBadge(h.change_type)}
                      <span style={{
                        background: STATUS_OPTIONS.find(
                          s => s.value === h.progress_status
                        )?.bg || '#f0ece2',
                        color: STATUS_OPTIONS.find(
                          s => s.value === h.progress_status
                        )?.color || '#6b5e4a',
                        padding:'1px 7px', borderRadius:'8px',
                        fontSize:'10px', fontWeight:'700'
                      }}>
                        {STATUS_OPTIONS.find(
                          s => s.value === h.progress_status
                        )?.label}
                      </span>
                      <span style={{
                        fontSize:'11px', fontWeight:'700', color:'#c49a3c'
                      }}>
                        {h.completion_rate}%
                      </span>
                      <span style={{
                        fontSize:'11px', color:'#a09080', marginLeft:'auto'
                      }}>
                        {h.recorded_by_name}
                      </span>
                    </div>

                    <div style={{
                      fontSize:'13px', color:'#1a1610',
                      marginBottom:'6px', fontStyle:'italic'
                    }}>
                      "{h.notes}"
                    </div>

                    {(h.spiritual_goal || h.academic_goal ||
                      h.social_goal || h.vocational_goal ||
                      h.health_goal) && (
                      <div>
                        <button
                          onClick={() => setExpandSnap(
                            expandSnap === h.id ? null : h.id
                          )}
                          style={{
                            background:'transparent', color:'#1a4068',
                            border:'none', fontSize:'11px', fontWeight:'600',
                            cursor:'pointer', fontFamily:'inherit',
                            padding:0, textDecoration:'underline'
                          }}
                        >
                          {expandSnap === h.id
                            ? 'Hide Goals Snapshot'
                            : 'View Goals Snapshot'}
                        </button>
                        {expandSnap === h.id && (
                          <div style={{
                            marginTop:'8px', padding:'12px',
                            background:'#f5edd8',
                            border:'1px solid #e8d4a0', borderRadius:'6px'
                          }}>
                            {GOALS.map(g => h[g.key] ? (
                              <div key={g.key} style={{marginBottom:'8px'}}>
                                <div style={{
                                  fontSize:'10px', fontWeight:'700',
                                  color:'#b85c00', textTransform:'uppercase',
                                  letterSpacing:'0.3px', marginBottom:'2px'
                                }}>{g.label}</div>
                                <div style={{
                                  fontSize:'12px', color:'#1a1610'
                                }}>{h[g.key]}</div>
                              </div>
                            ) : null)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {history.length > 3 && (
                  <button
                    onClick={() => setShowAllHist(!showAllHist)}
                    style={{
                      background:'transparent', color:'#1a4068',
                      border:'1px solid #d4c9b0', borderRadius:'6px',
                      padding:'7px 16px', fontSize:'12px', fontWeight:'600',
                      cursor:'pointer', fontFamily:'inherit',
                      width:'100%', marginTop:'4px'
                    }}
                  >
                    {showAllHist
                      ? 'Show Less'
                      : `View All ${history.length} Records`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      ) : (
        /* ══ NO PLAN YET ════════════════════════════════════════ */
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>📋</div>
          <div style={{
            fontSize:'15px', fontWeight:'700', marginBottom:'6px'
          }}>
            No Plan for {selYear}
          </div>
          <div style={{
            color:'#6b5e4a', fontSize:'13px', marginBottom:'20px'
          }}>
            Create a development plan for{' '}
            {participant?.full_name?.split(' ')[0]} for {selYear}.
          </div>
          <button onClick={() => {
            setEditMode(true);
            setYearLocked(true);
          }} style={{
            background:'#1a1610', color:'#c49a3c', border:'none',
            borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            + Create {selYear} Plan
          </button>
        </div>
      )}
    </div>
  );
}