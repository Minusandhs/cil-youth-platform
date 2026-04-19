import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function SubjectManagement({ readOnly = false }) {
  const [subjects,  setSubjects ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [showForm,  setShowForm ] = useState(false);
  const [filterType, setFilterType] = useState('ol');
  const [error,     setError    ] = useState('');
  const [success,   setSuccess  ] = useState('');
  const [form, setForm] = useState({
    subject_name: '', subject_type: 'ol',
    is_core: false, display_order: 0
  });

  useEffect(() => { loadSubjects(); }, [filterType]);

  async function loadSubjects() {
    try {
      const res = await api.get('/api/subjects', {
        params: { type: filterType }
      });
      setSubjects(res.data);
    } catch {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/subjects', form);
      setSuccess('Subject added successfully');
      setShowForm(false);
      setForm({ subject_name:'', subject_type:'ol', is_core:false, display_order:0 });
      loadSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add subject');
    }
  }

  async function toggleActive(subject) {
    try {
      await api.put(`/api/subjects/${subject.id}`, {
        subject_name : subject.subject_name,
        is_active    : !subject.is_active,
        is_core      : subject.is_core,
        display_order: subject.display_order
      });
      loadSubjects();
    } catch {
      setError('Failed to update subject');
    }
  }

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

  if (loading) return (
    <div style={{padding:'32px', color:'#6b5e4a'}}>Loading...</div>
  );

  return (
    <div>
      <div className="rsp-section-header" style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px'
      }}>
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>Subject Management</h2>
          <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
            Manage OL and AL subject master list
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background:'#1a1610', color:'#c49a3c', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ Add Subject'}
          </button>
        )}
      </div>

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

      {/* Add Form */}
      {showForm && (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            Add New Subject
          </h3>
          <form onSubmit={handleCreate}>
            <div className="rsp-grid-3" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'14px'}}>
              <div>
                <label style={labelStyle}>Subject Name</label>
                <input style={inputStyle} value={form.subject_name}
                  onChange={e => setForm({...form, subject_name:e.target.value})}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={form.subject_type}
                  onChange={e => setForm({...form, subject_type:e.target.value})}>
                  <option value="ol">O/L Subject</option>
                  <option value="al">A/L Subject</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Display Order</label>
                <input style={inputStyle} type="number"
                  value={form.display_order}
                  onChange={e => setForm({...form, display_order:e.target.value})} />
              </div>
            </div>
            <div style={{
              display:'flex', alignItems:'center',
              gap:'10px', margin:'14px 0'
            }}>
              <input type="checkbox" id="is_core"
                checked={form.is_core}
                onChange={e => setForm({...form, is_core:e.target.checked})}
                style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
              <label htmlFor="is_core" style={{
                fontSize:'13px', fontWeight:'600', cursor:'pointer'
              }}>
                Core / Mandatory Subject
              </label>
            </div>
            <div className="rsp-submit-row" style={{display:'flex'}}>
              <button type="submit" style={{
                background:'#2d6a4f', color:'#fff', border:'none',
                borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>
                Add Subject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="ar-tab-toggle" style={{
        display:'flex', gap:'8px', marginBottom:'16px'
      }}>
        {[
          { value:'ol', label:'O/L Subjects' },
          { value:'al', label:'A/L Subjects' },
        ].map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)} style={{
            background: filterType === t.value ? '#1a1610' : 'transparent',
            color: filterType === t.value ? '#c49a3c' : '#6b5e4a',
            border:'1px solid #d4c9b0', borderRadius:'6px',
            padding:'8px 18px', fontSize:'13px', fontWeight:'600',
            cursor:'pointer', fontFamily:'inherit'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Subjects Table */}
      <div className="rsp-card-wrap">
        <table className="rsp-card-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#f0ece2'}}>
              {['Subject Name','Type','Core','Order','Status','Action'].map(h => (
                <th key={h} style={{
                  padding:'10px 14px', textAlign:'left',
                  fontSize:'10.5px', fontWeight:'700',
                  textTransform:'uppercase', letterSpacing:'0.4px',
                  color:'#3d3528', borderBottom:'1px solid #d4c9b0'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.map(s => (
              <tr key={s.id} style={{
                borderBottom:'1px solid #e8e0d0',
                opacity: s.is_active ? 1 : 0.5
              }}>
                <td data-label="Subject" style={{padding:'10px 14px', fontWeight:'600'}}>
                  {s.subject_name}
                </td>
                <td data-label="Type" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: s.subject_type === 'ol' ? '#d8ede4' : '#dce9f5',
                    color: s.subject_type === 'ol' ? '#2d6a4f' : '#1a4068',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {s.subject_type.toUpperCase()}
                  </span>
                </td>
                <td data-label="Core" style={{padding:'10px 14px'}}>
                  {s.is_core ? (
                    <span style={{
                      background:'#f5edd8', color:'#b85c00',
                      padding:'2px 8px', borderRadius:'10px',
                      fontSize:'10px', fontWeight:'700'
                    }}>Core</span>
                  ) : '—'}
                </td>
                <td data-label="Order" style={{padding:'10px 14px', color:'#6b5e4a'}}>
                  {s.display_order}
                </td>
                <td data-label="Status" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: s.is_active ? '#d8ede4' : '#f5e0e3',
                    color: s.is_active ? '#2d6a4f' : '#9b2335',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Action" style={{padding:'10px 14px'}}>
                  <button onClick={() => toggleActive(s)} style={{
                    background: s.is_active ? '#f5e0e3' : '#d8ede4',
                    color: s.is_active ? '#9b2335' : '#2d6a4f',
                    border:'none', borderRadius:'4px',
                    padding:'4px 10px', fontSize:'11px',
                    fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                  }}>
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div style={{
        marginTop:'16px', padding:'12px 16px',
        background:'#fdecd8', border:'1px solid #b85c00',
        borderRadius:'6px', fontSize:'12px', color:'#b85c00'
      }}>
        Note: Deactivating a subject removes it from new entries but
        preserves all existing results that used that subject.
      </div>
    </div>
  );
}