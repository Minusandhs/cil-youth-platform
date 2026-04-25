import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function CertTypeManagement({ readOnly = false }) {
  const [types,    setTypes   ] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError   ] = useState('');
  const [success,  setSuccess ] = useState('');
  const [form, setForm] = useState({
    type_name: '', has_nvq_level: false, display_order: 0
  });

  useEffect(() => { loadTypes(); }, []);

  async function loadTypes() {
    try {
      const res = await api.get('/api/certifications/types/all');
      setTypes(res.data);
    } catch {
      setError('Failed to load certificate types');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/certifications/types', form);
      setSuccess('Certificate type added successfully');
      setShowForm(false);
      setForm({ type_name:'', has_nvq_level:false, display_order:0 });
      loadTypes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add type');
    }
  }

  async function toggleActive(type) {
    try {
      await api.put(`/api/certifications/types/${type.id}`, {
        type_name    : type.type_name,
        has_nvq_level: type.has_nvq_level,
        is_active    : !type.is_active,
        display_order: type.display_order
      });
      loadTypes();
    } catch {
      setError('Failed to update type');
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
      <div className="rsp-section-header" style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px'
      }}>
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>
            Certificate Type Management
          </h2>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            Manage certification category master list
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ Add Type'}
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
            Add New Certificate Type
          </h3>
          <form onSubmit={handleCreate}>
            <div className="rsp-grid-3" style={{
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
              gap:'14px', marginBottom:'14px'
            }}>
              <div>
                <label style={labelStyle}>Type Name</label>
                <input style={inputStyle} value={form.type_name}
                  onChange={e => setForm({...form, type_name:e.target.value})}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Display Order</label>
                <input style={inputStyle} type="number"
                  value={form.display_order}
                  onChange={e => setForm({...form, display_order:e.target.value})} />
              </div>
              <div style={{
                display:'flex', alignItems:'center',
                gap:'10px', paddingTop:'20px'
              }}>
                <input type="checkbox" id="has_nvq"
                  checked={form.has_nvq_level}
                  onChange={e => setForm({...form, has_nvq_level:e.target.checked})}
                  style={{width:'16px', height:'16px', accentColor:'var(--color-brand-accent)'}} />
                <label htmlFor="has_nvq" style={{
                  fontSize:'13px', fontWeight:'600', cursor:'pointer'
                }}>
                  Has NVQ Level
                </label>
              </div>
            </div>
            <div className="rsp-submit-row" style={{display:'flex'}}>
              <button type="submit" style={{
                background:'var(--color-success)', color:'#fff', border:'none',
                borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>
                Add Type
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Types Table */}
      <div className="rsp-card-wrap">
        <table className="rsp-card-table" style={{
          width:'100%', borderCollapse:'collapse', fontSize:'13px'
        }}>
          <thead>
            <tr style={{background:'var(--color-bg-stripe)'}}>
              {['Type Name','NVQ Level','Order','Status','Action'].map(h => (
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
            {types.map(t => (
              <tr key={t.id} style={{
                borderBottom:'1px solid var(--color-divider)',
                opacity: t.is_active ? 1 : 0.5
              }}>
                <td data-label="Type" style={{padding:'10px 14px', fontWeight:'600'}}>
                  {t.type_name}
                </td>
                <td data-label="NVQ Level" style={{padding:'10px 14px'}}>
                  {t.has_nvq_level ? (
                    <span style={{
                      background:'var(--color-tint-warning)', color:'var(--color-warning)',
                      padding:'2px 8px', borderRadius:'10px',
                      fontSize:'10px', fontWeight:'700'
                    }}>Yes</span>
                  ) : '—'}
                </td>
                <td data-label="Order" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>
                  {t.display_order}
                </td>
                <td data-label="Status" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: t.is_active ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
                    color: t.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Action" style={{padding:'10px 14px'}}>
                  <button onClick={() => toggleActive(t)} style={{
                    background: t.is_active ? 'var(--color-tint-danger)' : 'var(--color-tint-success)',
                    color: t.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                    border:'none', borderRadius:'4px',
                    padding:'4px 10px', fontSize:'11px',
                    fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                  }}>
                    {t.is_active ? 'Deactivate' : 'Activate'}
                  </button>
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
        Note: Deactivating a type removes it from new entries but
        preserves all existing certifications using that type.
      </div>
    </div>
  );
}