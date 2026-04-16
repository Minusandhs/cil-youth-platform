import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useConstants } from '../../lib/useConstants';

export default function AcademicRecords({ participantId, readOnly = false }) {
  const options = useConstants();
  const [activeTab,  setActiveTab ] = useState('ol');
  const [olResults,  setOlResults ] = useState([]);
  const [alResults,  setAlResults ] = useState([]);
  const [olSubjects, setOlSubjects] = useState([]);
  const [alSubjects, setAlSubjects] = useState([]);
  const [olGrades,   setOlGrades  ] = useState([]);
  const [alGrades,   setAlGrades  ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [showOLForm, setShowOLForm] = useState(false);
  const [showALForm, setShowALForm] = useState(false);
  const [editOL,     setEditOL    ] = useState(null);
  const [editAL,     setEditAL    ] = useState(null);
  const [saving,     setSaving    ] = useState(false);
  const [error,      setError     ] = useState('');
  const [success,    setSuccess   ] = useState('');

  const [olForm, setOlForm] = useState({
    exam_year: '', index_number: '', school_name: '',
    results_verified: false, notes: '',
    subjects: []
  });

  const [alForm, setAlForm] = useState({
    exam_year: '', index_number: '', school_name: '',
    stream: '', medium: '', z_score: '',
    district_rank: '', island_rank: '',
    university_selected: false, university_name: '',
    course_selected: '', results_verified: false, notes: '',
    subjects: []
  });

  useEffect(() => { loadAll(); }, [participantId]);

  async function loadAll() {
    try {
      const [olRes, alRes, olSubRes, alSubRes, olGradeRes, alGradeRes] = await Promise.all([
        api.get(`/api/academic/ol/${participantId}`),
        api.get(`/api/academic/al/${participantId}`),
        api.get('/api/subjects', { params: { type: 'ol' } }),
        api.get('/api/subjects', { params: { type: 'al' } }),
        api.get('/api/grades',   { params: { type: 'ol' } }),
        api.get('/api/grades',   { params: { type: 'al' } }),
      ]);
      setOlResults(olRes.data);
      setAlResults(alRes.data);
      setOlSubjects(olSubRes.data);
      setAlSubjects(alSubRes.data);
      setOlGrades(olGradeRes.data);
      setAlGrades(alGradeRes.data);
    } catch {
      setError('Failed to load academic records');
    } finally {
      setLoading(false);
    }
  }

  // ── OL Subject helpers ──────────────────────────────────────────
  function addOLSubject() {
    setOlForm({...olForm, subjects: [
      ...olForm.subjects,
      { subject_name: '', grade: '', is_core: false }
    ]});
  }

  function removeOLSubject(index) {
    const updated = olForm.subjects.filter((_, i) => i !== index);
    setOlForm({...olForm, subjects: updated});
  }

  function updateOLSubject(index, field, value) {
    if (field === 'subject_name' && value) {
      // Check for duplicates
      const isDuplicate = olForm.subjects.some(
        (s, i) => i !== index && s.subject_name === value
      );
      if (isDuplicate) {
        alert(`"${value}" has already been added. Please select a different subject.`);
        return;
      }
    }
    const updated = olForm.subjects.map((s, i) => {
      if (i !== index) return s;
      if (field === 'subject_name') {
        const found = olSubjects.find(sub => sub.subject_name === value);
        return { ...s, subject_name: value, is_core: found?.is_core || false };
      }
      return { ...s, [field]: value };
    });
    setOlForm({...olForm, subjects: updated});
  }

  // ── AL Subject helpers ──────────────────────────────────────────
  function addALSubject(type) {
    setAlForm({...alForm, subjects: [
      ...alForm.subjects,
      { subject_name: '', grade: '', subject_type: type }
    ]});
  }

  function removeALSubject(index) {
    const updated = alForm.subjects.filter((_, i) => i !== index);
    setAlForm({...alForm, subjects: updated});
  }

  function updateALSubject(index, field, value) {
    if (field === 'subject_name' && value) {
      // Check for duplicates within same subject_type
      const currentType = alForm.subjects[index]?.subject_type;
      const isDuplicate = alForm.subjects.some(
        (s, i) => i !== index &&
                  s.subject_name === value &&
                  s.subject_type === currentType
      );
      if (isDuplicate) {
        alert(`"${value}" has already been added. Please select a different subject.`);
        return;
      }
    }
    const updated = alForm.subjects.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setAlForm({...alForm, subjects: updated});
  }

  // ── Open Edit forms ─────────────────────────────────────────────
  function openEditOL(result) {
    setEditOL(result);
    setOlForm({
      exam_year       : result.exam_year        || '',
      index_number    : result.index_number     || '',
      school_name     : result.school_name      || '',
      results_verified: result.results_verified || false,
      notes           : result.notes            || '',
      subjects        : result.subjects?.filter(s => s.subject_name) || []
    });
    setShowOLForm(true);
    setError(''); setSuccess('');
  }

  function openEditAL(result) {
    setEditAL(result);
    setAlForm({
      exam_year          : result.exam_year           || '',
      index_number       : result.index_number        || '',
      school_name        : result.school_name         || '',
      stream             : result.stream              || '',
      medium             : result.medium              || '',
      z_score            : result.z_score             || '',
      district_rank      : result.district_rank       || '',
      island_rank        : result.island_rank         || '',
      university_selected: result.university_selected || false,
      university_name    : result.university_name     || '',
      course_selected    : result.course_selected     || '',
      results_verified   : result.results_verified    || false,
      notes              : result.notes               || '',
      subjects           : result.subjects?.filter(s => s.subject_name) || []
    });
    setShowALForm(true);
    setError(''); setSuccess('');
  }

  // ── Save OL ─────────────────────────────────────────────────────
  async function handleSaveOL(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...olForm, participant_id: participantId };
      if (editOL) {
        await api.put(`/api/academic/ol/${editOL.id}`, payload);
      } else {
        await api.post('/api/academic/ol', payload);
      }
      setSuccess('OL results saved successfully');
      setShowOLForm(false); setEditOL(null);
      setOlForm({
        exam_year:'', index_number:'', school_name:'',
        results_verified:false, notes:'', subjects:[]
      });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save OL results');
    } finally {
      setSaving(false);
    }
  }

  // ── Save AL ─────────────────────────────────────────────────────
  async function handleSaveAL(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...alForm, participant_id: participantId };
      if (editAL) {
        await api.put(`/api/academic/al/${editAL.id}`, payload);
      } else {
        await api.post('/api/academic/al', payload);
      }
      setSuccess('AL results saved successfully');
      setShowALForm(false); setEditAL(null);
      setAlForm({
        exam_year:'', index_number:'', school_name:'',
        stream:'', medium:'', z_score:'', district_rank:'',
        island_rank:'', university_selected:false,
        university_name:'', course_selected:'',
        results_verified:false, notes:'', subjects:[]
      });
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save AL results');
    } finally {
      setSaving(false);
    }
  }

  // ── Style helpers ───────────────────────────────────────────────
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
    borderRadius:'8px', padding:'20px', marginBottom:'20px'
  };

  function gradeColor(grade) {
    // Check if it's a pass grade from our loaded grades
    const found = [...olGrades, ...alGrades].find(g => g.grade_name === grade);
    if (found) return found.is_pass ? '#2d6a4f' : '#9b2335';
    return '#1a1610';
  }

  if (loading) return (
    <div style={{padding:'32px', color:'#6b5e4a'}}>
      Loading academic records...
    </div>
  );

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

      {/* OL / AL Tabs */}
      <div className="ar-tab-toggle" style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
        {[
          { id:'ol', label:'O/L Results' },
          { id:'al', label:'A/L Results' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: activeTab === t.id ? '#1a1610' : 'transparent',
            color: activeTab === t.id ? '#c49a3c' : '#6b5e4a',
            border:'1px solid #d4c9b0', borderRadius:'6px',
            padding:'8px 20px', fontSize:'13px', fontWeight:'600',
            cursor:'pointer', fontFamily:'inherit'
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OL TAB ───────────────────────────────────────────── */}
      {activeTab === 'ol' && (
        <div>
          <div className="rsp-section-header" style={{
            display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'16px'
          }}>
            <h3 style={{fontSize:'16px', fontWeight:'700'}}>
              O/Level Results
            </h3>
            {!showOLForm && !readOnly && (
              <button onClick={() => {
                setEditOL(null);
                setOlForm({
                  exam_year:'', index_number:'', school_name:'',
                  results_verified:false, notes:'', subjects:[]
                });
                setShowOLForm(true);
              }} style={{
                background:'#1a1610', color:'#c49a3c', border:'none',
                borderRadius:'6px', padding:'9px 18px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>+ Add OL Result</button>
            )}
          </div>

          {/* OL Form */}
          {showOLForm && (
            <div style={sectionStyle}>
              <h4 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
                {editOL ? 'Edit OL Result' : 'Add OL Result'}
              </h4>
              <form onSubmit={handleSaveOL}>
                <div className="rsp-grid-3" style={{
                  display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                  gap:'14px', marginBottom:'20px'
                }}>
                  <div>
                    <label style={labelStyle}>Exam Year *</label>
                    <input style={inputStyle} type="number"
                      required
                      value={olForm.exam_year}
                      onChange={e => setOlForm({...olForm, exam_year:e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Index Number</label>
                    <input style={inputStyle}
                      value={olForm.index_number}
                      onChange={e => setOlForm({...olForm, index_number:e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>School Name</label>
                    <input style={inputStyle}
                      value={olForm.school_name}
                      onChange={e => setOlForm({...olForm, school_name:e.target.value})} />
                  </div>
                </div>

                {/* Subjects */}
                <div style={{marginBottom:'20px'}}>
                  <div style={{
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:'10px'
                  }}>
                    <label style={labelStyle}>Subjects & Grades</label>
                    <button type="button" onClick={addOLSubject} style={{
                      background:'transparent', color:'#c49a3c',
                      border:'1px dashed #c49a3c', borderRadius:'4px',
                      padding:'4px 12px', fontSize:'11px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>+ Add Subject</button>
                  </div>

                  {olForm.subjects.length === 0 && (
                    <div style={{
                      padding:'16px', textAlign:'center',
                      color:'#a09080', fontSize:'13px',
                      border:'1px dashed #d4c9b0', borderRadius:'6px'
                    }}>
                      Click "+ Add Subject" to add subjects
                    </div>
                  )}

                  {olForm.subjects.map((s, i) => (
                    <div key={i} style={{
                      display:'grid', gridTemplateColumns:'2fr 1fr auto',
                      gap:'10px', marginBottom:'8px', alignItems:'center'
                    }}>
                      <select style={inputStyle}
                        value={s.subject_name}
                        onChange={e => updateOLSubject(i, 'subject_name', e.target.value)}
                        required>
                        <option value="">— Select Subject —</option>
                        {olSubjects
                          .filter(sub =>
                            sub.subject_name === s.subject_name ||
                            !olForm.subjects.some(sel => sel.subject_name === sub.subject_name)
                          )
                          .map(sub => (
                            <option key={sub.id} value={sub.subject_name}>
                              {sub.subject_name}{sub.is_core ? ' (Core)' : ''}
                            </option>
                          ))
                        }
                      </select>
                      <select style={inputStyle} value={s.grade}
                        onChange={e => updateOLSubject(i, 'grade', e.target.value)}
                        required>
                        <option value="">Grade</option>
                        {olGrades.map(g => (
                          <option key={g.id} value={g.grade_name}>
                            {g.grade_name} — {g.description}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeOLSubject(i)} style={{
                        background:'#f5e0e3', color:'#9b2335', border:'none',
                        borderRadius:'4px', padding:'8px 12px', fontSize:'13px',
                        cursor:'pointer', fontFamily:'inherit'
                      }}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{
                  display:'flex', alignItems:'center',
                  gap:'10px', marginBottom:'16px'
                }}>
                  <div style={{
                    display:'flex', alignItems:'center',
                    gap:'10px'
                  }}>
                    <input type="checkbox" id="ol_verified"
                      checked={olForm.results_verified}
                      onChange={e => setOlForm({...olForm, results_verified:e.target.checked})}
                      style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
                    <label htmlFor="ol_verified" style={{
                      fontSize:'13px', fontWeight:'600', cursor:'pointer'
                    }}>Results Verified</label>
                  </div>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>Notes</label>
                  <textarea style={{...inputStyle, minHeight:'60px'}}
                    value={olForm.notes}
                    onChange={e => setOlForm({...olForm, notes:e.target.value})} />
                </div>

                <div className="rsp-submit-row" style={{display:'flex', gap:'10px'}}>
                  <button type="submit" disabled={saving} style={{
                    background: saving ? '#a09080' : '#2d6a4f',
                    color:'#fff', border:'none', borderRadius:'6px',
                    padding:'10px 24px', fontSize:'13px', fontWeight:'700',
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit'
                  }}>
                    {saving ? 'Saving...' : 'Save OL Result'}
                  </button>
                  <button type="button" onClick={() => {
                    setShowOLForm(false); setEditOL(null);
                  }} style={{
                    background:'transparent', color:'#6b5e4a',
                    border:'1px solid #d4c9b0', borderRadius:'6px',
                    padding:'10px 20px', fontSize:'13px',
                    cursor:'pointer', fontFamily:'inherit'
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* OL Results List */}
          {olResults.length === 0 && !showOLForm ? (
            <div style={{
              background:'#fffef9', border:'1px solid #d4c9b0',
              borderRadius:'8px', padding:'40px', textAlign:'center'
            }}>
              <div style={{fontSize:'36px', marginBottom:'10px'}}>📝</div>
              <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
                No OL Results Yet
              </div>
              <div style={{color:'#6b5e4a', fontSize:'13px'}}>
                Click "+ Add OL Result" to enter results.
              </div>
            </div>
          ) : (
            olResults.map(result => (
              <div key={result.id} style={sectionStyle}>
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:'14px'
                }}>
                  <div>
                    <div style={{fontSize:'16px', fontWeight:'700'}}>
                      O/Level {result.exam_year}
                    </div>
                    <div style={{fontSize:'12px', color:'#6b5e4a', marginTop:'2px'}}>
                      {result.school_name && `${result.school_name} · `}
                      {result.index_number && `Index: ${result.index_number}`}
                      {result.results_verified && (
                        <span style={{
                          marginLeft:'8px', background:'#d8ede4',
                          color:'#2d6a4f', padding:'1px 7px',
                          borderRadius:'8px', fontSize:'10px', fontWeight:'700'
                        }}>Verified</span>
                      )}
                    </div>
                  </div>
                  {!readOnly && (
                    <button onClick={() => openEditOL(result)} style={{
                      background:'#dce9f5', color:'#1a4068', border:'none',
                      borderRadius:'4px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Edit</button>
                  )}
                </div>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',
                  gap:'8px'
                }}>
                  {result.subjects?.filter(s => s.subject_name).map((s, i) => (
                    <div key={i} style={{
                      background:'#f0ece2', borderRadius:'6px',
                      padding:'8px 12px', display:'flex',
                      justifyContent:'space-between', alignItems:'center'
                    }}>
                      <div>
                        <div style={{fontSize:'12px', fontWeight:'600'}}>
                          {s.subject_name}
                        </div>
                        {s.is_core && (
                          <div style={{fontSize:'9px', color:'#a09080'}}>Core</div>
                        )}
                      </div>
                      <div style={{
                        fontSize:'18px', fontWeight:'700',
                        color: gradeColor(s.grade)
                      }}>
                        {s.grade}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── AL TAB ───────────────────────────────────────────── */}
      {activeTab === 'al' && (
        <div>
          <div className="rsp-section-header" style={{
            display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'16px'
          }}>
            <h3 style={{fontSize:'16px', fontWeight:'700'}}>
              A/Level Results
            </h3>
            {!showALForm && !readOnly && (
              <button onClick={() => {
                setEditAL(null);
                setAlForm({
                  exam_year:'', index_number:'', school_name:'',
                  stream:'', medium:'', z_score:'',
                  district_rank:'', island_rank:'',
                  university_selected:false, university_name:'',
                  course_selected:'', results_verified:false,
                  notes:'', subjects:[]
                });
                setShowALForm(true);
              }} style={{
                background:'#1a1610', color:'#c49a3c', border:'none',
                borderRadius:'6px', padding:'9px 18px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>+ Add AL Result</button>
            )}
          </div>

          {/* AL Form */}
          {showALForm && (
            <div style={sectionStyle}>
              <h4 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
                {editAL ? 'Edit AL Result' : 'Add AL Result'}
              </h4>
              <form onSubmit={handleSaveAL}>
                <div className="rsp-grid-3" style={{
                  display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                  gap:'14px', marginBottom:'16px'
                }}>
                  <div>
                    <label style={labelStyle}>Exam Year *</label>
                    <input style={inputStyle} type="number"
                      required
                      value={alForm.exam_year}
                      onChange={e => setAlForm({...alForm, exam_year:e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Index Number</label>
                    <input style={inputStyle}
                      value={alForm.index_number}
                      onChange={e => setAlForm({...alForm, index_number:e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>School Name</label>
                    <input style={inputStyle}
                      value={alForm.school_name}
                      onChange={e => setAlForm({...alForm, school_name:e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Stream *</label>
                    <select style={inputStyle} value={alForm.stream}
                      onChange={e => setAlForm({...alForm, stream:e.target.value})} required>
                      <option value="">— Select Stream —</option>
                      {options.alStreams.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Medium *</label>
                    <select style={inputStyle} value={alForm.medium}
                      onChange={e => setAlForm({...alForm, medium:e.target.value})} required>
                      <option value="">— Select Medium —</option>
                      {options.alMediums.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Z-Score</label>
                    <input style={inputStyle} type="number" step="0.0001"
                      value={alForm.z_score}
                      onChange={e => setAlForm({...alForm, z_score:e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>District Rank</label>
                    <input style={inputStyle} type="number"
                      value={alForm.district_rank}
                      onChange={e => setAlForm({...alForm, district_rank:e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Island Rank</label>
                    <input style={inputStyle} type="number"
                      value={alForm.island_rank}
                      onChange={e => setAlForm({...alForm, island_rank:e.target.value})} />
                  </div>
                </div>

                {/* University Selection */}
                <div style={{
                  background:'#f5edd8', border:'1px solid #e8d4a0',
                  borderRadius:'6px', padding:'14px', marginBottom:'16px'
                }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    marginBottom: alForm.university_selected ? '12px' : '0'
                  }}>
                    <input type="checkbox" id="uni_selected"
                      checked={alForm.university_selected}
                      onChange={e => setAlForm({...alForm, university_selected:e.target.checked})}
                      style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
                    <label htmlFor="uni_selected" style={{
                      fontSize:'13px', fontWeight:'600', cursor:'pointer'
                    }}>Selected for University</label>
                  </div>
                  {alForm.university_selected && (
                    <div className="rsp-grid-2" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
                      <div>
                        <label style={labelStyle}>University Name *</label>
                        <input style={inputStyle} required
                          value={alForm.university_name}
                          onChange={e => setAlForm({...alForm, university_name:e.target.value})} />
                      </div>
                      <div>
                        <label style={labelStyle}>Course Selected *</label>
                        <input style={inputStyle} required
                          value={alForm.course_selected}
                          onChange={e => setAlForm({...alForm, course_selected:e.target.value})} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Subjects */}
                <div style={{marginBottom:'16px'}}>
                  <div style={{
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:'10px'
                  }}>
                    <label style={labelStyle}>Main Subjects (3)</label>
                    <button type="button" onClick={() => addALSubject('main')} style={{
                      background:'transparent', color:'#c49a3c',
                      border:'1px dashed #c49a3c', borderRadius:'4px',
                      padding:'4px 12px', fontSize:'11px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>+ Add Main Subject</button>
                  </div>
                  {alForm.subjects.filter(s => s.subject_type === 'main').length === 0 && (
                    <div style={{
                      padding:'12px', textAlign:'center', color:'#a09080',
                      fontSize:'13px', border:'1px dashed #d4c9b0', borderRadius:'6px'
                    }}>Add up to 3 main subjects</div>
                  )}
                  {alForm.subjects.map((s, i) => s.subject_type !== 'main' ? null : (
                    <div key={i} style={{
                      display:'grid', gridTemplateColumns:'2fr 1fr auto',
                      gap:'10px', marginBottom:'8px', alignItems:'center'
                    }}>
                      <select style={inputStyle} value={s.subject_name}
                        onChange={e => updateALSubject(i, 'subject_name', e.target.value)} required>
                        <option value="">— Select Subject —</option>
                        {alSubjects
                          .filter(sub =>
                            !sub.is_core && (
                              sub.subject_name === s.subject_name ||
                              !alForm.subjects.some(
                                sel => sel.subject_name === sub.subject_name &&
                                      sel.subject_type === 'main'
                              )
                            )
                          )
                          .map(sub => (
                            <option key={sub.id} value={sub.subject_name}>
                              {sub.subject_name}
                            </option>
                          ))
                        }
                      </select>
                      <select style={inputStyle} value={s.grade}
                        onChange={e => updateALSubject(i, 'grade', e.target.value)} required>
                        <option value="">Grade</option>
                        {alGrades.map(g => (
                          <option key={g.id} value={g.grade_name}>
                            {g.grade_name} — {g.description}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeALSubject(i)} style={{
                        background:'#f5e0e3', color:'#9b2335', border:'none',
                        borderRadius:'4px', padding:'8px 12px', fontSize:'13px',
                        cursor:'pointer', fontFamily:'inherit'
                      }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* General Subjects */}
                <div style={{marginBottom:'16px'}}>
                  <div style={{
                    display:'flex', justifyContent:'space-between',
                    alignItems:'center', marginBottom:'10px'
                  }}>
                    <label style={labelStyle}>General Subjects</label>
                    <button type="button" onClick={() => addALSubject('general')} style={{
                      background:'transparent', color:'#1a4068',
                      border:'1px dashed #1a4068', borderRadius:'4px',
                      padding:'4px 12px', fontSize:'11px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>+ Add General Subject</button>
                  </div>
                  {alForm.subjects.map((s, i) => s.subject_type !== 'general' ? null : (
                    <div key={i} style={{
                      display:'grid', gridTemplateColumns:'2fr 1fr auto',
                      gap:'10px', marginBottom:'8px', alignItems:'center'
                    }}>
                      <select style={inputStyle} value={s.subject_name}
                        onChange={e => updateALSubject(i, 'subject_name', e.target.value)}>
                        <option value="">— Select Subject —</option>
                        {alSubjects.filter(sub => sub.is_core).map(sub => (
                          <option key={sub.id} value={sub.subject_name}>
                            {sub.subject_name}
                          </option>
                        ))}
                      </select>
                      <select style={inputStyle} value={s.grade}
                        onChange={e => updateALSubject(i, 'grade', e.target.value)}>
                        <option value="">Grade</option>
                        {alGrades.map(g => (
                          <option key={g.id} value={g.grade_name}>
                            {g.grade_name} — {g.description}
                          </option>
                        ))}
                      </select>
                      <button type="button" onClick={() => removeALSubject(i)} style={{
                        background:'#f5e0e3', color:'#9b2335', border:'none',
                        borderRadius:'4px', padding:'8px 12px', fontSize:'13px',
                        cursor:'pointer', fontFamily:'inherit'
                      }}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{
                  display:'flex', alignItems:'center',
                  gap:'10px', marginBottom:'14px'
                }}>
                  <input type="checkbox" id="al_verified"
                    checked={alForm.results_verified}
                    onChange={e => setAlForm({...alForm, results_verified:e.target.checked})}
                    style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
                  <label htmlFor="al_verified" style={{
                    fontSize:'13px', fontWeight:'600', cursor:'pointer'
                  }}>Results Verified</label>
                </div>

                <div style={{marginBottom:'16px'}}>
                  <label style={labelStyle}>Notes</label>
                  <textarea style={{...inputStyle, minHeight:'60px'}}
                    value={alForm.notes}
                    onChange={e => setAlForm({...alForm, notes:e.target.value})} />
                </div>

                <div className="rsp-submit-row" style={{display:'flex', gap:'10px'}}>
                  <button type="submit" disabled={saving} style={{
                    background: saving ? '#a09080' : '#2d6a4f',
                    color:'#fff', border:'none', borderRadius:'6px',
                    padding:'10px 24px', fontSize:'13px', fontWeight:'700',
                    cursor: saving ? 'not-allowed' : 'pointer', fontFamily:'inherit'
                  }}>
                    {saving ? 'Saving...' : 'Save AL Result'}
                  </button>
                  <button type="button" onClick={() => {
                    setShowALForm(false); setEditAL(null);
                  }} style={{
                    background:'transparent', color:'#6b5e4a',
                    border:'1px solid #d4c9b0', borderRadius:'6px',
                    padding:'10px 20px', fontSize:'13px',
                    cursor:'pointer', fontFamily:'inherit'
                  }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* AL Results List */}
          {alResults.length === 0 && !showALForm ? (
            <div style={{
              background:'#fffef9', border:'1px solid #d4c9b0',
              borderRadius:'8px', padding:'40px', textAlign:'center'
            }}>
              <div style={{fontSize:'36px', marginBottom:'10px'}}>📝</div>
              <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
                No AL Results Yet
              </div>
              <div style={{color:'#6b5e4a', fontSize:'13px'}}>
                Click "+ Add AL Result" to enter results.
              </div>
            </div>
          ) : (
            alResults.map(result => (
              <div key={result.id} style={sectionStyle}>
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:'14px'
                }}>
                  <div>
                    <div style={{fontSize:'16px', fontWeight:'700'}}>
                      A/Level {result.exam_year}
                    </div>
                    <div style={{fontSize:'12px', color:'#6b5e4a', marginTop:'2px'}}>
                      {result.stream}
                      {result.medium && ` · ${result.medium} Medium`}
                      {result.z_score && ` · Z-Score: ${result.z_score}`}
                      {result.university_selected && (
                        <span style={{
                          marginLeft:'8px', background:'#d8ede4',
                          color:'#2d6a4f', padding:'1px 7px',
                          borderRadius:'8px', fontSize:'10px', fontWeight:'700'
                        }}>University Selected</span>
                      )}
                    </div>
                    {result.university_selected && result.university_name && (
                      <div style={{fontSize:'12px', color:'#2d6a4f', marginTop:'3px'}}>
                        {result.university_name} — {result.course_selected}
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <button onClick={() => openEditAL(result)} style={{
                      background:'#dce9f5', color:'#1a4068', border:'none',
                      borderRadius:'4px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Edit</button>
                  )}
                </div>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',
                  gap:'8px'
                }}>
                  {result.subjects?.filter(s => s.subject_name).map((s, i) => (
                    <div key={i} style={{
                      background: s.subject_type === 'general' ? '#dce9f5' : '#f0ece2',
                      borderRadius:'6px', padding:'8px 12px',
                      display:'flex', justifyContent:'space-between',
                      alignItems:'center'
                    }}>
                      <div>
                        <div style={{fontSize:'12px', fontWeight:'600'}}>
                          {s.subject_name}
                        </div>
                        <div style={{fontSize:'9px', color:'#a09080'}}>
                          {s.subject_type === 'general' ? 'General' : 'Main'}
                        </div>
                      </div>
                      <div style={{
                        fontSize:'18px', fontWeight:'700',
                        color: gradeColor(s.grade)
                      }}>
                        {s.grade}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}