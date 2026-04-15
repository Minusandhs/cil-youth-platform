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
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>
            Certificate Type Management
          </h2>
          <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
            Manage certification category master list
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background:'#1a1610', color:'#c49a3c', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ Add Type'}
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
                  style={{width:'16px', height:'16px', accentColor:'#c49a3c'}} />
                <label htmlFor="has_nvq" style={{
                  fontSize:'13px', fontWeight:'600', cursor:'pointer'
                }}>
                  Has NVQ Level
                </label>
              </div>
            </div>
            <div className="rsp-submit-row" style={{display:'flex'}}>
              <button type="submit" style={{
                background:'#2d6a4f', color:'#fff', border:'none',
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
            <tr style={{background:'#f0ece2'}}>
              {['Type Name','NVQ Level','Order','Status','Action'].map(h => (
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
            {types.map(t => (
              <tr key={t.id} style={{
                borderBottom:'1px solid #e8e0d0',
                opacity: t.is_active ? 1 : 0.5
              }}>
                <td data-label="Type" style={{padding:'10px 14px', fontWeight:'600'}}>
                  {t.type_name}
                </td>
                <td data-label="NVQ Level" style={{padding:'10px 14px'}}>
                  {t.has_nvq_level ? (
                    <span style={{
                      background:'#f5edd8', color:'#b85c00',
                      padding:'2px 8px', borderRadius:'10px',
                      fontSize:'10px', fontWeight:'700'
                    }}>Yes</span>
                  ) : '—'}
                </td>
                <td data-label="Order" style={{padding:'10px 14px', color:'#6b5e4a'}}>
                  {t.display_order}
                </td>
                <td data-label="Status" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: t.is_active ? '#d8ede4' : '#f5e0e3',
                    color: t.is_active ? '#2d6a4f' : '#9b2335',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Action" style={{padding:'10px 14px'}}>
                  <button onClick={() => toggleActive(t)} style={{
                    background: t.is_active ? '#f5e0e3' : '#d8ede4',
                    color: t.is_active ? '#9b2335' : '#2d6a4f',
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
        background:'#fdecd8', border:'1px solid #b85c00',
        borderRadius:'6px', fontSize:'12px', color:'#b85c00'
      }}>
        Note: Deactivating a type removes it from new entries but
        preserves all existing certifications using that type.
      </div>
    </div>
  );
}