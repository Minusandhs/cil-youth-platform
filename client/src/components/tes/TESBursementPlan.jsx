import { useState, useEffect } from 'react';
import api from '../../lib/api';

const STATUS_META = {
  planned   : { bg:'var(--color-tint-info)',    color:'var(--color-info)',    label:'Planned'    },
  disbursed : { bg:'var(--color-tint-success)', color:'var(--color-success)', label:'Disbursed'  },
  skipped   : { bg:'var(--color-bg-stripe)',    color:'var(--color-text-muted)', label:'Skipped' },
};

function fmt(n) {
  if (n == null || n === '') return '—';
  return `LKR ${parseFloat(n).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB');
}

const card = {
  background:'var(--color-bg-card)',
  border:'1px solid var(--color-border-subtle)',
  borderRadius:'8px', padding:'20px',
  boxShadow:'0 2px 8px rgba(26,22,16,0.06)',
  marginBottom:'20px',
};
const sectionTitle = {
  fontSize:'14px', fontWeight:'700',
  marginBottom:'16px', paddingBottom:'10px',
  borderBottom:'1px solid var(--color-divider)',
  color:'var(--color-text-heading)',
};
const labelStyle = {
  display:'block', fontSize:'11px', fontWeight:'700',
  color:'var(--color-text-heading)', letterSpacing:'0.3px',
  textTransform:'uppercase', marginBottom:'5px',
};
const inputStyle = {
  width:'100%', padding:'9px 11px',
  border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
  fontSize:'13px', color:'var(--color-text-heading)',
  background:'var(--color-bg-page)', outline:'none', fontFamily:'inherit',
};

export default function TESBursementPlan({ application, batch, readOnly, onBack }) {
  const [tranches,    setTranches   ] = useState([]);
  const [loading,     setLoading    ] = useState(true);
  const [error,       setError      ] = useState('');
  const [success,     setSuccess    ] = useState('');
  const [saving,      setSaving     ] = useState(false);
  const [expandPay,   setExpandPay  ] = useState(null); // tranche id with inline pay form open
  const [payForm,     setPayForm    ] = useState({});   // { [trancheId]: { disbursed_amount, disbursed_date } }
  const [form, setForm] = useState({
    label:'', planned_amount:'', planned_date:'', notes:''
  });

  useEffect(() => { loadTranches(); }, []);

  async function loadTranches() {
    try {
      const res = await api.get(`/api/tes/applications/${application.id}/disbursement`);
      setTranches(res.data);
    } catch {
      setError('Failed to load disbursement plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.planned_amount || parseFloat(form.planned_amount) <= 0) {
      return setError('Planned amount must be greater than 0');
    }
    if (!form.planned_date) return setError('Planned date is required');

    const newTotal = totalPlanned + parseFloat(form.planned_amount);
    if (application.amount_approved != null && newTotal > parseFloat(application.amount_approved)) {
      return setError(
        `Total planned (${fmt(newTotal)}) would exceed the approved amount (${fmt(application.amount_approved)})`
      );
    }
    setSaving(true);
    try {
      await api.post(`/api/tes/applications/${application.id}/disbursement`, {
        label:          form.label || null,
        planned_amount: parseFloat(form.planned_amount),
        planned_date:   form.planned_date,
        notes:          form.notes || null,
      });
      setForm({ label:'', planned_amount:'', planned_date:'', notes:'' });
      setSuccess('Installment added');
      loadTranches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add installment');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(trancheId) {
    setError(''); setSuccess('');
    const pf = payForm[trancheId] || {};
    const tranche = tranches.find(t => t.id === trancheId);
    const disbursed_amount = pf.disbursed_amount !== undefined ? pf.disbursed_amount : tranche?.planned_amount;
    if (!pf.disbursed_date) return setError('Disbursed date is required');
    setSaving(true);
    try {
      await api.patch(`/api/tes/disbursement/${trancheId}`, {
        status:           'disbursed',
        disbursed_amount: parseFloat(disbursed_amount),
        disbursed_date:   pf.disbursed_date,
      });
      setExpandPay(null);
      setSuccess('Installment marked as paid');
      loadTranches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as paid');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip(trancheId) {
    if (!window.confirm('Mark this installment as skipped?')) return;
    setError('');
    try {
      await api.patch(`/api/tes/disbursement/${trancheId}`, { status: 'skipped' });
      setSuccess('Installment marked as skipped');
      loadTranches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update installment');
    }
  }

  async function handleDelete(trancheId) {
    if (!window.confirm('Delete this installment? This cannot be undone.')) return;
    setError('');
    try {
      await api.delete(`/api/tes/disbursement/${trancheId}`);
      setSuccess('Installment deleted');
      loadTranches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete installment');
    }
  }

  const totalPlanned    = tranches.reduce((s, t) => s + parseFloat(t.planned_amount || 0), 0);
  const totalDisbursed  = tranches.filter(t => t.status === 'disbursed')
                                  .reduce((s, t) => s + parseFloat(t.disbursed_amount || t.planned_amount || 0), 0);
  const approved        = parseFloat(application.amount_approved || 0);
  const remaining       = approved - totalPlanned;

  return (
    <div>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'flex-start',
        gap:'12px', marginBottom:'20px', flexWrap:'wrap'
      }}>
        <button onClick={onBack} style={{
          background:'transparent', border:'1px solid var(--color-border-subtle)',
          color:'var(--color-text-subdued)', padding:'6px 14px', borderRadius:'5px',
          fontSize:'12px', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
          marginTop:'2px'
        }}>← Back</button>
        <div>
          <div style={{fontSize:'17px', fontWeight:'700', color:'var(--color-text-heading)'}}>
            Disbursement Plan
          </div>
          <div style={{fontSize:'12px', color:'var(--color-text-subdued)', marginTop:'3px'}}>
            {application.full_name}
            {application.pid ? ` · ${application.pid}` : ''}
            {application.course_name ? ` · ${application.course_name}` : ''}
          </div>
          <div style={{fontSize:'11px', color:'var(--color-text-muted)', marginTop:'2px'}}>
            Batch: {batch.batch_name}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px',
        marginBottom:'20px'
      }} className="rsp-grid-3">
        {[
          { label:'Approved',        value: fmt(application.amount_approved), color:'var(--color-text-heading)' },
          { label:'Total Planned',   value: fmt(totalPlanned),   color: remaining < 0 ? 'var(--color-danger)' : 'var(--color-info)' },
          { label:'Total Disbursed', value: fmt(totalDisbursed), color:'var(--color-success)' },
        ].map(s => (
          <div key={s.label} style={{
            background:'var(--color-bg-card)',
            border:'1px solid var(--color-border-subtle)',
            borderRadius:'8px', padding:'14px 16px', textAlign:'center'
          }}>
            <div style={{fontSize:'16px', fontWeight:'700', color:s.color}}>{s.value}</div>
            <div style={{fontSize:'10px', fontWeight:'700', textTransform:'uppercase',
              letterSpacing:'0.4px', color:'var(--color-text-muted)', marginTop:'4px'}}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <div style={{
          fontSize:'12px', color:'var(--color-text-muted)',
          marginBottom:'16px', textAlign:'center'
        }}>
          {fmt(remaining)} remaining to plan
        </div>
      )}

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

      {/* Add Installment Form */}
      {!readOnly && (
        <div style={card}>
          <div style={sectionTitle}>Add Installment</div>
          <form onSubmit={handleAdd}>
            <div className="rsp-grid-3" style={{
              display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px', marginBottom:'16px'
            }}>
              <div>
                <label style={labelStyle}>Label</label>
                <input
                  type="text"
                  placeholder="e.g. Year 1, Semester 2"
                  value={form.label}
                  onChange={e => setForm(f => ({...f, label: e.target.value}))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Amount (LKR) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.planned_amount}
                  onChange={e => setForm(f => ({...f, planned_amount: e.target.value}))}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Planned Date *</label>
                <input
                  type="date"
                  value={form.planned_date}
                  onChange={e => setForm(f => ({...f, planned_date: e.target.value}))}
                  style={inputStyle}
                  required
                />
              </div>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={labelStyle}>Notes</label>
              <input
                type="text"
                placeholder="Optional notes"
                value={form.notes}
                onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                style={inputStyle}
              />
            </div>
            <div className="rsp-submit-row" style={{display:'flex', gap:'12px'}}>
              <button type="submit" disabled={saving} style={{
                background:'var(--color-brand-primary)', color:'var(--color-brand-accent)',
                border:'none', borderRadius:'6px', padding:'10px 24px',
                fontSize:'13px', fontWeight:'700', cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', opacity: saving ? 0.7 : 1
              }}>
                {saving ? 'Adding...' : '+ Add Installment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tranches Table */}
      <div style={card}>
        <div style={sectionTitle}>Installment Schedule</div>
        {loading ? (
          <div style={{padding:'20px', color:'var(--color-text-subdued)'}}>Loading...</div>
        ) : tranches.length === 0 ? (
          <div style={{
            padding:'32px', textAlign:'center',
            color:'var(--color-text-muted)', fontSize:'13px'
          }}>
            No installments added yet.
            {!readOnly && ' Use the form above to add the first installment.'}
          </div>
        ) : (
          <div className="rsp-table-wrap">
            <table className="rsp-card-table" style={{
              width:'100%', borderCollapse:'collapse', fontSize:'13px'
            }}>
              <thead>
                <tr style={{background:'var(--color-bg-stripe)'}}>
                  {['#','Label','Planned Amount','Planned Date','Status','Disbursed Amount','Disbursed Date','Action'].map(h => (
                    <th key={h} style={{
                      padding:'10px 14px', textAlign:'left',
                      fontSize:'10.5px', fontWeight:'700',
                      textTransform:'uppercase', letterSpacing:'0.4px',
                      color:'var(--color-text-heading)',
                      borderBottom:'1px solid var(--color-border-subtle)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tranches.map(t => {
                  const sm = STATUS_META[t.status] || STATUS_META.planned;
                  const isExpanded = expandPay === t.id;
                  const pf = payForm[t.id] || {};
                  return (
                    <tr key={t.id} style={{borderBottom:'1px solid var(--color-divider)'}}>
                      <td data-label="#" style={{padding:'10px 14px', color:'var(--color-text-muted)', fontSize:'12px'}}>
                        {t.tranche_number}
                      </td>
                      <td data-label="Label" style={{padding:'10px 14px', fontWeight:'600'}}>
                        {t.label || <span style={{color:'var(--color-text-muted)'}}>—</span>}
                      </td>
                      <td data-label="Planned Amount" style={{padding:'10px 14px', fontWeight:'600', color:'var(--color-text-heading)'}}>
                        {fmt(t.planned_amount)}
                      </td>
                      <td data-label="Planned Date" style={{padding:'10px 14px', color:'var(--color-text-subdued)', fontSize:'12px'}}>
                        {fmtDate(t.planned_date)}
                      </td>
                      <td data-label="Status" style={{padding:'10px 14px'}}>
                        <span style={{
                          background:sm.bg, color:sm.color,
                          padding:'2px 8px', borderRadius:'8px',
                          fontSize:'10px', fontWeight:'700'
                        }}>{sm.label}</span>
                      </td>
                      <td data-label="Disbursed Amount" style={{
                        padding:'10px 14px', fontWeight:'600',
                        color: t.disbursed_amount ? 'var(--color-success)' : 'var(--color-text-muted)'
                      }}>
                        {t.disbursed_amount ? fmt(t.disbursed_amount) : '—'}
                      </td>
                      <td data-label="Disbursed Date" style={{padding:'10px 14px', color:'var(--color-text-subdued)', fontSize:'12px'}}>
                        {fmtDate(t.disbursed_date)}
                      </td>
                      <td data-label="Action" style={{padding:'10px 14px'}}>
                        {!readOnly && t.status === 'planned' && (
                          <div style={{display:'flex', flexDirection:'column', gap:'4px', minWidth:'90px'}}>
                            <button
                              onClick={() => {
                                setExpandPay(isExpanded ? null : t.id);
                                setPayForm(prev => ({
                                  ...prev,
                                  [t.id]: { disbursed_amount: t.planned_amount, disbursed_date: '' }
                                }));
                              }}
                              style={{
                                background:'var(--color-brand-primary)', color:'var(--color-brand-accent)',
                                border:'none', borderRadius:'4px', padding:'5px 10px',
                                fontSize:'11px', fontWeight:'700', cursor:'pointer',
                                fontFamily:'inherit', width:'100%'
                              }}
                            >
                              {isExpanded ? 'Cancel' : 'Mark Paid'}
                            </button>
                            <button onClick={() => handleSkip(t.id)} style={{
                              background:'var(--color-bg-stripe)', color:'var(--color-text-subdued)',
                              border:'1px solid var(--color-border-subtle)',
                              borderRadius:'4px', padding:'5px 10px',
                              fontSize:'11px', fontWeight:'600', cursor:'pointer',
                              fontFamily:'inherit', width:'100%'
                            }}>Skip</button>
                            <button onClick={() => handleDelete(t.id)} style={{
                              background:'var(--color-tint-danger)', color:'var(--color-danger)',
                              border:'none', borderRadius:'4px', padding:'5px 10px',
                              fontSize:'11px', fontWeight:'600', cursor:'pointer',
                              fontFamily:'inherit', width:'100%'
                            }}>Delete</button>

                            {/* Inline pay form */}
                            {isExpanded && (
                              <div style={{
                                marginTop:'8px', padding:'12px',
                                background:'var(--color-bg-highlight)',
                                border:'1px solid var(--color-border-subtle)',
                                borderRadius:'6px'
                              }}>
                                <div style={{marginBottom:'8px'}}>
                                  <label style={{...labelStyle, marginBottom:'3px'}}>Actual Amount</label>
                                  <input
                                    type="number" min="0" step="0.01"
                                    value={pf.disbursed_amount ?? t.planned_amount}
                                    onChange={e => setPayForm(prev => ({
                                      ...prev, [t.id]: {...prev[t.id], disbursed_amount: e.target.value}
                                    }))}
                                    style={{...inputStyle, fontSize:'12px', padding:'6px 9px'}}
                                  />
                                </div>
                                <div style={{marginBottom:'10px'}}>
                                  <label style={{...labelStyle, marginBottom:'3px'}}>Disbursed Date *</label>
                                  <input
                                    type="date"
                                    value={pf.disbursed_date || ''}
                                    onChange={e => setPayForm(prev => ({
                                      ...prev, [t.id]: {...prev[t.id], disbursed_date: e.target.value}
                                    }))}
                                    style={{...inputStyle, fontSize:'12px', padding:'6px 9px'}}
                                  />
                                </div>
                                <button
                                  onClick={() => handleMarkPaid(t.id)}
                                  disabled={saving}
                                  style={{
                                    background:'var(--color-success)', color:'#fff',
                                    border:'none', borderRadius:'4px', padding:'6px 12px',
                                    fontSize:'11px', fontWeight:'700', cursor: saving ? 'not-allowed' : 'pointer',
                                    fontFamily:'inherit', width:'100%',
                                    opacity: saving ? 0.7 : 1
                                  }}
                                >
                                  {saving ? 'Saving...' : 'Confirm Payment'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {(readOnly || t.status !== 'planned') && (
                          <span style={{color:'var(--color-text-muted)', fontSize:'11px'}}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
