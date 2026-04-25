import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function TESHistory({ participantId }) {
  const [data,    setData   ] = useState({ history:[], total_received:0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState('');

  useEffect(() => { loadHistory(); }, [participantId]);

  async function loadHistory() {
    try {
      const res = await api.get(`/api/tes/history/${participantId}`);
      setData(res.data);
    } catch {
      setError('Failed to load TES history');
    } finally {
      setLoading(false);
    }
  }

  function statusBadge(status) {
    const map = {
      funded   : { bg:'var(--color-tint-warning)', color:'var(--color-warning)', label:'Funded'    },
      completed: { bg:'var(--color-brand-primary)', color:'var(--color-brand-accent)', label:'Completed' },
      reverted : { bg:'var(--color-tint-danger)', color:'var(--color-danger)', label:'Reverted'  },
    };
    const s = map[status] || map.funded;
    return (
      <span style={{
        background:s.bg, color:s.color,
        padding:'2px 8px', borderRadius:'8px',
        fontSize:'10px', fontWeight:'700'
      }}>{s.label}</span>
    );
  }

  function instTypeLabel(type) {
    const map = {
      university: 'University',
      college   : 'College',
      vocational: 'Vocational',
      other     : 'Other',
    };
    return map[type] || type || '—';
  }

  if (loading) return (
    <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>
      Loading TES history...
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

      {/* Header + Total */}
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:'20px',
        flexWrap:'wrap', gap:'12px'
      }}>
        <div>
          <h3 style={{fontSize:'16px', fontWeight:'700'}}>
            TES Support History
          </h3>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            {data.history.filter(h => h.status !== 'reverted').length} funded intervention{data.history.filter(h => h.status !== 'reverted').length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Total Received */}
        <div style={{
          background:'var(--color-brand-primary)', borderRadius:'8px',
          padding:'12px 20px', textAlign:'right'
        }}>
          <div style={{
            fontSize:'10px', color:'var(--color-text-muted)',
            textTransform:'uppercase', letterSpacing:'0.5px',
            marginBottom:'4px'
          }}>
            Total Received
          </div>
          <div style={{
            fontSize:'20px', fontWeight:'700', color:'var(--color-brand-accent)'
          }}>
            LKR {parseFloat(data.total_received).toLocaleString('en-LK', {
              minimumFractionDigits:2, maximumFractionDigits:2
            })}
          </div>
        </div>
      </div>

      {/* History List */}
      {data.history.length === 0 ? (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>🎓</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No TES Support Yet
          </div>
          <div style={{color:'var(--color-text-subdued)', fontSize:'13px'}}>
            TES history will appear here once a funded batch includes
            this participant.
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gap:'12px'}}>
          {data.history.map(h => (
            <div key={h.id} style={{
              background:'var(--color-bg-card)',
              border:`1px solid ${h.status === 'reverted' ? 'var(--color-divider)' : 'var(--color-border-subtle)'}`,
              borderRadius:'8px', padding:'16px 20px',
              opacity: h.status === 'reverted' ? 0.65 : 1
            }}>
              <div style={{
                display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', flexWrap:'wrap', gap:'10px',
                marginBottom:'12px'
              }}>
                <div>
                  <div style={{
                    display:'flex', alignItems:'center',
                    gap:'8px', marginBottom:'4px', flexWrap:'wrap'
                  }}>
                    <div style={{fontSize:'14px', fontWeight:'700'}}>
                      {h.batch_name}
                    </div>
                    {statusBadge(h.status)}
                  </div>
                  <div style={{fontSize:'11px', color:'var(--color-text-muted)'}}>
                    Recorded: {new Date(h.recorded_at)
                      .toLocaleDateString('en-GB')}
                  </div>
                </div>

                {/* Amount */}
                {h.amount_received && (
                  <div style={{
                    background: h.status === 'reverted' ? 'var(--color-bg-stripe)' : 'var(--color-tint-success)',
                    borderRadius:'6px', padding:'8px 16px', textAlign:'right'
                  }}>
                    <div style={{
                      fontSize:'16px', fontWeight:'700',
                      color: h.status === 'reverted' ? 'var(--color-text-muted)' : 'var(--color-success)',
                      textDecoration: h.status === 'reverted'
                        ? 'line-through' : 'none'
                    }}>
                      LKR {parseFloat(h.amount_received).toLocaleString(
                        'en-LK', {
                          minimumFractionDigits:2, maximumFractionDigits:2
                        }
                      )}
                    </div>
                    <div style={{
                      fontSize:'10px', color:'var(--color-text-subdued)',
                      textTransform:'uppercase', letterSpacing:'0.3px'
                    }}>Amount Received</div>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',
                gap:'10px'
              }}>
                {h.institution_name && (
                  <div>
                    <div style={{
                      fontSize:'10px', fontWeight:'700', color:'var(--color-text-muted)',
                      textTransform:'uppercase', letterSpacing:'0.3px',
                      marginBottom:'2px'
                    }}>Institution</div>
                    <div style={{fontSize:'12px', color:'var(--color-text-heading)', fontWeight:'600'}}>
                      {h.institution_name}
                    </div>
                  </div>
                )}
                {h.institution_type && (
                  <div>
                    <div style={{
                      fontSize:'10px', fontWeight:'700', color:'var(--color-text-muted)',
                      textTransform:'uppercase', letterSpacing:'0.3px',
                      marginBottom:'2px'
                    }}>Type</div>
                    <div style={{fontSize:'12px', color:'var(--color-text-heading)'}}>
                      {instTypeLabel(h.institution_type)}
                    </div>
                  </div>
                )}
                {h.course_name && (
                  <div>
                    <div style={{
                      fontSize:'10px', fontWeight:'700', color:'var(--color-text-muted)',
                      textTransform:'uppercase', letterSpacing:'0.3px',
                      marginBottom:'2px'
                    }}>Course</div>
                    <div style={{fontSize:'12px', color:'var(--color-text-heading)', fontWeight:'600'}}>
                      {h.course_name}
                    </div>
                  </div>
                )}
                {h.course_duration && (
                  <div>
                    <div style={{
                      fontSize:'10px', fontWeight:'700', color:'var(--color-text-muted)',
                      textTransform:'uppercase', letterSpacing:'0.3px',
                      marginBottom:'2px'
                    }}>Duration</div>
                    <div style={{fontSize:'12px', color:'var(--color-text-heading)'}}>
                      {h.course_duration} Years
                    </div>
                  </div>
                )}
                {h.course_year && (
                  <div>
                    <div style={{
                      fontSize:'10px', fontWeight:'700', color:'var(--color-text-muted)',
                      textTransform:'uppercase', letterSpacing:'0.3px',
                      marginBottom:'2px'
                    }}>Year of Study</div>
                    <div style={{fontSize:'12px', color:'var(--color-text-heading)'}}>
                      Year {h.course_year}
                    </div>
                  </div>
                )}
                {h.funded_date && h.status !== 'reverted' && (
                  <div>
                    <div style={{
                      fontSize:'10px', fontWeight:'700', color:'var(--color-text-muted)',
                      textTransform:'uppercase', letterSpacing:'0.3px',
                      marginBottom:'2px'
                    }}>Funded Date</div>
                    <div style={{fontSize:'12px', color:'var(--color-text-heading)'}}>
                      {new Date(h.funded_date).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                )}
              </div>

              {/* Reverted Notice */}
              {h.status === 'reverted' && (
                <div style={{
                  marginTop:'10px', padding:'8px 12px',
                  background:'var(--color-tint-danger)', borderRadius:'5px',
                  fontSize:'11px', color:'var(--color-danger)', fontWeight:'600'
                }}>
                  ⚠ This funding was reverted — batch returned to Approved status
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}