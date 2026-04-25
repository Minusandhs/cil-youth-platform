import { useState, useEffect } from 'react';
import api from '../../lib/api';
import TESBatchDetail from '../tes/TESBatchDetail';

export default function LDCTESBatches() {
  const [batches, setBatches ] = useState([]);
  const [loading, setLoading ] = useState(true);
  const [selBatch, setSelBatch] = useState(null);
  const [error,   setError   ] = useState('');

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

  function statusBadge(status) {
    const map = {
      open      : { bg:'var(--color-tint-success)', color:'var(--color-success)', label:'Open'      },
      reviewing : { bg:'var(--color-bg-stripe)', color:'var(--color-text-subdued)', label:'Reviewing' },
      approved  : { bg:'var(--color-tint-info)', color:'var(--color-info)', label:'Approved'  },
      funded    : { bg:'var(--color-tint-warning)', color:'var(--color-warning)', label:'Funded'    },
      completed : { bg:'var(--color-brand-primary)', color:'var(--color-brand-accent)', label:'Completed' },
      rejected  : { bg:'var(--color-tint-danger)', color:'var(--color-danger)', label:'Rejected'  },
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

  function daysLeft(date) {
    const diff = new Date(date) - new Date();
    const days = Math.ceil(diff / (1000*60*60*24));
    if (days < 0) return 'Deadline passed';
    if (days === 0) return 'Deadline today';
    return `${days} days left`;
  }

  if (loading) return (
    <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>Loading batches...</div>
  );

  if (selBatch) {
    return (
      <TESBatchDetail
        batch={selBatch}
        onBack={() => { setSelBatch(null); loadBatches(); }}
        isAdmin={false}
      />
    );
  }

  return (
    <div>
      <div style={{marginBottom:'20px'}}>
        <h2 style={{fontSize:'20px', fontWeight:'700'}}>TES Batches</h2>
        <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
          View and submit applications for open TES batches
        </p>
      </div>

      {error && (
        <div style={{
          background:'var(--color-tint-danger)', border:'1px solid var(--color-danger)',
          borderRadius:'6px', padding:'10px 14px',
          color:'var(--color-danger)', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}

      {batches.length === 0 ? (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>📋</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No Batches Available
          </div>
          <div style={{color:'var(--color-text-subdued)', fontSize:'13px'}}>
            No TES batches have been created yet.
            Check back later or contact the admin.
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gap:'12px'}}>
          {batches.map(batch => {
            const isOpen = batch.status === 'open';
            const deadlinePassed = new Date(batch.application_end_date) < new Date();
            const canApply = isOpen && !deadlinePassed;
            const isActive = ['open','reviewing','approved','funded'].includes(batch.status);

            return (
                <div key={batch.id} style={{
                  background:'var(--color-bg-card)',
                  border:`1px solid ${canApply ? 'var(--color-success)' : isActive ? 'var(--color-border-subtle)' : 'var(--color-divider)'}`,
                  borderRadius:'8px', padding:'16px 20px',
                  opacity: isActive ? 1 : 0.75
                }}>
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', flexWrap:'wrap', gap:'10px'
                }}>
                  <div style={{flex:1}}>
                    <div style={{
                      display:'flex', alignItems:'center',
                      gap:'10px', marginBottom:'6px', flexWrap:'wrap'
                    }}>
                      <div style={{fontSize:'15px', fontWeight:'700'}}>
                        {batch.batch_name}
                      </div>
                      {statusBadge(batch.status)}
                      {canApply && (
                        <span style={{
                          background:'var(--color-tint-success)', color:'var(--color-success)',
                          padding:'2px 8px', borderRadius:'8px',
                          fontSize:'10px', fontWeight:'700'
                        }}>Accepting Applications</span>
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
                      {isOpen && (
                        <span style={{
                          fontWeight:'700',
                          color: deadlinePassed ? 'var(--color-danger)' : 'var(--color-success)'
                        }}>
                          {daysLeft(batch.application_end_date)}
                        </span>
                      )}
                      <span style={{color:'var(--color-brand-accent)', fontWeight:'700'}}>
                        {batch.application_count} Applications
                      </span>
                    </div>

                    {batch.update_notes && (
                      <div style={{
                        fontSize:'12px', color:'var(--color-text-subdued)',
                        marginTop:'6px', fontStyle:'italic'
                      }}>
                        {batch.update_notes}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelBatch(batch)}
                    style={{
                      background: canApply ? 'var(--color-brand-primary)' : 'var(--color-bg-stripe)',
                      color: canApply ? 'var(--color-brand-accent)' : 'var(--color-text-subdued)',
                      border:'none', borderRadius:'6px',
                      padding:'8px 18px', fontSize:'12px',
                      fontWeight:'700', cursor:'pointer',
                      fontFamily:'inherit'
                    }}
                  >
                    {canApply ? 'Apply / View' : 'View'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}