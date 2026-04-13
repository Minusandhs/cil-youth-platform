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
      open      : { bg:'#d8ede4', color:'#2d6a4f', label:'Open'      },
      reviewing : { bg:'#f0ece2', color:'#6b5e4a', label:'Reviewing' },
      approved  : { bg:'#dce9f5', color:'#1a4068', label:'Approved'  },
      funded    : { bg:'#fdecd8', color:'#b85c00', label:'Funded'    },
      completed : { bg:'#1a1610', color:'#c49a3c', label:'Completed' },
      rejected  : { bg:'#f5e0e3', color:'#9b2335', label:'Rejected'  },
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
    <div style={{padding:'32px', color:'#6b5e4a'}}>Loading batches...</div>
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
        <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
          View and submit applications for open TES batches
        </p>
      </div>

      {error && (
        <div style={{
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          color:'#9b2335', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}

      {batches.length === 0 ? (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>📋</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No Batches Available
          </div>
          <div style={{color:'#6b5e4a', fontSize:'13px'}}>
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
                  background:'#fffef9',
                  border:`1px solid ${canApply ? '#2d6a4f' : isActive ? '#d4c9b0' : '#e8e0d0'}`,
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
                          background:'#d8ede4', color:'#2d6a4f',
                          padding:'2px 8px', borderRadius:'8px',
                          fontSize:'10px', fontWeight:'700'
                        }}>Accepting Applications</span>
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
                      {isOpen && (
                        <span style={{
                          fontWeight:'700',
                          color: deadlinePassed ? '#9b2335' : '#2d6a4f'
                        }}>
                          {daysLeft(batch.application_end_date)}
                        </span>
                      )}
                      <span style={{color:'#c49a3c', fontWeight:'700'}}>
                        {batch.application_count} Applications
                      </span>
                    </div>

                    {batch.update_notes && (
                      <div style={{
                        fontSize:'12px', color:'#6b5e4a',
                        marginTop:'6px', fontStyle:'italic'
                      }}>
                        {batch.update_notes}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelBatch(batch)}
                    style={{
                      background: canApply ? '#1a1610' : '#f0ece2',
                      color: canApply ? '#c49a3c' : '#6b5e4a',
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