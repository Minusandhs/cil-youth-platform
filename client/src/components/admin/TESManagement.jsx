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

  async function updateStatus(batch, status) {
    try {
      await api.put(`/api/tes/batches/${batch.id}`, {
        ...batch,
        status,
        funded_date: status === 'funded'
          ? new Date().toISOString().split('T')[0]
          : batch.funded_date
      });
      loadBatches();
    } catch {
      setError('Failed to update batch status');
    }
  }

  function statusBadge(status) {
    const map = {
      open      : { bg:'#d8ede4', color:'#2d6a4f', label:'Open'       },
      reviewing : { bg:'#f0ece2', color:'#6b5e4a', label:'Reviewing'  },
      approved  : { bg:'#dce9f5', color:'#1a4068', label:'Approved'   },
      funded    : { bg:'#fdecd8', color:'#b85c00', label:'Funded'     },
      completed : { bg:'#1a1610', color:'#c49a3c', label:'Completed'  },
      rejected  : { bg:'#f5e0e3', color:'#9b2335', label:'Rejected'   },
    };
    const s = map[status] || map.reviewing;
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
    color:'#3d3528', letterSpacing:'0.3px',
    textTransform:'uppercase', marginBottom:'5px'
  };

  const inputStyle = {
    width:'100%', padding:'9px 11px',
    border:'1px solid #d4c9b0', borderRadius:'5px',
    fontSize:'13px', color:'#1a1610',
    background:'#faf8f3', outline:'none', fontFamily:'inherit'
  };

  // Active = open, reviewing, approved, funded
  // Old = completed, rejected
  const activeBatches = batches.filter(b =>
    ['open','reviewing','approved','funded'].includes(b.status)
  );
  const oldBatches = batches.filter(b =>
    ['completed','rejected'].includes(b.status)
  );
  const visibleBatches = showOld ? batches : activeBatches;

  if (loading) return (
    <div style={{padding:'32px', color:'#6b5e4a'}}>Loading...</div>
  );

  if (selBatch) {
    return (
      <TESBatchDetail
        batch={selBatch}
        onBack={() => { setSelBatch(null); loadBatches(); }}
        isAdmin={true}
        readOnly={readOnly}
      />
    );
  }

  return (
    <div>
      <div className="rsp-section-header" style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px'
      }}>
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>
            TES Batch Management
          </h2>
          <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
            Manage Tertiary Education Scholarship batches
          </p>
        </div>
        {!readOnly && (
          <button onClick={() => {
            setShowForm(!showForm);
            setEditBatch(null);
            setForm({ batch_name:'', application_end_date:'', update_notes:'' });
          }} style={{
            background:'#1a1610', color:'#c49a3c', border:'none',
            borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            {showForm ? '✕ Cancel' : '+ New Batch'}
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

      {/* Create Form */}
      {showForm && (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            {editBatch ? 'Edit Batch' : 'Create New Batch'}
          </h3>
          <form onSubmit={editBatch ? handleEdit : handleCreate}>
            <div className="rsp-grid-2" style={{
              display:'grid', gridTemplateColumns:'1fr 1fr',
              gap:'14px', marginBottom:'14px'
            }}>
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
              <div className="rsp-submit-row" style={{display:'flex', gap:'10px'}}>
                <button type="submit" style={{
                  background:'#2d6a4f', color:'#fff', border:'none',
                  borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                  fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
                }}>
                  {editBatch ? 'Save Changes' : 'Create Batch'}
                </button>
                <button type="button" onClick={() => {
                  setShowForm(false);
                  setEditBatch(null);
                  setForm({ batch_name:'', application_end_date:'', update_notes:'' });
                }} style={{
                  background:'transparent', color:'#6b5e4a',
                  border:'1px solid #d4c9b0', borderRadius:'6px',
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
        <div style={{fontSize:'12px', color:'#6b5e4a'}}>
          {activeBatches.length} active ·{' '}
          {oldBatches.length} completed/rejected
        </div>
        {oldBatches.length > 0 && (
          <button onClick={() => setShowOld(!showOld)} style={{
            background:'transparent', border:'1px solid #d4c9b0',
            color:'#6b5e4a', borderRadius:'5px', padding:'5px 12px',
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
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>📋</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No Batches Yet
          </div>
          <div style={{color:'#6b5e4a', fontSize:'13px'}}>
            Create your first TES batch to start accepting applications.
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gap:'12px'}}>
          {visibleBatches.map(batch => (
            <div key={batch.id} style={{
              background:'#fffef9',
              border:`1px solid ${
                ['completed','rejected'].includes(batch.status)
                  ? '#e8e0d0' : '#d4c9b0'
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
                        background:'#f5e0e3', color:'#9b2335',
                        padding:'2px 8px', borderRadius:'8px',
                        fontSize:'10px', fontWeight:'700'
                      }}>Deadline Passed</span>
                    )}
                  </div>
                  <div style={{
                    fontSize:'12px', color:'#6b5e4a',
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
                    <span style={{fontWeight:'700', color:'#c49a3c'}}>
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
                      fontSize:'12px', color:'#6b5e4a',
                      marginTop:'4px', fontStyle:'italic'
                    }}>
                      {batch.update_notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="rsp-submit-row" style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                    <button onClick={() => setSelBatch(batch)} style={{
                      background:'#f0ece2', color:'#3d3528',
                      border:'1px solid #d4c9b0',
                      borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>View</button>
                    {!readOnly && (
                    <button onClick={() => openEdit(batch)} style={{
                      background:'#dce9f5', color:'#1a4068', border:'none',
                      borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Edit</button>
                    )}

                  {/* Stop Applications — only when open */}
                  {!readOnly && batch.status === 'open' && (
                    <button onClick={() => updateStatus(batch, 'reviewing')} style={{
                      background:'#f0ece2', color:'#6b5e4a', border:'none',
                      borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Stop Applications</button>
                  )}

                  {/* Reopen — any stage except open and completed */}
                  {!readOnly && !['open','completed'].includes(batch.status) && (
                    <button onClick={() => {
                      if (window.confirm(
                        `Reopen "${batch.batch_name}"?\nThis will allow new applications again.`
                      )) {
                        updateStatus(batch, 'open');
                      }
                    }} style={{
                      background:'#d8ede4', color:'#2d6a4f', border:'none',
                      borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Reopen</button>
                  )}

                  {/* Approve + Reject — only when reviewing */}
                  {!readOnly && batch.status === 'reviewing' && (
                    <>
                      <button onClick={() => updateStatus(batch, 'approved')} style={{
                        background:'#dce9f5', color:'#1a4068', border:'none',
                        borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                        fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                      }}>Approve</button>
                      <button onClick={() => updateStatus(batch, 'rejected')} style={{
                        background:'#f5e0e3', color:'#9b2335', border:'none',
                        borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                        fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                      }}>Reject</button>
                    </>
                  )}

                  {/* Mark Funded — only when approved */}
                  {!readOnly && batch.status === 'approved' && (
                    <button onClick={() => updateStatus(batch, 'funded')} style={{
                      background:'#fdecd8', color:'#b85c00', border:'none',
                      borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Mark Funded</button>
                  )}

                  {/* Revert Funded → Approved */}
                  {!readOnly && batch.status === 'funded' && (
                    <>
                      <button onClick={() => updateStatus(batch, 'completed')} style={{
                        background:'#1a1610', color:'#c49a3c', border:'none',
                        borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                        fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                      }}>Mark Completed</button>
                      <button onClick={() => {
                        if (window.confirm(
                          'Revert this batch from Funded back to Approved?'
                        )) {
                          updateStatus(batch, 'approved');
                        }
                      }} style={{
                        background:'#f5e0e3', color:'#9b2335', border:'none',
                        borderRadius:'5px', padding:'6px 14px', fontSize:'12px',
                        fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                      }}>Revert Funded</button>
                    </>
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