import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function LDCManagement({ readOnly = false }) {
  const [ldcs,     setLdcs    ] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editLDC,  setEditLDC ] = useState(null);
  const [error,    setError   ] = useState('');
  const [success,  setSuccess ] = useState('');
  const [form, setForm] = useState({
    ldc_id:'', name:'', region:'', church_partner:'', address:''
  });

  useEffect(() => { loadLDCs(); }, []);

  async function loadLDCs() {
    try {
      const res = await api.get('/api/ldcs');
      setLdcs(res.data);
    } catch {
      setError('Failed to load LDCs');
    } finally {
      setLoading(false);
    }
  }

  function openEdit(ldc) {
    setEditLDC(ldc);
    setForm({
      ldc_id        : ldc.ldc_id,
      name          : ldc.name,
      region        : ldc.region        || '',
      church_partner: ldc.church_partner || '',
      address       : ldc.address       || ''
    });
    setShowForm(true);
    setError(''); setSuccess('');
  }

  function openCreate() {
    setEditLDC(null);
    setForm({ ldc_id:'', name:'', region:'', church_partner:'', address:'' });
    setShowForm(true);
    setError(''); setSuccess('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditLDC(null);
    setForm({ ldc_id:'', name:'', region:'', church_partner:'', address:'' });
    setError(''); setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editLDC) {
        await api.put(`/api/ldcs/${editLDC.id}`, {
          ...form, is_active: editLDC.is_active
        });
        setSuccess('LDC updated successfully');
      } else {
        await api.post('/api/ldcs', form);
        setSuccess('LDC created successfully');
      }
      setShowForm(false);
      setEditLDC(null);
      setForm({ ldc_id:'', name:'', region:'', church_partner:'', address:'' });
      loadLDCs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save LDC');
    }
  }

  async function handleDelete(ldc) {
    const confirm = window.confirm(
      `Are you sure you want to deactivate "${ldc.name}"?\n\nThis will prevent new data entry for this LDC but existing data will be preserved.`
    );
    if (!confirm) return;
    try {
      await api.put(`/api/ldcs/${ldc.id}`, {
        name          : ldc.name,
        region        : ldc.region,
        church_partner: ldc.church_partner,
        address       : ldc.address,
        is_active     : false
      });
      setSuccess(`${ldc.name} has been deactivated`);
      loadLDCs();
    } catch {
      setError('Failed to deactivate LDC');
    }
  }

  async function handleReactivate(ldc) {
    try {
      await api.put(`/api/ldcs/${ldc.id}`, {
        name          : ldc.name,
        region        : ldc.region,
        church_partner: ldc.church_partner,
        address       : ldc.address,
        is_active     : true
      });
      setSuccess(`${ldc.name} has been reactivated`);
      loadLDCs();
    } catch {
      setError('Failed to reactivate LDC');
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
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>LDC Management</h2>
          <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
            Manage Local Development Centres
          </p>
        </div>
        {!readOnly && (
          <button onClick={openCreate} style={{
            background:'#1a1610', color:'#c49a3c', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            + New LDC
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

      {/* Create / Edit Form */}
      {showForm && (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            {editLDC ? `Edit LDC — ${editLDC.ldc_id}` : 'Add New LDC'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
            }}>
              <div>
                <label style={labelStyle}>LDC ID</label>
                <input style={{
                  ...inputStyle,
                  background: editLDC ? '#f0ece2' : '#faf8f3',
                  color: editLDC ? '#a09080' : '#1a1610'
                }}
                value={form.ldc_id}
                onChange={e => setForm({...form, ldc_id:e.target.value})}
                readOnly={!!editLDC}
                required />
                {editLDC && (
                  <div style={{fontSize:'11px', color:'#a09080', marginTop:'3px'}}>
                    LDC ID cannot be changed
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>LDC Name</label>
                <input style={inputStyle} value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Region</label>
                <input style={inputStyle} value={form.region}
                  onChange={e => setForm({...form, region:e.target.value})}
                  />
              </div>
              <div>
                <label style={labelStyle}>Church Partner</label>
                <input style={inputStyle} value={form.church_partner}
                  onChange={e => setForm({...form, church_partner:e.target.value})}
                  />
              </div>
              <div style={{gridColumn:'1/-1'}}>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={form.address}
                  onChange={e => setForm({...form, address:e.target.value})}
                  />
              </div>
            </div>
            <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
              <button type="submit" style={{
                background:'#2d6a4f', color:'#fff', border:'none',
                borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>
                {editLDC ? 'Save Changes' : 'Create LDC'}
              </button>
              <button type="button" onClick={cancelForm} style={{
                background:'transparent', color:'#6b5e4a',
                border:'1px solid #d4c9b0', borderRadius:'6px',
                padding:'10px 24px', fontSize:'13px',
                cursor:'pointer', fontFamily:'inherit'
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LDCs Table */}
      <div className="rsp-card-wrap">
        <table className="rsp-card-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#f0ece2'}}>
              {['LDC ID','Name','Region','Church Partner','Status','Actions'].map(h => (
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
            {ldcs.map(l => (
              <tr key={l.id} style={{
                borderBottom:'1px solid #e8e0d0',
                opacity: l.is_active ? 1 : 0.6
              }}>
                <td data-label="LDC ID" style={{padding:'10px 14px', fontWeight:'700', color:'#c49a3c'}}>
                  {l.ldc_id}
                </td>
                <td data-label="Name" style={{padding:'10px 14px', fontWeight:'600'}}>{l.name}</td>
                <td data-label="Region" style={{padding:'10px 14px', color:'#6b5e4a'}}>{l.region || '—'}</td>
                <td data-label="Church" style={{padding:'10px 14px', color:'#6b5e4a'}}>{l.church_partner || '—'}</td>
                <td data-label="Status" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: l.is_active ? '#d8ede4' : '#f5e0e3',
                    color: l.is_active ? '#2d6a4f' : '#9b2335',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {l.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td data-label="Actions" style={{padding:'10px 14px'}}>
                  {readOnly ? (
                    <span style={{color:'#a09080', fontSize:'11px'}}>View only</span>
                  ) : (
                    <div style={{display:'flex', gap:'6px'}}>
                      <button onClick={() => openEdit(l)} style={{
                        background:'#dce9f5', color:'#1a4068',
                        border:'none', borderRadius:'4px',
                        padding:'4px 10px', fontSize:'11px',
                        fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                      }}>Edit</button>
                      {l.is_active ? (
                        <button onClick={() => handleDelete(l)} style={{
                          background:'#f5e0e3', color:'#9b2335',
                          border:'none', borderRadius:'4px',
                          padding:'4px 10px', fontSize:'11px',
                          fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                        }}>Deactivate</button>
                      ) : (
                        <button onClick={() => handleReactivate(l)} style={{
                          background:'#d8ede4', color:'#2d6a4f',
                          border:'none', borderRadius:'4px',
                          padding:'4px 10px', fontSize:'11px',
                          fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                        }}>Reactivate</button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ldcs.length === 0 && (
          <div style={{padding:'32px', textAlign:'center', color:'#6b5e4a'}}>
            No LDCs found. Add your first LDC centre.
          </div>
        )}
      </div>

      {/* Note about deletion */}
      <div style={{
        marginTop:'16px', padding:'12px 16px',
        background:'#fdecd8', border:'1px solid #b85c00',
        borderRadius:'6px', fontSize:'12px', color:'#b85c00'
      }}>
        Note: LDCs are deactivated rather than permanently deleted to preserve
        historical participant and application data.
      </div>
    </div>
  );
}