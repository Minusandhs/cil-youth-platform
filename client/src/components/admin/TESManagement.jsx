import { useState, useEffect } from 'react';
import api from '../../lib/api';
import TESBatchDetail from '../tes/TESBatchDetail';

export default function TESManagement({ readOnly = false }) {
  const [batches,    setBatches   ] = useState([]);
  const [loading,    setLoading   ] = useState(true);
  const [showForm,   setShowForm  ] = useState(false);
  const [selBatch,   setSelBatch  ] = useState(null);
  const [error,      setError     ] = useState('');
  const [success,    setSuccess   ] = useState('');
  const [showOld,    setShowOld   ] = useState(false);
  const [form, setForm] = useState({
    batch_name:'', application_end_date:'', update_notes:''
  });
  const [editBatch, setEditBatch] = useState(null);

  useEffect(() => { loadBatches(); }, []);

  async function loadBatches() {
    try {
      const res = await api.get('/api/tes/batches');
      setBatches(res.data);
    } catch {
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/tes/batches', form);
      setSuccess('Batch created successfully');
      setShowForm(false);
      setForm({ batch_name:'', application_end_date:'', update_notes:'' });
      loadBatches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create batch');
    }
  }

  function openEdit(batch) {
    setEditBatch(batch);
    setForm({
      batch_name          : batch.batch_name,
      application_end_date: batch.application_end_date
                            ? batch.application_end_date.split('T')[0] : '',
      update_notes        : batch.update_notes || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleEdit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.put(`/api/tes/batches/${editBatch.id}`, {
        ...editBatch,
        batch_name          : form.batch_name,
        application_end_date: form.application_end_date,
        update_notes        : form.update_notes
      });
      setSuccess('Batch updated successfully');
      setShowForm(false);
      setEditBatch(null);
      setForm({ batch_name:'', application_end_date:'', update_notes:'' });
      loadBatches();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update batch');
    }
  }

  function statusBadge(status) {
    const map = {
      open      : { bg:'var(--color-tint-success)', color:'var(--color-success)', label:'Open'      },
      closed    : { bg:'var(--color-bg-stripe)', color:'var(--color-text-subdued)', label:'Closed'    },
      funded    : { bg:'var(--color-tint-warning)', color:'var(--color-warning)', label:'Funded'    },
      completed : { bg:'var(--color-brand-primary)', color:'var(--color-brand-accent)', label:'Completed' },
      rejected  : { bg:'var(--color-tint-danger)', color:'var(--color-danger)', label:'Rejected'  },
    };
    const s = map[status] || map.closed;
    return (
      <span style={{
        background:s.bg, color:s.color,
        padding:'2px 10px', borderRadius:'10px',
        fontSize:'11px', fontWeight:'700'
      }}>{s.label}</span>
    );
  }

  function isDeadlinePassed(date) {
    return date && new Date(date) < new Date();
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

  // Active = open, closed, funded
  // Old = completed, rejected
  const activeBatches = batches.filter(b =>
    ['open','closed','funded'].includes(b.status)
  );
  const oldBatches = batches.filter(b =>
    ['completed','rejected'].includes(b.status)
  );
  const visibleBatches = showOld ? batches : activeBatches;

  if (loading) return (
    <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>Loading...</div>
  );

  if (selBatch) {
    return (
      <TESBatchDetail
        batch={selBatch}
        onBack={() => { setSelBatch(null); loadBatches(); }}
        onBatchUpdate={updated => setBatches(prev =>
          prev.map(b => b.id === updated.id ? updated : b)
        )}
        isAdmin={true}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8">
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>
            TES Batch Management
          </h2>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            Manage Tertiary Education Scholarship batches
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => {
            setShowForm(!showForm);
            setEditBatch(null);
            setForm({ batch_name:'', application_end_date:'', update_notes:'' });
          }} className="w-full md:w-auto" style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ New Batch'}
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

      {/* Create Form */}
      {showForm && (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            {editBatch ? 'Edit Batch' : 'Create New Batch'}
          </h3>
          <form onSubmit={editBatch ? handleEdit : handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label style={labelStyle}>Batch Name *</label>
                <input style={inputStyle} value={form.batch_name}
                  onChange={e => setForm({...form, batch_name:e.target.value})}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Application Deadline *</label>
                <input style={inputStyle} type="date"
                  value={form.application_end_date}
                  onChange={e => setForm({
                    ...form, application_end_date:e.target.value
                  })}
                  required />
              </div>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={labelStyle}>Notes</label>
              <textarea style={{...inputStyle, minHeight:'60px'}}
                value={form.update_notes}
                onChange={e => setForm({...form, update_notes:e.target.value})} />
            </div>
              <div className="flex flex-col md:flex-row gap-2.5">
                <button type="submit" className="w-full md:w-auto" style={{
                  background:'var(--color-success)', color:'#fff', border:'none',
                  borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                  fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
                }}>
                  {editBatch ? 'Save Changes' : 'Create Batch'}
                </button>
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setEditBatch(null);
                  setForm({ batch_name:'', application_end_date:'', update_notes:'' });
                }} className="w-full md:w-auto" style={{
                  background:'transparent', color:'var(--color-text-subdued)',
                  border:'1px solid var(--color-border-subtle)', borderRadius:'6px',
                  padding:'10px 20px', fontSize:'13px',
                  cursor:'pointer', fontFamily:'inherit'
                }}>Cancel</button>
              </div>
          </form>
        </div>
      )}

      {/* Filter Toggle */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'12px'
      }}>
        <div style={{fontSize:'12px', color:'var(--color-text-subdued)'}}>
          {activeBatches.length} active ·{' '}
          {oldBatches.length} completed/rejected
        </div>
        {oldBatches.length > 0 && (
          <button onClick={() => setShowOld(!showOld)} style={{
            background:'transparent', border:'1px solid var(--color-border-subtle)',
            color:'var(--color-text-subdued)', borderRadius:'5px', padding:'5px 12px',
            fontSize:'11px', fontWeight:'600', cursor:'pointer',
            fontFamily:'inherit'
          }}>
            {showOld
              ? 'Hide Completed/Rejected'
              : `Show Completed/Rejected (${oldBatches.length})`}
          </button>
        )}
      </div>

      {/* Batches List */}
      {visibleBatches.length === 0 ? (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>📋</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No Batches Yet
          </div>
          <div style={{color:'var(--color-text-subdued)', fontSize:'13px'}}>
            Create your first TES batch to start accepting applications.
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gap:'12px'}}>
          {visibleBatches.map(batch => (
            <div key={batch.id} style={{
              background:'var(--color-bg-card)',
              border:`1px solid ${
                ['completed','rejected'].includes(batch.status)
                  ? 'var(--color-divider)' : 'var(--color-border-subtle)'
              }`,
              borderRadius:'8px', padding:'16px 20px',
              opacity: ['completed','rejected'].includes(batch.status) ? 0.75 : 1
            }}>
              <div style={{
                display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', flexWrap:'wrap', gap:'10px'
              }}>
                <div style={{flex:1}}>
                  <div style={{
                    display:'flex', alignItems:'center',
                    gap:'10px', marginBottom:'4px', flexWrap:'wrap'
                  }}>
                    <div style={{fontSize:'15px', fontWeight:'700'}}>
                      {batch.batch_name}
                    </div>
                    {statusBadge(batch.status)}
                    {isDeadlinePassed(batch.application_end_date) &&
                      batch.status === 'open' && (
                      <span style={{
                        background:'var(--color-tint-danger)', color:'var(--color-danger)',
                        padding:'2px 8px', borderRadius:'8px',
                        fontSize:'10px', fontWeight:'700'
                      }}>Deadline Passed</span>
                    )}
                  </div>
                  <div style={{
                    fontSize:'12px', color:'var(--color-text-subdued)',
                    display:'flex', gap:'16px', flexWrap:'wrap'
                  }}>
                    <span>
                      Opened: {new Date(batch.opened_at)
                        .toLocaleDateString('en-GB')}
                    </span>
                    <span>
                      Deadline: {new Date(batch.application_end_date)
                        .toLocaleDateString('en-GB')}
                    </span>
                    <span style={{fontWeight:'700', color:'var(--color-brand-accent)'}}>
                      {batch.application_count} Applications
                    </span>
                    {batch.funded_date && (
                      <span>
                        Funded: {new Date(batch.funded_date)
                          .toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                  {batch.update_notes && (
                    <div style={{
                      fontSize:'12px', color:'var(--color-text-subdued)',
                      marginTop:'4px', fontStyle:'italic'
                    }}>
                      {batch.update_notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setSelBatch(batch)} style={{
                    background:'var(--color-bg-stripe)', color:'var(--color-text-heading)',
                    border:'1px solid var(--color-border-subtle)',
                    borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                    fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                  }}>View</button>
                  {!readOnly && (
                    <button onClick={() => openEdit(batch)} style={{
                      background:'var(--color-tint-info)', color:'var(--color-info)', border:'none',
                      borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Edit</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}