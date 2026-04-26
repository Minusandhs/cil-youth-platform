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
    color:'var(--color-text-heading)', letterSpacing:'0.3px',
    textTransform:'uppercase', marginBottom:'5px'
  };

  const inputStyle = {
    width:'100%', padding:'9px 11px',
    border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
    fontSize:'13px', color:'var(--color-text-heading)',
    background:'var(--color-bg-page)', outline:'none', fontFamily:'inherit'
  };

  if (loading) return (
    <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>Loading...</div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8">
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>Subject Management</h2>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            Manage OL and AL subject master list
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)} className="w-full md:w-auto" style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ Add Subject'}
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
            Add New Subject
          </h3>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
                style={{width:'16px', height:'16px', accentColor:'var(--color-brand-accent)'}} />
              <label htmlFor="is_core" style={{
                fontSize:'13px', fontWeight:'600', cursor:'pointer'
              }}>
                Core / Mandatory Subject
              </label>
            </div>
            <div className="flex flex-col md:flex-row gap-2.5">
              <button type="submit" className="w-full md:w-auto" style={{
                background:'var(--color-success)', color:'#fff', border:'none',
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

      {/* Subjects Table */}
      <div className="rsp-card-wrap">
        <table className="rsp-card-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'var(--color-bg-stripe)'}}>
              {['Subject Name','Type','Core','Order','Status','Action'].map(h => (
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
            {subjects.map(s => (
              <tr key={s.id} style={{
                borderBottom:'1px solid var(--color-divider)',
                opacity: s.is_active ? 1 : 0.5
              }}>
                <td data-label="Subject" style={{padding:'10px 14px', fontWeight:'600'}}>
                  {s.subject_name}
                </td>
                <td data-label="Type" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: s.subject_type === 'ol' ? 'var(--color-tint-success)' : 'var(--color-tint-info)',
                    color: s.subject_type === 'ol' ? 'var(--color-success)' : 'var(--color-info)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {s.subject_type.toUpperCase()}
                  </span>
                </td>
                <td data-label="Core" style={{padding:'10px 14px'}}>
                  {s.is_core ? (
                    <span style={{
                      background:'var(--color-tint-warning)', color:'var(--color-warning)',
                      padding:'2px 8px', borderRadius:'10px',
                      fontSize:'10px', fontWeight:'700'
                    }}>Core</span>
                  ) : '—'}
                </td>
                <td data-label="Order" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>
                  {s.display_order}
                </td>
                <td data-label="Status" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: s.is_active ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
                    color: s.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Action" style={{padding:'10px 14px'}}>
                  <button onClick={() => toggleActive(s)} style={{
                    background: s.is_active ? 'var(--color-tint-danger)' : 'var(--color-tint-success)',
                    color: s.is_active ? 'var(--color-danger)' : 'var(--color-success)',
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
        background:'var(--color-tint-warning)', border:'1px solid var(--color-warning)',
        borderRadius:'6px', fontSize:'12px', color:'var(--color-warning)'
      }}>
        Note: Deactivating a subject removes it from new entries but
        preserves all existing results that used that subject.
      </div>
    </div>
  );
}