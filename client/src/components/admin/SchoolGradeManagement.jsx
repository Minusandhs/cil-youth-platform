import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function SchoolGradeManagement({ readOnly = false }) {
  const [schoolGrades, setSchoolGrades] = useState([]);
  const [loading,      setLoading     ] = useState(true);
  const [showForm,     setShowForm    ] = useState(false);
  const [error,        setError       ] = useState('');
  const [success,      setSuccess     ] = useState('');
  const [form, setForm] = useState({ grade_label: '', sort_order: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/api/school-grades');
      setSchoolGrades(res.data);
    } catch {
      setError('Failed to load school grade levels');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/school-grades', form);
      setSuccess('School grade level added successfully');
      setShowForm(false);
      setForm({ grade_label: '', sort_order: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add school grade level');
    }
  }

  async function toggleActive(sg) {
    try {
      await api.put(`/api/school-grades/${sg.id}`, {
        grade_label: sg.grade_label,
        sort_order : sg.sort_order,
        is_active  : !sg.is_active
      });
      load();
    } catch {
      setError('Failed to update school grade level');
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
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>School Grade Levels</h2>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            Configurable grade levels shown in Personal Info (Studying — School)
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)} className="w-full md:w-auto" style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ Add Grade Level'}
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

      {showForm && (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'20px', marginBottom:'20px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            Add New Grade Level
          </h3>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label style={labelStyle}>Grade Label *</label>
                <input style={inputStyle} value={form.grade_label}
                  onChange={e => setForm({...form, grade_label: e.target.value})}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Sort Order</label>
                <input style={inputStyle} type="number"
                  value={form.sort_order}
                  onChange={e => setForm({...form, sort_order: e.target.value})}
                  />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2.5">
              <button type="submit" className="w-full md:w-auto" style={{
                background:'var(--color-success)', color:'#fff', border:'none',
                borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>Add Grade Level</button>
            </div>
          </form>
        </div>
      )}

      <div className="rsp-card-wrap">
        <table className="rsp-card-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'var(--color-bg-stripe)'}}>
              {['Grade Label', 'Sort Order', 'Status', 'Action'].map(h => (
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
            {schoolGrades.map(sg => (
              <tr key={sg.id} style={{
                borderBottom:'1px solid var(--color-divider)',
                opacity: sg.is_active ? 1 : 0.5
              }}>
                <td data-label="Grade" style={{padding:'10px 14px', fontWeight:'600'}}>{sg.grade_label}</td>
                <td data-label="Order" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>{sg.sort_order}</td>
                <td data-label="Status" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: sg.is_active ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
                    color: sg.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {sg.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Action" style={{padding:'10px 14px'}}>
                  {!readOnly && (
                    <button onClick={() => toggleActive(sg)} style={{
                      background: sg.is_active ? 'var(--color-tint-danger)' : 'var(--color-tint-success)',
                      color: sg.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                      border:'none', borderRadius:'4px',
                      padding:'4px 10px', fontSize:'11px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>
                      {sg.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {schoolGrades.length === 0 && (
          <div style={{padding:'24px', textAlign:'center', color:'var(--color-text-subdued)', fontSize:'13px'}}>
            No school grade levels defined.
          </div>
        )}
      </div>

      <div style={{
        marginTop:'16px', padding:'12px 16px',
        background:'var(--color-tint-warning)', border:'1px solid var(--color-warning)',
        borderRadius:'6px', fontSize:'12px', color:'var(--color-warning)'
      }}>
        Note: Deactivating a grade level removes it from the dropdown in Personal Info
        but preserves any existing records that used that grade.
      </div>
    </div>
  );
}
