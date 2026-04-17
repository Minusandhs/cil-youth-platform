import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  CURRENT_STATUS,
  statusLabel, maritalLabel,
} from '../../lib/constants';
import { useConstants } from '../../lib/useConstants';

export default function PersonalInfo({ participant, onUpdate, readOnly = false }) {
  const options = useConstants();
  const [profile,      setProfile     ] = useState(null);
  const [history,      setHistory     ] = useState([]);
  const [schoolGrades, setSchoolGrades] = useState([]);
  const [loading,      setLoading     ] = useState(true);
  const [saving,       setSaving      ] = useState(false);
  const [editMode,     setEditMode    ] = useState(false);
  const [success,      setSuccess     ] = useState('');
  const [error,        setError       ] = useState('');
  const [form, setForm] = useState({
    marital_status     : '',
    living_outside_ldc : false,
    outside_purpose    : '',
    outside_location   : '',
    is_pregnant        : false,
    number_of_children : 0,
    current_status     : '',
    current_institution: '',
    current_course     : '',
    current_year       : '',
    current_exam_type  : '',
    short_term_plan    : '',
    long_term_plan     : '',
    career_goal        : '',
    further_education  : false,
    education_details  : '',
    family_income      : '',
    no_of_dependants   : '',
  });

  useEffect(() => { loadAll(); }, [participant?.id]);

  async function loadAll() {
    try {
      const [profileRes, historyRes, gradesRes] = await Promise.all([
        api.get(`/api/participants/${participant.id}/profile`).catch(() => null),
        api.get(`/api/participants/${participant.id}/status-history`).catch(() => ({ data: [] })),
        api.get('/api/school-grades').catch(() => ({ data: [] })),
      ]);
      setSchoolGrades((gradesRes?.data || []).filter(g => g.is_active));

      if (profileRes?.data) {
        setProfile(profileRes.data);
        setForm({
          marital_status     : profileRes.data.marital_status      || '',
          living_outside_ldc : profileRes.data.living_outside_ldc  || false,
          outside_purpose    : profileRes.data.outside_purpose     || '',
          outside_location   : profileRes.data.outside_location    || '',
          is_pregnant        : profileRes.data.is_pregnant         || false,
          number_of_children : profileRes.data.number_of_children  || 0,
          current_status     : profileRes.data.current_status      || '',
          current_institution: profileRes.data.current_institution || '',
          current_course     : profileRes.data.current_course      || '',
          current_year       : profileRes.data.current_year        || '',
          current_exam_type  : profileRes.data.current_exam_type   || '',
          short_term_plan    : profileRes.data.short_term_plan     || '',
          long_term_plan     : profileRes.data.long_term_plan      || '',
          career_goal        : profileRes.data.career_goal         || '',
          further_education  : profileRes.data.further_education   || false,
          education_details  : profileRes.data.education_details   || '',
          family_income      : profileRes.data.family_income       || '',
          no_of_dependants   : profileRes.data.no_of_dependants    || '',
        });
      } else {
        // No profile yet — open in edit mode
        setEditMode(true);
      }
      setHistory(historyRes?.data || []);
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    // ── Mandatory field validation ───────────────────────────────
    const missing = [];
    if (!form.marital_status)   missing.push('Marital Status');
    if (!form.current_status)   missing.push('Current Status');
    if (form.current_status && CURRENT_STATUS[form.current_status]) {
      for (const f of CURRENT_STATUS[form.current_status].fields) {
        if (!form[f.key]) missing.push(f.label);
      }
    }
    if (!form.family_income)    missing.push('Family Monthly Income');
    if (form.no_of_dependants === '' || form.no_of_dependants === null || form.no_of_dependants === undefined)
      missing.push('Number of Dependants');
    if (!form.short_term_plan)  missing.push('Short Term Plan');
    if (!form.long_term_plan)   missing.push('Long Term Plan');
    if (!form.career_goal)      missing.push('Career Goal');
    if (missing.length > 0) {
      setError(`Please fill in the following required fields: ${missing.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      // Save profile
      await api.put(`/api/participants/${participant.id}/profile`, form);

      // Save status history if status changed
      if (form.current_status) {
        const lastHistory = history[0];
        if (!lastHistory || lastHistory.status !== form.current_status) {
          await api.post(`/api/participants/${participant.id}/status-history`, {
            status     : form.current_status,
            institution: form.current_institution,
            course     : form.current_course,
            year_level : form.current_year,
          });
        }
      }

      setSuccess('Profile saved successfully');
      setEditMode(false);
      loadAll();
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditMode(false);
    setError(''); setSuccess('');
    if (!profile) {
      // No profile saved yet — reset to blank so next edit starts clean
      setForm({
        marital_status:'', living_outside_ldc:false, outside_purpose:'',
        outside_location:'', is_pregnant:false, number_of_children:0,
        current_status:'', current_institution:'', current_course:'', current_year:'',
        current_exam_type:'',
        short_term_plan:'', long_term_plan:'', career_goal:'',
        further_education:false, education_details:'',
        family_income:'', no_of_dependants:'',
      });
      return;
    }
    // Reset form to saved profile
    if (profile) {
      setForm({
        marital_status     : profile.marital_status      || '',
        living_outside_ldc : profile.living_outside_ldc  || false,
        outside_purpose    : profile.outside_purpose     || '',
        outside_location   : profile.outside_location    || '',
        is_pregnant        : profile.is_pregnant         || false,
        number_of_children : profile.number_of_children  || 0,
        current_status     : profile.current_status      || '',
        current_institution: profile.current_institution || '',
        current_course     : profile.current_course      || '',
        current_year       : profile.current_year        || '',
        current_exam_type  : profile.current_exam_type   || '',
        short_term_plan    : profile.short_term_plan     || '',
        long_term_plan     : profile.long_term_plan      || '',
        career_goal        : profile.career_goal         || '',
        further_education  : profile.further_education   || false,
        education_details  : profile.education_details   || '',
        family_income      : profile.family_income       || '',
        no_of_dependants   : profile.no_of_dependants    || '',
      });
    }
  }

  // ── Style helpers ───────────────────────────────────────────────
  const labelStyle = {
    display:'block', fontSize:'11px', fontWeight:'700',
    color:'#3d3528', letterSpacing:'0.3px',
    textTransform:'uppercase', marginBottom:'5px'
  };

  const inputStyle = (disabled) => ({
    width:'100%', padding:'9px 11px',
    border:'1px solid #d4c9b0', borderRadius:'5px',
    fontSize:'13px', color: disabled ? '#a09080' : '#1a1610',
    background: disabled ? '#f0ece2' : '#faf8f3',
    outline:'none', fontFamily:'inherit',
    cursor: disabled ? 'default' : 'text'
  });

  const sectionStyle = {
    background:'#fffef9', border:'1px solid #d4c9b0',
    borderRadius:'8px', padding:'20px', marginBottom:'20px'
  };

  const sectionTitleStyle = {
    fontSize:'14px', fontWeight:'700',
    marginBottom:'16px', paddingBottom:'10px',
    borderBottom:'1px solid #e8e0d0', color:'#1a1610',
    display:'flex', justifyContent:'space-between', alignItems:'center'
  };

  // ── View mode field renderer ────────────────────────────────────
  function ViewField({ label, value, inline = false }) {
    if (inline) {
      const hasValue = value !== undefined && value !== null && value !== '';
      return (
        <div className="pi-vf-row" style={{
          display:'flex', justifyContent:'space-between', alignItems:'baseline',
          gap:'16px', padding:'8px 0',
          borderBottom:'1px solid var(--color-divider)'
        }}>
          <div className="pi-vf-lbl" style={{
            fontSize:'11px', fontWeight:'700', color:'var(--color-text-muted)',
            textTransform:'uppercase', letterSpacing:'0.4px', flexShrink:0
          }}>{label}</div>
          <div style={{
            fontSize:'13px', textAlign:'right',
            color: hasValue ? 'var(--color-brand-primary)' : 'var(--color-text-placeholder)'
          }}>
            {hasValue ? value : '—'}
          </div>
        </div>
      );
    }
    return (
      <div>
        <div style={{
          fontSize:'10px', fontWeight:'700', color:'#a09080',
          textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'3px'
        }}>{label}</div>
        <div style={{fontSize:'13px', color: value ? '#1a1610' : '#c0b090'}}>
          {value || '—'}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{padding:'32px', color:'#6b5e4a'}}>Loading profile...</div>
  );

  return (
    <div>
      {/* Messages */}
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

      {/* ── VIEW MODE ─────────────────────────────────────────── */}
      {!editMode && profile && (
        <div>
          {/* Edit Button */}
          {!readOnly && (
            <div className="rsp-edit-btn-row" style={{display:'flex', justifyContent:'flex-end', marginBottom:'16px'}}>
              <button onClick={() => setEditMode(true)} style={{
                background:'#1a1610', color:'#c49a3c', border:'none',
                borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>
                Edit Profile
              </button>
            </div>
          )}

          {/* Personal & Family */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Personal & Family Status</div>
            <div className="rsp-grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 32px'}}>
              <ViewField inline label="Marital Status"     value={maritalLabel(form.marital_status)} />
              <ViewField inline label="Number of Children" value={form.number_of_children} />
              <ViewField inline label="Pregnant"           value={form.is_pregnant ? 'Yes' : 'No'} />
              {form.living_outside_ldc && (
                <>
                  <ViewField inline label="Living Outside LDC" value="Yes" />
                  <ViewField inline label="Purpose"            value={form.outside_purpose} />
                  <ViewField inline label="Location"           value={form.outside_location} />
                </>
              )}
            </div>
          </div>

          {/* Current Status */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Current Status</div>
            <div style={{marginBottom:'12px'}}>
              <span style={{
                background: 'var(--color-brand-primary)',
                color:'white', padding:'4px 10px', borderRadius:'12px',
                fontSize:'12px', fontWeight:'600'
              }}>
                {statusLabel(form.current_status)}
              </span>
            </div>
            {form.current_status && CURRENT_STATUS[form.current_status] && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px'}}>
                {CURRENT_STATUS[form.current_status].fields.map(f => (
                  <ViewField key={f.key} label={f.label} value={form[f.key]} />
                ))}
              </div>
            )}
          </div>

          {/* Future Plans */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Future Plans</div>
            <div style={{display:'grid', gap:'16px'}}>
              <ViewField label="Short Term Plan (1 year)" value={form.short_term_plan} />
              <ViewField label="Long Term Plan (5 years)" value={form.long_term_plan} />
              <ViewField label="Career Goal"              value={form.career_goal} />
              {form.further_education && (
                <ViewField label="Further Education Plans" value={form.education_details} />
              )}
            </div>
          </div>

          {/* Family Background */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Family Background</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
              <ViewField label="Family Income (LKR/month)" value={form.family_income} />
              <ViewField label="No of Dependants"          value={form.no_of_dependants} />
            </div>
          </div>

          {/* Status History */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Status History</div>
            {history.length === 0 ? (
              <div style={{color:'#a09080', fontSize:'13px'}}>
                No status history recorded yet.
              </div>
            ) : (
              <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
              <table className="rsp-card-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'480px'}}>
                <thead>
                  <tr style={{background:'#f0ece2'}}>
                    {['Date','Status','Institution','Course/Role','Year/Duration'].map(h => (
                      <th key={h} style={{
                        padding:'8px 12px', textAlign:'left',
                        fontSize:'10px', fontWeight:'700',
                        textTransform:'uppercase', letterSpacing:'0.4px',
                        color:'#3d3528', borderBottom:'1px solid #d4c9b0'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id} style={{
                      borderBottom:'1px solid #e8e0d0',
                      background: i === 0 ? '#f5edd8' : 'transparent'
                    }}>
                      <td data-label="Date" style={{padding:'8px 12px', color:'#6b5e4a', fontSize:'12px'}}>
                        {new Date(h.recorded_at).toLocaleDateString('en-GB')}
                      </td>
                      <td data-label="Status" style={{padding:'8px 12px'}}>
                        <span style={{
                          background:'#dce9f5', color:'#1a4068',
                          padding:'2px 8px', borderRadius:'10px',
                          fontSize:'10px', fontWeight:'700'
                        }}>
                          {statusLabel(h.status)}
                        </span>
                      </td>
                      <td data-label="Institution" style={{padding:'8px 12px', color:'#1a1610'}}>{h.institution || '—'}</td>
                      <td data-label="Course" style={{padding:'8px 12px', color:'#1a1610'}}>{h.course      || '—'}</td>
                      <td data-label="Year" style={{padding:'8px 12px', color:'#6b5e4a'}}>{h.year_level  || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT MODE ─────────────────────────────────────────── */}
      {editMode && (
        <form onSubmit={handleSave}>

          {/* Personal & Family */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Personal & Family Status</div>
            <div className="rsp-grid-3" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px'}}>
              <div>
                <label style={labelStyle}>Marital Status</label>
                <select style={inputStyle(false)} value={form.marital_status}
                  onChange={e => setForm({...form, marital_status:e.target.value})}>
                  <option value="">— Select —</option>
                  {options.maritalStatuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              {/* Living Outside LDC */}
              <div style={{gridColumn:'1 / -1'}}>
                <div style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  padding:'12px 14px',
                  background: form.living_outside_ldc ? '#fdecd8' : '#faf8f3',
                  border:`1px solid ${form.living_outside_ldc ? '#c49a3c' : '#d4c9b0'}`,
                  borderRadius:'6px', marginBottom: form.living_outside_ldc ? '12px' : '0'
                }}>
                  <input type="checkbox" id="living_outside"
                    checked={form.living_outside_ldc}
                    onChange={e => setForm({
                      ...form,
                      living_outside_ldc: e.target.checked,
                      outside_purpose   : '',
                      outside_location  : ''
                    })}
                    style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
                  <label htmlFor="living_outside" style={{
                    fontSize:'13px', fontWeight:'400', cursor:'pointer'
                  }}>
                    Participant is currently living outside the LDC area
                  </label>
                </div>

                {form.living_outside_ldc && (
                  <div style={{
                    display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
                  }}>
                    <div>
                      <label style={labelStyle}>Purpose *</label>
                      <select style={inputStyle(false)} value={form.outside_purpose}
                        onChange={e => setForm({...form, outside_purpose:e.target.value})}>
                        <option value="">— Select Purpose —</option>
                        {options.outsidePurposes.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Where *</label>
                      <input style={inputStyle(false)}
                        value={form.outside_location}
                        onChange={e => setForm({...form, outside_location:e.target.value})} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Number of Children</label>
                <input style={inputStyle(false)} type="number" min="0"
                  value={form.number_of_children}
                  onChange={e => setForm({...form, number_of_children:e.target.value})} />
              </div>
              <div style={{
                display:'flex', alignItems:'center',
                gap:'10px', paddingTop:'20px'
              }}>
                <input type="checkbox" id="pregnant"
                  checked={form.is_pregnant}
                  onChange={e => setForm({...form, is_pregnant:e.target.checked})}
                  style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
                <label htmlFor="pregnant" style={{
                  fontSize:'13px', fontWeight:'600', cursor:'pointer'
                }}>
                  Currently Pregnant
                </label>
              </div>
            </div>
          </div>

          {/* Current Status — Dynamic */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Current Status</div>
            <div style={{marginBottom:'16px'}}>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle(false)} value={form.current_status}
                onChange={e => setForm({
                  ...form,
                  current_status     : e.target.value,
                  current_institution: '',
                  current_course     : '',
                  current_year       : '',
                  current_exam_type  : ''
                })}>
                <option value="">— Select Status —</option>
                {options.currentStatuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic fields */}
            {form.current_status && CURRENT_STATUS[form.current_status] && (
              <div className="rsp-grid-3" style={{
                display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px',
                background:'#f5edd8', padding:'14px', borderRadius:'6px',
                border:'1px solid #e8d4a0'
              }}>
                {CURRENT_STATUS[form.current_status].fields.map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label} *</label>
                    {f.type === 'grade_select' ? (
                      <select style={inputStyle(false)}
                        value={form[f.key]}
                        required
                        onChange={e => setForm({...form, [f.key]:e.target.value})}>
                        <option value="">— Select Grade —</option>
                        {schoolGrades.map(g => (
                          <option key={g.id} value={g.grade_label}>{g.grade_label}</option>
                        ))}
                      </select>
                    ) : f.type === 'exam_type_select' ? (
                      <div>
                        <select style={inputStyle(false)}
                          value={['A/L', 'O/L'].includes(form[f.key]) ? form[f.key] : (form[f.key] ? 'Other' : '')}
                          required
                          onChange={e => {
                            const val = e.target.value;
                            if (val === 'Other') setForm({...form, [f.key]: ''});
                            else setForm({...form, [f.key]: val});
                          }}>
                          <option value="">— Select Exam —</option>
                          <option value="A/L">A/L</option>
                          <option value="O/L">O/L</option>
                          <option value="Other">Other (Manual Entry)</option>
                        </select>
                        {!['A/L', 'O/L'].includes(form[f.key]) && (form[f.key] || form[f.key] === '') && (
                          <input style={{...inputStyle(false), marginTop:'8px'}}
                            value={form[f.key]}
                            required
                            placeholder="Enter exam type..."
                            onChange={e => setForm({...form, [f.key]:e.target.value})} />
                        )}
                      </div>
                    ) : (
                      <input style={inputStyle(false)}
                        value={form[f.key]}
                        required
                        placeholder={f.placeholder || ''}
                        onChange={e => setForm({...form, [f.key]:e.target.value})} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Future Plans */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Future Plans</div>
            <div style={{display:'grid', gap:'14px'}}>
              <div>
                <label style={labelStyle}>Short Term Plan (within 1 year)</label>
                <textarea style={{...inputStyle(false), minHeight:'70px'}}
                  value={form.short_term_plan}
                  onChange={e => setForm({...form, short_term_plan:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Long Term Plan (within 5 years)</label>
                <textarea style={{...inputStyle(false), minHeight:'70px'}}
                  value={form.long_term_plan}
                  onChange={e => setForm({...form, long_term_plan:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Career Goal</label>
                <textarea style={{...inputStyle(false), minHeight:'70px'}}
                  value={form.career_goal}
                  onChange={e => setForm({...form, career_goal:e.target.value})} />
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <input type="checkbox" id="further_ed"
                  checked={form.further_education}
                  onChange={e => setForm({...form, further_education:e.target.checked})}
                  style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
                <label htmlFor="further_ed" style={{
                  fontSize:'13px', fontWeight:'600', cursor:'pointer'
                }}>
                  Plans for further education
                </label>
              </div>
              {form.further_education && (
                <div>
                  <label style={labelStyle}>Education Details</label>
                  <textarea style={{...inputStyle(false), minHeight:'70px'}}
                    value={form.education_details}
                    onChange={e => setForm({...form, education_details:e.target.value})} />
                </div>
              )}
            </div>
          </div>

          {/* Family Background */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Family Background</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
              <div>
                <label style={labelStyle}>Family Monthly Income (LKR) *</label>
                <input style={inputStyle(false)} type="number"
                  value={form.family_income}
                  onChange={e => setForm({...form, family_income:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Number of Dependants *</label>
                <input style={inputStyle(false)} type="number" min="0"
                  value={form.no_of_dependants}
                  onChange={e => setForm({...form, no_of_dependants:e.target.value})} />
              </div>
            </div>
          </div>

          {/* Save / Cancel Buttons */}
          <div className="rsp-submit-row" style={{display:'flex', gap:'12px', justifyContent:'flex-end'}}>
            <button type="submit" disabled={saving} style={{
              background: saving ? '#a09080' : '#2d6a4f',
              color:'#fff', border:'none', borderRadius:'6px',
              padding:'12px 32px', fontSize:'14px', fontWeight:'700',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit'
            }}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button" onClick={handleCancel} style={{
              background:'transparent', color:'#6b5e4a',
              border:'1px solid #d4c9b0', borderRadius:'6px',
              padding:'12px 24px', fontSize:'14px',
              cursor:'pointer', fontFamily:'inherit'
            }}>
              Cancel
            </button>
          </div>

        </form>
      )}

      {/* ── No Profile Yet ────────────────────────────────────── */}
      {!editMode && !profile && (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'40px', marginBottom:'12px'}}>📋</div>
          <div style={{fontSize:'16px', fontWeight:'700', marginBottom:'8px'}}>
            No Profile Yet
          </div>
          <div style={{color:'#6b5e4a', fontSize:'13px', marginBottom:'20px'}}>
            {readOnly
              ? 'No profile was recorded for this participant.'
              : 'Start by creating a profile for this participant.'}
          </div>
          {!readOnly && (
            <button onClick={() => setEditMode(true)} style={{
              background:'#1a1610', color:'#c49a3c', border:'none',
              borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
              fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
            }}>
              Create Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}