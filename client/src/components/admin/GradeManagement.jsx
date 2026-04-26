import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function GradeManagement({ readOnly = false }) {
  const [grades,     setGrades    ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [showForm,   setShowForm  ] = useState(false);
  const [filterType, setFilterType] = useState('ol');
  const [error,      setError     ] = useState('');
  const [success,    setSuccess   ] = useState('');
  const [form, setForm] = useState({
    grade_name: '', grade_type: 'ol',
    description: '', is_pass: true, display_order: 0
  });

  useEffect(() => { loadGrades(); }, [filterType]);

  async function loadGrades() {
    try {
      const res = await api.get('/api/grades', { params: { type: filterType } });
      setGrades(res.data);
    } catch {
      setError('Failed to load grades');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/grades', form);
      setSuccess('Grade added successfully');
      setShowForm(false);
      setForm({ grade_name:'', grade_type:'ol', description:'', is_pass:true, display_order:0 });
      loadGrades();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add grade');
    }
  }

  async function toggleActive(grade) {
    try {
      await api.put(`/api/grades/${grade.id}`, {
        grade_name   : grade.grade_name,
        description  : grade.description,
        is_pass      : grade.is_pass,
        is_active    : !grade.is_active,
        display_order: grade.display_order
      });
      loadGrades();
    } catch {
      setError('Failed to update grade');
    }
  }

  const labelStyle = {
    display:'block', fontSize:'11px', fontWeight:'700',
    color:'var(--color-text-heading)', letterSpacing:'0.3px',
    textTransform:'uppercase', marginBottom:'5px'
  };
  const inputStyle = {
    width:'100%', padding:'9px 11px',
    border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
    fontSize:'13px', color:'var(--color-text-heading)',
    background:'var(--color-bg-page)', outline:'none', fontFamily:'inherit'
  };

  if (loading) return <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>Loading...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8">
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>Exam Grade Management</h2>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            Manage OL and AL exam grade master list
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)} className="w-full md:w-auto" style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ Add Grade'}
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background:'var(--color-tint-danger)', border:'1px solid var(--color-danger)',
          borderRadius:'6px', padding:'10px 14px',
          color:'var(--color-danger)', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background:'var(--color-tint-success)', border:'1px solid var(--color-success)',
          borderRadius:'6px', padding:'10px 14px',
          color:'var(--color-success)', fontSize:'13px', marginBottom:'16px'
        }}>{success}</div>
      )}

      {/* Add Form */}
      {showForm && (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            Add New Grade
          </h3>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
              <div>
                <label style={labelStyle}>Grade Name</label>
                <input style={inputStyle} value={form.grade_name}
                  onChange={e => setForm({...form, grade_name:e.target.value})}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={form.grade_type}
                  onChange={e => setForm({...form, grade_type:e.target.value})}>
                  <option value="ol">O/L Grade</option>
                  <option value="al">A/L Grade</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input style={inputStyle} value={form.description}
                  onChange={e => setForm({...form, description:e.target.value})}
                  />
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
              gap:'10px', marginBottom:'16px'
            }}>
              <input type="checkbox" id="is_pass"
                checked={form.is_pass}
                onChange={e => setForm({...form, is_pass:e.target.checked})}
                style={{width:'16px', height:'16px', accentColor:'var(--color-brand-accent)'}} />
              <label htmlFor="is_pass" style={{
                fontSize:'13px', fontWeight:'600', cursor:'pointer'
              }}>
                Counts as a Pass
              </label>
            </div>
            <div className="flex flex-col md:flex-row gap-2.5">
              <button type="submit" className="w-full md:w-auto" style={{
                background:'var(--color-success)', color:'#fff', border:'none',
                borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>
                Add Grade
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="ar-tab-toggle" style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
        {[
          { value:'ol', label:'O/L Grades' },
          { value:'al', label:'A/L Grades' },
        ].map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)} style={{
            background: filterType === t.value ? 'var(--color-brand-primary)' : 'transparent',
            color: filterType === t.value ? 'var(--color-brand-accent)' : 'var(--color-text-subdued)',
            border:'1px solid var(--color-border-subtle)', borderRadius:'6px',
            padding:'8px 18px', fontSize:'13px', fontWeight:'600',
            cursor:'pointer', fontFamily:'inherit'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Grades Table */}
      <div className="rsp-card-wrap">
        <table className="rsp-card-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'var(--color-bg-stripe)'}}>
              {['Grade','Type','Description','Pass/Fail','Order','Status','Action'].map(h => (
                <th key={h} style={{
                  padding:'10px 14px', textAlign:'left',
                  fontSize:'10.5px', fontWeight:'700',
                  textTransform:'uppercase', letterSpacing:'0.4px',
                  color:'var(--color-text-heading)', borderBottom:'1px solid var(--color-border-subtle)'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grades.map(g => (
              <tr key={g.id} style={{
                borderBottom:'1px solid var(--color-divider)',
                opacity: g.is_active ? 1 : 0.5
              }}>
                <td data-label="Grade" style={{padding:'10px 14px'}}>
                  <span style={{
                    fontSize:'18px', fontWeight:'700',
                    color: g.is_pass ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {g.grade_name}
                  </span>
                </td>
                <td data-label="Type" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: g.grade_type === 'ol' ? 'var(--color-tint-success)' : 'var(--color-tint-info)',
                    color: g.grade_type === 'ol' ? 'var(--color-success)' : 'var(--color-info)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {g.grade_type.toUpperCase()}
                  </span>
                </td>
                <td data-label="Description" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>
                  {g.description || '—'}
                </td>
                <td data-label="Pass/Fail" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: g.is_pass ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
                    color: g.is_pass ? 'var(--color-success)' : 'var(--color-danger)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {g.is_pass ? 'Pass' : 'Fail'}
                  </span>
                </td>
                <td data-label="Order" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>
                  {g.display_order}
                </td>
                <td data-label="Status" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: g.is_active ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
                    color: g.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {g.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Action" style={{padding:'10px 14px'}}>
                  {!readOnly && (
                    <button onClick={() => toggleActive(g)} style={{
                      background: g.is_active ? 'var(--color-tint-danger)' : 'var(--color-tint-success)',
                      color: g.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                      border:'none', borderRadius:'4px',
                      padding:'4px 10px', fontSize:'11px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>
                      {g.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop:'16px', padding:'12px 16px',
        background:'var(--color-tint-warning)', border:'1px solid var(--color-warning)',
        borderRadius:'6px', fontSize:'12px', color:'var(--color-warning)'
      }}>
        Note: Deactivating a grade removes it from new entries but
        preserves all existing results that used that grade.
      </div>
    </div>
  );
}
