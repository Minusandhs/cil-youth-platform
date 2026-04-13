import { useState, useEffect } from 'react';
import api from '../../lib/api';

const LANG_LEVELS = ['beginner', 'intermediate', 'advanced', 'proficient'];
const INST_TYPES  = [
  { value:'university', label:'University'  },
  { value:'college',    label:'College'     },
  { value:'vocational', label:'Vocational'  },
  { value:'other',      label:'Other'       },
];

export default function TESApplicationForm({
  batch, onBack, onSuccess, existingApp
}) {
  const [participants,   setParticipants  ] = useState([]);
  const [selParticipant, setSelParticipant] = useState(null);
  const [search,         setSearch        ] = useState('');
  const [profile,        setProfile       ] = useState(null);
  const [olResult,       setOlResult      ] = useState(null);
  const [alResult,       setAlResult      ] = useState(null);
  const [certs,          setCerts         ] = useState([]);
  const [saving,         setSaving        ] = useState(false);
  const [step,           setStep          ] = useState(existingApp ? 2 : 1);
  const [error,          setError         ] = useState('');
  const [tesHistory, setTesHistory        ] = useState({ history:[], total_received:0 });

  const emptyForm = {
    contact_number:'', email:'', nic_number:'', guardian_name:'',
    lang_english:'', lang_sinhala:'', lang_tamil:'',
    institution_name:'', institution_type:'', course_name:'',
    course_duration:'', course_year:'', course_start_date:'',
    course_end_date:'', registration_number:'',
    financial_justification:'', community_contribution:'',
    fee_tuition:'', fee_materials:'', family_contribution:'',
    requested_amount:'',
    doc_application_form:false, doc_certificates:false,
    doc_admission_letter:false, doc_income_proof:false,
    doc_nic:false, doc_recommendation:false,
    commitment_confirmed:false,
    amount_approved:'', official_notes:''
  };

  const [form, setForm] = useState(existingApp ? {
    contact_number         : existingApp.contact_number       || '',
    email                  : existingApp.email                || '',
    nic_number             : existingApp.nic_number           || '',
    guardian_name          : existingApp.guardian_name        || '',
    lang_english           : existingApp.lang_english         || '',
    lang_sinhala           : existingApp.lang_sinhala         || '',
    lang_tamil             : existingApp.lang_tamil           || '',
    institution_name       : existingApp.institution_name     || '',
    institution_type       : existingApp.institution_type     || '',
    course_name            : existingApp.course_name          || '',
    course_duration        : existingApp.course_duration      || '',
    course_year            : existingApp.course_year          || '',
    course_start_date      : existingApp.course_start_date
                             ? existingApp.course_start_date.split('T')[0] : '',
    course_end_date        : existingApp.course_end_date
                             ? existingApp.course_end_date.split('T')[0] : '',
    registration_number    : existingApp.registration_number  || '',
    financial_justification: existingApp.financial_justification || '',
    community_contribution : existingApp.community_contribution  || '',
    fee_tuition            : existingApp.fee_tuition           || '',
    fee_materials          : existingApp.fee_materials         || '',
    family_contribution    : existingApp.family_contribution   || '',
    requested_amount       : existingApp.requested_amount      || '',
    doc_application_form   : existingApp.doc_application_form  || false,
    doc_certificates       : existingApp.doc_certificates      || false,
    doc_admission_letter   : existingApp.doc_admission_letter  || false,
    doc_income_proof       : existingApp.doc_income_proof      || false,
    doc_nic                : existingApp.doc_nic               || false,
    doc_recommendation     : existingApp.doc_recommendation    || false,
    commitment_confirmed   : existingApp.commitment_confirmed  || false,
    amount_approved        : existingApp.amount_approved       || '',
    official_notes         : existingApp.official_notes        || '',
  } : emptyForm);

  useEffect(() => {
    if (existingApp) loadExistingParticipant();
  }, []);

  // Auto-calculate requested amount
  useEffect(() => {
    const tuition = parseFloat(form.fee_tuition)        || 0;
    const materials = parseFloat(form.fee_materials)    || 0;
    const family = parseFloat(form.family_contribution) || 0;
    const requested = (tuition + materials) - family;
    setForm(f => ({
      ...f,
      requested_amount: requested > 0 ? requested.toFixed(2) : '0.00'
    }));
  }, [form.fee_tuition, form.fee_materials, form.family_contribution]);

  async function loadExistingParticipant() {
    try {
      const [partRes, profileRes, olRes, alRes, certRes, histRes] = await Promise.all([
        api.get(`/api/participants/${existingApp.participant_id}`),
        api.get(`/api/participants/${existingApp.participant_id}/profile`).catch(() => ({ data: null })),
        api.get(`/api/academic/ol/${existingApp.participant_id}`).catch(() => ({ data: [] })),
        api.get(`/api/academic/al/${existingApp.participant_id}`).catch(() => ({ data: [] })),
        api.get(`/api/certifications/${existingApp.participant_id}`).catch(() => ({ data: [] })),
        api.get(`/api/tes/history/${existingApp.participant_id}`).catch(() => ({ data: { history:[], total_received:0 } })),
      ]);
      setSelParticipant(partRes.data);
      setProfile(profileRes.data);
      setOlResult(olRes.data?.[0] || null);
      setAlResult(alRes.data?.[0] || null);
      setCerts(certRes.data || []);
      setTesHistory(histRes.data);
    } catch {
      setError('Failed to load participant data');
    }
  }
  async function searchParticipants() {
    if (!search.trim()) return;
    try {
      const res = await api.get('/api/participants', { params: { search } });
      setParticipants(res.data);
    } catch {
      setError('Search failed');
    }
  }

  async function selectParticipant(p) {
    setSelParticipant(p);
    setError('');
    try {
      const [profileRes, olRes, alRes, certRes, histRes] = await Promise.all([
        api.get(`/api/participants/${p.id}/profile`).catch(() => ({ data: null })),
        api.get(`/api/academic/ol/${p.id}`).catch(() => ({ data: [] })),
        api.get(`/api/academic/al/${p.id}`).catch(() => ({ data: [] })),
        api.get(`/api/certifications/${p.id}`).catch(() => ({ data: [] })),
        api.get(`/api/tes/history/${p.id}`).catch(() => ({ data: { history:[], total_received:0 } })),
      ]);
      setProfile(profileRes.data);
      setOlResult(olRes.data?.[0] || null);
      setAlResult(alRes.data?.[0] || null);
      setCerts(certRes.data || []);
      setTesHistory(histRes.data);
      setStep(2);
    } catch {
      setStep(2);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.commitment_confirmed) {
      setError('Participant commitment must be confirmed before submitting.');
      return;
    }
    setSaving(true); setError('');
    try {
      if (existingApp) {
        await api.put(`/api/tes/applications/${existingApp.id}`, form);
      } else {
        await api.post('/api/tes/applications', {
          ...form,
          batch_id      : batch.id,
          participant_id: selParticipant.id,
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save application');
    } finally {
      setSaving(false);
    }
  }

  function calcAge(dob) {
    if (!dob) return '—';
    return Math.floor((Date.now() - new Date(dob)) / (1000*60*60*24*365));
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
  const readonlyStyle = {
    ...inputStyle, background:'#f0ece2', color:'#6b5e4a', cursor:'default'
  };
  const sectionStyle = {
    background:'#fffef9', border:'1px solid #d4c9b0',
    borderRadius:'8px', padding:'20px', marginBottom:'16px'
  };
  const secTitle = {
    fontSize:'11px', fontWeight:'700', color:'#6b5e4a',
    textTransform:'uppercase', letterSpacing:'0.6px',
    marginBottom:'14px', paddingBottom:'8px',
    borderBottom:'1px solid #e8e0d0'
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center',
        gap:'12px', marginBottom:'20px'
      }}>
        <button onClick={onBack} style={{
          background:'transparent', border:'1px solid #d4c9b0',
          color:'#6b5e4a', padding:'6px 14px', borderRadius:'5px',
          fontSize:'12px', cursor:'pointer', fontFamily:'inherit'
        }}>← Back</button>
        <div>
          <h2 style={{fontSize:'18px', fontWeight:'700'}}>
            {existingApp ? 'Edit Application' : 'New Application'}
          </h2>
          <div style={{fontSize:'12px', color:'#6b5e4a'}}>
            {batch.batch_name}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          color:'#9b2335', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}

      {/* ── STEP 1: Select Participant ─────────────────────────── */}
      {step === 1 && (
        <div style={sectionStyle}>
          <div style={secTitle}>Select Participant</div>
          <div style={{display:'flex', gap:'10px', marginBottom:'16px'}}>
            <input style={{...inputStyle, flex:1}}
              placeholder="Search by name or participant ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchParticipants()} />
            <button onClick={searchParticipants} style={{
              background:'#1a1610', color:'#c49a3c', border:'none',
              borderRadius:'6px', padding:'9px 20px', fontSize:'13px',
              fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
            }}>Search</button>
          </div>
          {participants.length > 0 && (
            <div style={{
              border:'1px solid #d4c9b0', borderRadius:'6px', overflow:'hidden'
            }}>
              {participants.map(p => (
                <div key={p.id} onClick={() => selectParticipant(p)}
                  style={{
                    padding:'12px 16px', cursor:'pointer',
                    borderBottom:'1px solid #e8e0d0',
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='#faf8f3'}
                  onMouseLeave={e => e.currentTarget.style.background='white'}
                >
                  <div>
                    <div style={{fontWeight:'600'}}>{p.full_name}</div>
                    <div style={{fontSize:'11px', color:'#a09080'}}>
                      {p.participant_id} · {p.ldc_code}
                    </div>
                  </div>
                  <div style={{fontSize:'11px', color:'#6b5e4a'}}>
                    Age: {calcAge(p.date_of_birth)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Application Form ───────────────────────────── */}
      {step === 2 && selParticipant && (
        <form onSubmit={handleSubmit}>

          {/* Auto-filled Personal Info */}
          {/* Previous TES Support Banner */}
          {tesHistory.history.filter(h => h.status !== 'reverted').length > 0 && (
              <div style={{
                background:'#1a1610', borderRadius:'8px',
                padding:'16px 20px', marginBottom:'16px',
                display:'flex', alignItems:'center',
                justifyContent:'space-between', flexWrap:'wrap', gap:'12px'
              }}>
                <div>
                  <div style={{
                    fontSize:'11px', color:'#a09080',
                    textTransform:'uppercase', letterSpacing:'0.5px',
                    marginBottom:'4px'
                  }}>
                    Previously Received TES Support
                  </div>
                  <div style={{fontSize:'12px', color:'#e8d4a0'}}>
                    {tesHistory.history.filter(h => h.status !== 'reverted').length} previous intervention{tesHistory.history.filter(h => h.status !== 'reverted').length !== 1 ? 's' : ''}
                  </div>
                  <div style={{
                    display:'flex', gap:'8px', marginTop:'6px', flexWrap:'wrap'
                  }}>
                    {tesHistory.history
                      .filter(h => h.status !== 'reverted')
                      .map(h => (
                        <span key={h.id} style={{
                          background:'#2e2a22', color:'#c49a3c',
                          padding:'2px 8px', borderRadius:'6px',
                          fontSize:'11px', fontWeight:'600'
                        }}>
                          {h.batch_name}{h.course_name ? ` — ${h.course_name}` : ''}
                        </span>
                      ))
                    }
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{
                    fontSize:'10px', color:'#a09080',
                    textTransform:'uppercase', letterSpacing:'0.5px',
                    marginBottom:'4px'
                  }}>
                    Total Received
                  </div>
                  <div style={{
                    fontSize:'22px', fontWeight:'700', color:'#c49a3c'
                  }}>
                    LKR {parseFloat(tesHistory.total_received).toLocaleString('en-LK', {
                      minimumFractionDigits:2, maximumFractionDigits:2
                    })}
                  </div>
                </div>
              </div>
          )}
          <div style={sectionStyle}>
            <div style={secTitle}>Personal Information (Auto-filled)</div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px'
            }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={readonlyStyle}
                  value={selParticipant.full_name} readOnly />
              </div>
              <div>
                <label style={labelStyle}>Participant ID</label>
                <input style={readonlyStyle}
                  value={selParticipant.participant_id} readOnly />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <input style={readonlyStyle}
                  value={selParticipant.gender || '—'} readOnly />
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input style={readonlyStyle}
                  value={selParticipant.date_of_birth
                    ? new Date(selParticipant.date_of_birth)
                        .toLocaleDateString('en-GB') : '—'} readOnly />
              </div>
              <div>
                <label style={labelStyle}>Marital Status</label>
                <input style={readonlyStyle}
                  value={profile?.marital_status || '—'} readOnly />
              </div>
              <div>
                <label style={labelStyle}>Family Income (LKR)</label>
                <input style={readonlyStyle}
                  value={profile?.family_income || '—'} readOnly />
              </div>
            </div>

            {/* Future Plans */}
            {(profile?.short_term_plan || profile?.long_term_plan ||
              profile?.career_goal) && (
              <div style={{
                marginTop:'14px', display:'grid', gap:'10px'
              }}>
                {profile?.short_term_plan && (
                  <div>
                    <label style={labelStyle}>Short Term Plan</label>
                    <textarea style={{...readonlyStyle, minHeight:'50px'}}
                      value={profile.short_term_plan} readOnly />
                  </div>
                )}
                {profile?.long_term_plan && (
                  <div>
                    <label style={labelStyle}>Long Term Plan</label>
                    <textarea style={{...readonlyStyle, minHeight:'50px'}}
                      value={profile.long_term_plan} readOnly />
                  </div>
                )}
                {profile?.career_goal && (
                  <div>
                    <label style={labelStyle}>Career Goal</label>
                    <textarea style={{...readonlyStyle, minHeight:'50px'}}
                      value={profile.career_goal} readOnly />
                  </div>
                )}
              </div>
            )}

            {/* OL Results */}
            {olResult && (
              <div style={{marginTop:'14px'}}>
                <label style={labelStyle}>Latest O/L Results</label>
                <input style={readonlyStyle}
                  value={`OL ${olResult.exam_year} — ${olResult.school_name || ''} (${olResult.no_of_passes || 0} passes)`}
                  readOnly />
              </div>
            )}

            {/* AL Results */}
            {alResult && (
              <div style={{marginTop:'10px'}}>
                <label style={labelStyle}>Latest A/L Results</label>
                <input style={readonlyStyle}
                  value={`AL ${alResult.exam_year} — ${alResult.stream || ''} | Z-Score: ${alResult.z_score || 'N/A'}`}
                  readOnly />
              </div>
            )}

            {/* Certifications */}
            {certs.length > 0 && (
              <div style={{marginTop:'10px'}}>
                <label style={labelStyle}>
                  Certifications ({certs.length})
                </label>
                <textarea style={{...readonlyStyle, minHeight:'60px'}}
                  value={certs.map(c =>
                    `${c.cert_name} (${c.type_name})${c.grade_result ? ': '+c.grade_result : ''}`
                  ).join('\n')}
                  readOnly />
              </div>
            )}
          </div>

          {/* Contact & Identity */}
          <div style={sectionStyle}>
            <div style={secTitle}>Contact & Identity</div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
            }}>
              <div>
                <label style={labelStyle}>Contact Number *</label>
                <input style={inputStyle} value={form.contact_number}
                  onChange={e => setForm({...form, contact_number:e.target.value})}
                  placeholder="e.g. 077-1234567" required />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})}
                  placeholder="email@example.com" />
              </div>
              <div>
                <label style={labelStyle}>NIC Number *</label>
                <input style={inputStyle} value={form.nic_number}
                  onChange={e => setForm({...form, nic_number:e.target.value})}
                  placeholder="e.g. 200012345678" required />
              </div>
              <div>
                <label style={labelStyle}>Guardian Name *</label>
                <input style={inputStyle} value={form.guardian_name}
                  onChange={e => setForm({...form, guardian_name:e.target.value})}
                  placeholder="Parent or guardian full name" required />
              </div>
            </div>
          </div>

          {/* Language Proficiency */}
          <div style={sectionStyle}>
            <div style={secTitle}>Language Proficiency</div>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
              <thead>
                <tr style={{background:'#f0ece2'}}>
                  <th style={{
                    padding:'8px 12px', textAlign:'left',
                    fontSize:'11px', fontWeight:'700',
                    textTransform:'uppercase', letterSpacing:'0.4px',
                    color:'#3d3528', borderBottom:'1px solid #d4c9b0',
                    width:'120px'
                  }}>Language</th>
                  {LANG_LEVELS.map(l => (
                    <th key={l} style={{
                      padding:'8px 12px', textAlign:'center',
                      fontSize:'11px', fontWeight:'700',
                      textTransform:'uppercase', letterSpacing:'0.4px',
                      color:'#3d3528', borderBottom:'1px solid #d4c9b0'
                    }}>{l.charAt(0).toUpperCase()+l.slice(1)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key:'lang_english', label:'English' },
                  { key:'lang_sinhala', label:'Sinhala' },
                  { key:'lang_tamil',   label:'Tamil'   },
                ].map(lang => (
                  <tr key={lang.key} style={{borderBottom:'1px solid #e8e0d0'}}>
                    <td style={{padding:'10px 12px', fontWeight:'600'}}>
                      {lang.label}
                    </td>
                    {LANG_LEVELS.map(level => (
                      <td key={level} style={{padding:'10px 12px', textAlign:'center'}}>
                        <input type="radio" name={lang.key} value={level}
                          checked={form[lang.key] === level}
                          onChange={() => setForm({...form, [lang.key]:level})}
                          style={{
                            width:'16px', height:'16px',
                            accentColor:'#c49a3c', cursor:'pointer'
                          }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Institution & Course */}
          <div style={sectionStyle}>
            <div style={secTitle}>Institution & Course Information</div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
            }}>
              <div>
                <label style={labelStyle}>Institution Name *</label>
                <input style={inputStyle} value={form.institution_name}
                  onChange={e => setForm({...form, institution_name:e.target.value})}
                  placeholder="e.g. University of Kelaniya" required />
              </div>
              <div>
                <label style={labelStyle}>Institution Type</label>
                <select style={inputStyle} value={form.institution_type}
                  onChange={e => setForm({...form, institution_type:e.target.value})}>
                  <option value="">— Select Type —</option>
                  {INST_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Course Name *</label>
                <input style={inputStyle} value={form.course_name}
                  onChange={e => setForm({...form, course_name:e.target.value})}
                  placeholder="e.g. BSc Computer Science" required />
              </div>
              <div>
                <label style={labelStyle}>Registration Number</label>
                <input style={inputStyle} value={form.registration_number}
                  onChange={e => setForm({...form, registration_number:e.target.value})}
                  placeholder="Student/Registration number" />
              </div>
              <div>
                <label style={labelStyle}>Course Duration (Years)</label>
                <input style={inputStyle} type="number" min="1" max="10"
                  value={form.course_duration}
                  onChange={e => setForm({...form, course_duration:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Current Year of Study</label>
                <input style={inputStyle} type="number" min="1" max="10"
                  value={form.course_year}
                  onChange={e => setForm({...form, course_year:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Course Start Date</label>
                <input style={inputStyle} type="date"
                  value={form.course_start_date}
                  onChange={e => setForm({...form, course_start_date:e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Course End Date</label>
                <input style={inputStyle} type="date"
                  value={form.course_end_date}
                  onChange={e => setForm({...form, course_end_date:e.target.value})} />
              </div>
            </div>
          </div>

          {/* Financial */}
          <div style={sectionStyle}>
            <div style={secTitle}>Financial Information</div>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px',
              marginBottom:'14px'
            }}>
              <div>
                <label style={labelStyle}>Course / Tuition Fee (LKR)</label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  value={form.fee_tuition}
                  onChange={e => setForm({...form, fee_tuition:e.target.value})}
                  placeholder="0.00" />
              </div>
              <div>
                <label style={labelStyle}>
                  Materials / Books / Exam Fee (LKR)
                </label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  value={form.fee_materials}
                  onChange={e => setForm({...form, fee_materials:e.target.value})}
                  placeholder="0.00" />
              </div>
              <div>
                <label style={labelStyle}>
                  Local / Family Contribution (LKR)
                </label>
                <input style={inputStyle} type="number" min="0" step="0.01"
                  value={form.family_contribution}
                  onChange={e => setForm({...form, family_contribution:e.target.value})}
                  placeholder="0.00" />
              </div>
              <div>
                <label style={labelStyle}>
                  Requested Amount (LKR)
                  <span style={{
                    fontWeight:'400', textTransform:'none',
                    fontSize:'10px', color:'#a09080'
                  }}> (Auto-calculated)</span>
                </label>
                <input style={{
                  ...readonlyStyle,
                  fontWeight:'700', fontSize:'15px', color:'#2d6a4f'
                }}
                value={`LKR ${parseFloat(form.requested_amount || 0)
                  .toLocaleString('en-LK', {
                    minimumFractionDigits:2, maximumFractionDigits:2
                  })}`}
                readOnly />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Financial Justification *</label>
              <textarea style={{...inputStyle, minHeight:'100px'}}
                placeholder="Explain the financial need for this scholarship..."
                value={form.financial_justification}
                onChange={e => setForm({...form, financial_justification:e.target.value})}
                required />
            </div>
          </div>

          {/* Community */}
          <div style={sectionStyle}>
            <div style={secTitle}>Community Contribution</div>
            <textarea style={{...inputStyle, minHeight:'80px'}}
              placeholder="How will the participant contribute back to the community?"
              value={form.community_contribution}
              onChange={e => setForm({...form, community_contribution:e.target.value})} />
          </div>

          {/* Documents & Submit */}
          <div style={sectionStyle}>
            <div style={secTitle}>Documents Checklist</div>
            <div style={{display:'grid', gap:'8px', marginBottom:'20px'}}>
              {[
                { key:'doc_application_form', label:'Application Form'            },
                { key:'doc_certificates',     label:'Certificates (OL/AL/Other)'  },
                { key:'doc_admission_letter', label:'Admission Letter'            },
                { key:'doc_income_proof',     label:'Income Proof'                },
                { key:'doc_nic',              label:'NIC Copy'                    },
                { key:'doc_recommendation',   label:'Recommendation Letter'       },
              ].map(doc => (
                <label key={doc.key} style={{
                  display:'flex', alignItems:'center', gap:'10px',
                  padding:'10px 14px',
                  background: form[doc.key] ? '#d8ede4' : '#faf8f3',
                  border:`1px solid ${form[doc.key] ? '#2d6a4f' : '#d4c9b0'}`,
                  borderRadius:'6px', cursor:'pointer',
                  fontSize:'13px', fontWeight:'600', transition:'all 0.15s'
                }}>
                  <input type="checkbox" checked={form[doc.key]}
                    onChange={e => setForm({...form, [doc.key]:e.target.checked})}
                    style={{width:'16px', height:'16px', accentColor:'#2d6a4f'}} />
                  {doc.label}
                  {form[doc.key] && (
                    <span style={{
                      marginLeft:'auto', fontSize:'11px',
                      color:'#2d6a4f', fontWeight:'700'
                    }}>✓ Attached</span>
                  )}
                </label>
              ))}
            </div>

            {/* Commitment */}
            <div style={{
              background:'#1a1610', borderRadius:'8px', padding:'16px 20px',
              marginBottom:'20px'
            }}>
              <label style={{
                display:'flex', alignItems:'flex-start',
                gap:'12px', cursor:'pointer'
              }}>
                <input type="checkbox"
                  checked={form.commitment_confirmed}
                  onChange={e => setForm({
                    ...form, commitment_confirmed:e.target.checked
                  })}
                  style={{
                    width:'18px', height:'18px',
                    accentColor:'#c49a3c', marginTop:'2px', flexShrink:0
                  }} />
                <div>
                  <div style={{
                    fontSize:'13px', fontWeight:'700',
                    color:'#e8d4a0', marginBottom:'4px'
                  }}>
                    Participant Commitment Confirmation *
                  </div>
                  <div style={{fontSize:'12px', color:'#a09080', lineHeight:'1.6'}}>
                    I confirm that the participant has been informed about the
                    TES scholarship requirements and has committed to fulfilling
                    all obligations. The information provided is accurate and
                    complete to the best of my knowledge.
                  </div>
                </div>
              </label>
            </div>

            {/* For Official Use — LDC fills amount */}
            <div style={{
              background:'#f5edd8', border:'1px solid #c49a3c',
              borderRadius:'8px', padding:'16px 20px'
            }}>
              <div style={{
                fontSize:'11px', fontWeight:'700', color:'#b85c00',
                textTransform:'uppercase', letterSpacing:'0.6px',
                marginBottom:'14px'
              }}>
                For Official Use Only
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
              }}>
                <div>
                  <label style={{...labelStyle, color:'#b85c00'}}>
                    Amount Approved (LKR)
                  </label>
                  <input style={inputStyle} type="number" min="0" step="0.01"
                    value={form.amount_approved}
                    onChange={e => setForm({...form, amount_approved:e.target.value})}
                    placeholder="Amount to be funded" />
                </div>
                <div>
                  <label style={{...labelStyle, color:'#b85c00'}}>
                    Official Notes
                  </label>
                  <input style={inputStyle}
                    value={form.official_notes}
                    onChange={e => setForm({...form, official_notes:e.target.value})}
                    placeholder="Any official notes" />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{display:'flex', gap:'12px'}}>
            <button type="submit" disabled={saving} style={{
              background: saving ? '#a09080' : '#2d6a4f',
              color:'#fff', border:'none', borderRadius:'6px',
              padding:'12px 32px', fontSize:'14px', fontWeight:'700',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit'
            }}>
              {saving ? 'Saving...' : existingApp ? 'Save Changes' : 'Submit Application'}
            </button>
            <button type="button" onClick={onBack} style={{
              background:'transparent', color:'#6b5e4a',
              border:'1px solid #d4c9b0', borderRadius:'6px',
              padding:'12px 24px', fontSize:'14px',
              cursor:'pointer', fontFamily:'inherit'
            }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}