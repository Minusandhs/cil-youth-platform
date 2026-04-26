import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function Certifications({ participantId, readOnly = false }) {
  const [certs,    setCerts   ] = useState([]);
  const [types,    setTypes   ] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCert, setEditCert] = useState(null);
  const [saving,   setSaving  ] = useState(false);
  const [error,    setError   ] = useState('');
  const [success,  setSuccess ] = useState('');
  const [form, setForm] = useState({
    cert_type_id    : '',
    cert_name       : '',
    issuing_body    : '',
    issued_date     : '',
    grade_result    : '',
    nvq_level       : '',
    results_verified: false,
    notes           : ''
  });

  useEffect(() => { loadAll(); }, [participantId]);

  async function loadAll() {
    try {
      const [certsRes, typesRes] = await Promise.all([
        api.get(`/api/certifications/${participantId}`),
        api.get('/api/certifications/types'),
      ]);
      setCerts(certsRes.data);
      setTypes(typesRes.data);
    } catch {
      setError('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditCert(null);
    setForm({
      cert_type_id:'', cert_name:'', issuing_body:'',
      issued_date:'', grade_result:'',
      nvq_level:'', results_verified:false, notes:''
    });
    setShowForm(true);
    setError(''); setSuccess('');
  }

  function openEdit(cert) {
    setEditCert(cert);
    setForm({
      cert_type_id    : cert.cert_type_id      || '',
      cert_name       : cert.cert_name         || '',
      issuing_body    : cert.issuing_body       || '',
      issued_date     : cert.issued_date
                        ? cert.issued_date.split('T')[0] : '',
      grade_result    : cert.grade_result       || '',
      nvq_level       : cert.nvq_level          || '',
      results_verified: cert.results_verified   || false,
      notes           : cert.notes              || ''
    });
    setShowForm(true);
    setError(''); setSuccess('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditCert(null);
    setError(''); setSuccess('');
  }

  // Get selected type to check if it has NVQ level
  const selectedType = types.find(t => t.id === form.cert_type_id);
  const hasNvq = selectedType?.has_nvq_level || false;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const payload = { ...form, participant_id: participantId };
      if (editCert) {
        await api.put(`/api/certifications/${editCert.id}`, payload);
        setSuccess('Certification updated successfully');
      } else {
        await api.post('/api/certifications', payload);
        setSuccess('Certification added successfully');
      }
      setShowForm(false);
      setEditCert(null);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save certification');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cert) {
    const confirm = window.confirm(
      `Delete "${cert.cert_name}"?\n\nThis cannot be undone.`
    );
    if (!confirm) return;
    try {
      await api.delete(`/api/certifications/${cert.id}`);
      setSuccess('Certification deleted');
      loadAll();
    } catch {
      setError('Failed to delete certification');
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

  function formatDate(d) {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-GB');
  }

  function isExpired(expiry) {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  }

  if (loading) return (
    <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>
      Loading certifications...
    </div>
  );

  return (
    <div>
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8">
        <div>
          <h3 style={{fontSize:'16px', fontWeight:'700'}}>
            Certifications & Qualifications
          </h3>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            {certs.length} certification{certs.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {!showForm && !readOnly && (
          <button onClick={openCreate} className="w-full md:w-auto" style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'9px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>+ Add Certification</button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h4 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            {editCert ? 'Edit Certification' : 'Add Certification'}
          </h4>
          <form onSubmit={handleSave}>

            {/* Type & Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label style={labelStyle}>Certificate Type *</label>
                <select style={inputStyle} value={form.cert_type_id}
                  onChange={e => setForm({
                    ...form, cert_type_id:e.target.value, nvq_level:''
                  })} required>
                  <option value="">— Select Type —</option>
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.type_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Certificate / Course Name *</label>
                <input style={inputStyle} value={form.cert_name}
                  onChange={e => setForm({...form, cert_name:e.target.value})}
                  required />
              </div>
            </div>

            {/* Issuing Body & NVQ Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label style={labelStyle}>Issuing Body / Institution *</label>
                <input style={inputStyle} value={form.issuing_body}
                  onChange={e => setForm({...form, issuing_body:e.target.value})}
                  required />
              </div>
              {hasNvq && (
                <div>
                  <label style={labelStyle}>NVQ Level</label>
                  <select style={inputStyle} value={form.nvq_level}
                    onChange={e => setForm({...form, nvq_level:e.target.value})}>
                    <option value="">— Select Level —</option>
                    {[1,2,3,4,5,6,7].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Dates & Grade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label style={labelStyle}>Issue Date *</label>
                <input style={inputStyle} type="date"
                  value={form.issued_date}
                  onChange={e => setForm({...form, issued_date:e.target.value})}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Grade / Result</label>
                <input style={inputStyle} value={form.grade_result}
                  onChange={e => setForm({...form, grade_result:e.target.value})}
                  />
              </div>
            </div>

            {/* Verified + Notes */}
            <div style={{
              display:'flex', alignItems:'center',
              gap:'10px', marginBottom:'14px'
            }}>
              <input type="checkbox" id="cert_verified"
                checked={form.results_verified}
                onChange={e => setForm({...form, results_verified:e.target.checked})}
                style={{width:'16px', height:'16px', accentColor:'var(--color-brand-accent)'}} />
              <label htmlFor="cert_verified" style={{
                fontSize:'13px', fontWeight:'600', cursor:'pointer'
              }}>Certificate Verified</label>
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={labelStyle}>Notes</label>
              <textarea style={{...inputStyle, minHeight:'60px'}}
                value={form.notes}
                onChange={e => setForm({...form, notes:e.target.value})} />
            </div>

            {/* Buttons */}
            <div className="flex flex-col md:flex-row gap-2.5">
              <button type="submit" disabled={saving} className="w-full md:w-auto" style={{
                background: saving ? 'var(--color-border-subtle)' : 'var(--color-success)',
                color:'#fff', border:'none', borderRadius:'6px',
                padding:'10px 24px', fontSize:'13px', fontWeight:'700',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily:'inherit'
              }}>
                {saving ? 'Saving...' : editCert ? 'Save Changes' : 'Add Certification'}
              </button>
              <button type="button" onClick={cancelForm} className="w-full md:w-auto" style={{
                background:'transparent', color:'var(--color-text-subdued)',
                border:'1px solid var(--color-border-subtle)', borderRadius:'6px',
                padding:'10px 20px', fontSize:'13px',
                cursor:'pointer', fontFamily:'inherit'
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Certifications Cards */}
      {certs.length === 0 && !showForm ? (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>🎓</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No Certifications Yet
          </div>
          <div style={{color:'var(--color-text-subdued)', fontSize:'13px'}}>
            Click "+ Add Certification" to record qualifications.
          </div>
        </div>
      ) : (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))',
          gap:'16px'
        }}>
          {certs.map(cert => (
            <div key={cert.id} style={{
              background:'var(--color-bg-card)',
              border:`1px solid ${isExpired(cert.expiry_date) ? 'var(--color-danger)' : 'var(--color-border-subtle)'}`,
              borderRadius:'8px', padding:'16px',
              position:'relative'
            }}>
              {/* Type Badge */}
              <div style={{
                display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', marginBottom:'8px'
              }}>
                <span style={{
                  background:'var(--color-tint-info)', color:'var(--color-info)',
                  padding:'2px 8px', borderRadius:'10px',
                  fontSize:'10px', fontWeight:'700'
                }}>
                  {cert.type_name}
                  {cert.nvq_level && ` · NVQ Level ${cert.nvq_level}`}
                </span>
                {cert.results_verified && (
                  <span style={{
                    background:'var(--color-tint-success)', color:'var(--color-success)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>✓ Verified</span>
                )}
              </div>

              {/* Name */}
              <div style={{
                fontSize:'14px', fontWeight:'700',
                marginBottom:'4px', color:'var(--color-text-heading)'
              }}>
                {cert.cert_name}
              </div>

              {/* Issuing Body */}
              {cert.issuing_body && (
                <div style={{
                  fontSize:'12px', color:'var(--color-text-subdued)', marginBottom:'8px'
                }}>
                  {cert.issuing_body}
                </div>
              )}

              {/* Dates & Grade */}
              <div style={{
                display:'flex', gap:'12px', flexWrap:'wrap',
                marginBottom:'12px'
              }}>
                {cert.issued_date && (
                  <div style={{fontSize:'11px', color:'var(--color-text-muted)'}}>
                    Issued: <strong style={{color:'var(--color-text-heading)'}}>
                      {formatDate(cert.issued_date)}
                    </strong>
                  </div>
                )}
                {cert.expiry_date && (
                  <div style={{fontSize:'11px',
                    color: isExpired(cert.expiry_date) ? 'var(--color-danger)' : 'var(--color-text-muted)'
                  }}>
                    Expires: <strong>{formatDate(cert.expiry_date)}</strong>
                    {isExpired(cert.expiry_date) && ' (Expired)'}
                  </div>
                )}
                {cert.grade_result && (
                  <div style={{fontSize:'11px', color:'var(--color-text-muted)'}}>
                    Grade: <strong style={{color:'var(--color-success)'}}>
                      {cert.grade_result}
                    </strong>
                  </div>
                )}
              </div>

              {/* Notes */}
              {cert.notes && (
                <div style={{
                  fontSize:'11px', color:'var(--color-text-subdued)',
                  fontStyle:'italic', marginBottom:'12px'
                }}>
                  {cert.notes}
                </div>
              )}

              {/* Actions */}
              {!readOnly && (
                <div style={{display:'flex', gap:'8px'}}>
                  <button onClick={() => openEdit(cert)} style={{
                    background:'var(--color-tint-info)', color:'var(--color-info)', border:'none',
                    borderRadius:'4px', padding:'5px 12px', fontSize:'11px',
                    fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                  }}>Edit</button>
                  <button onClick={() => handleDelete(cert)} style={{
                    background:'var(--color-tint-danger)', color:'var(--color-danger)', border:'none',
                    borderRadius:'4px', padding:'5px 12px', fontSize:'11px',
                    fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                  }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}