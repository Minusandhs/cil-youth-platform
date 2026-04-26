import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function ParticipantList({ readOnly = false }) {
  const navigate = useNavigate();
  const [participants,     setParticipants    ] = useState([]);
  const [ldcs,             setLdcs            ] = useState([]);
  const [loading,          setLoading         ] = useState(true);
  const [search,           setSearch          ] = useState('');
  const [filterLDC,        setFilterLDC       ] = useState('');
  const [showInactive,     setShowInactive    ] = useState(false);
  const [error,            setError           ] = useState('');
  const [togglingId,       setTogglingId      ] = useState(null);
  const [page,             setPage            ] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => { loadData(); }, []);

  async function loadData(inactive = showInactive) {
    try {
      const params = { include_inactive: inactive ? 'true' : 'false' };
      const [partRes, ldcRes] = await Promise.all([
        api.get('/api/participants', { params }),
        api.get('/api/ldcs')
      ]);
      setParticipants(partRes.data);
      setLdcs(ldcRes.data);
    } catch {
      setError('Failed to load participants');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setLoading(true);
    setPage(1);
    try {
      const params = { include_inactive: showInactive ? 'true' : 'false' };
      if (search)    params.search = search;
      if (filterLDC) params.ldc_id = filterLDC;
      const res = await api.get('/api/participants', { params });
      setParticipants(res.data);
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(p) {
    const action = p.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${p.full_name}?`)) return;
    setTogglingId(p.id);
    try {
      await api.patch(`/api/participants/${p.id}/active`, { is_active: !p.is_active });
      await loadData(showInactive);
    } catch {
      setError(`Failed to ${action} participant`);
    } finally {
      setTogglingId(null);
    }
  }

  function handleToggleInactive(val) {
    setShowInactive(val);
    setLoading(true);
    loadData(val);
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB');
  }

  function calcAge(dob) {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  if (loading) return (
    <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>Loading...</div>
  );

  const totalPages = Math.ceil(participants.length / PAGE_SIZE);
  const paged = participants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8">
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>Participants</h2>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            {participants.length} participants
            {totalPages > 1 && ` — Page ${page} of ${totalPages}`}
          </p>
        </div>
        <label style={{
          display:'flex', alignItems:'center', gap:'8px',
          fontSize:'13px', color:'var(--color-text-subdued)', cursor:'pointer'
        }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => handleToggleInactive(e.target.checked)}
          />
          Show Inactive
        </label>
      </div>

      {error && (
        <div style={{
          background:'var(--color-tint-danger)', border:'1px solid var(--color-danger)',
          borderRadius:'6px', padding:'10px 14px',
          color:'var(--color-danger)', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}

      {/* Search & Filter */}
      <div style={{
        background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
        borderRadius:'8px', padding:'16px', marginBottom:'20px',
        display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end'
      }}>
        <div className="rsp-search-input" style={{flex:1, minWidth:'200px'}}>
          <label style={{
            display:'block', fontSize:'11px', fontWeight:'700',
            color:'var(--color-text-heading)', textTransform:'uppercase',
            letterSpacing:'0.3px', marginBottom:'5px'
          }}>Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{
              width:'100%', padding:'9px 11px',
              border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
              fontSize:'13px', background:'var(--color-bg-page)',
              outline:'none', fontFamily:'inherit'
            }}
          />
        </div>
        <div className="rsp-search-filter" style={{minWidth:'200px'}}>
          <label style={{
            display:'block', fontSize:'11px', fontWeight:'700',
            color:'var(--color-text-heading)', textTransform:'uppercase',
            letterSpacing:'0.3px', marginBottom:'5px'
          }}>Filter by LDC</label>
          <select
            value={filterLDC}
            onChange={e => setFilterLDC(e.target.value)}
            style={{
              width:'100%', padding:'9px 11px',
              border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
              fontSize:'13px', background:'var(--color-bg-page)',
              outline:'none', fontFamily:'inherit'
            }}
          >
            <option value="">All LDCs</option>
            {ldcs.map(l => (
              <option key={l.id} value={l.id}>
                {l.ldc_id} — {l.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rsp-search-buttons">
          <button onClick={handleSearch} style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)',
            border:'none', borderRadius:'6px',
            padding:'10px 20px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>
            Search
          </button>
          <button onClick={() => {
            setSearch(''); setFilterLDC(''); loadData();
          }} style={{
            background:'transparent', color:'var(--color-text-subdued)',
            border:'1px solid var(--color-border-subtle)', borderRadius:'6px',
            padding:'10px 16px', fontSize:'13px',
            cursor:'pointer', fontFamily:'inherit'
          }}>
            Clear
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rsp-card-wrap">
        <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
        <table className="rsp-card-table rsp-participant-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'700px'}}>
          <thead>
            <tr style={{background:'var(--color-bg-stripe)'}}>
              {['Participant ID','Name','LDC','Age','Gender','Planned Completion','Sync Batch','Status','Action'].map(h => (
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
            {paged.map(p => (
              <tr key={p.id} style={{
                borderBottom:'1px solid var(--color-divider)',
                cursor:'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background='var(--color-bg-page)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <td data-label="ID" style={{padding:'10px 14px', color:'var(--color-brand-accent)', fontWeight:'700'}}>
                  <div className="rsp-pcard-avatar">{p.full_name?.charAt(0)}</div>
                  <span className="rsp-pcard-pid">{p.participant_id}</span>
                </td>
                <td data-label="Name" style={{padding:'10px 14px', fontWeight:'600', color: !p.is_active ? 'var(--color-text-subdued)' : 'inherit'}}>
                  {p.full_name}
                  <div className="rsp-pcard-sub">{p.participant_id} · {p.ldc_code}</div>
                </td>
                <td data-label="LDC" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>{p.ldc_code}</td>
                <td data-label="Age" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>
                  {calcAge(p.date_of_birth)}
                </td>
                <td data-label="Gender" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: p.gender === 'Female' ? 'var(--color-tint-danger)' : 'var(--color-tint-info)',
                    color: p.gender === 'Female' ? 'var(--color-danger)' : 'var(--color-info)',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {p.gender}
                  </span>
                </td>
                <td data-label="Completion" style={{padding:'10px 14px', color:'var(--color-text-subdued)'}}>
                  {formatDate(p.planned_completion)}
                </td>
<td data-label="Batch" style={{padding:'10px 14px', color:'var(--color-text-subdued)', fontSize:'12px'}}>
  {p.sync_batch || '—'}
</td>
<td data-label="Status" style={{padding:'10px 14px'}}>
  {!p.is_active ? (
    <span style={{
      background:'var(--color-divider)', color:'var(--color-text-subdued)',
      padding:'2px 8px', borderRadius:'10px',
      fontSize:'10px', fontWeight:'700'
    }}>INACTIVE</span>
  ) : (
    <span style={{
      background:'var(--color-tint-success)', color:'var(--color-success)',
      padding:'2px 8px', borderRadius:'10px',
      fontSize:'10px', fontWeight:'700'
    }}>ACTIVE</span>
  )}
</td>
<td data-label="Action" style={{padding:'10px 14px'}}>
  <div style={{display:'flex', gap:'6px'}}>
    <button
      onClick={() => navigate(`/participant/${p.id}?from=admin`)}
      style={{
        background:'var(--color-bg-stripe)', color:'var(--color-text-heading)',
        border:'1px solid var(--color-border-subtle)',
        borderRadius:'4px', padding:'5px 12px', fontSize:'11px',
        fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
      }}
    >
      View Profile
    </button>
    {!readOnly && (
      <button
        onClick={() => toggleActive(p)}
        disabled={togglingId === p.id}
        style={{
          background: p.is_active ? 'var(--color-tint-danger)' : 'var(--color-tint-success)',
          color: p.is_active ? 'var(--color-danger)' : 'var(--color-success)',
          border:'none', borderRadius:'4px',
          padding:'5px 12px', fontSize:'11px',
          fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
          opacity: togglingId === p.id ? 0.6 : 1
        }}
      >
        {p.is_active ? 'Deactivate' : 'Reactivate'}
      </button>
    )}
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {participants.length === 0 && (
          <div style={{padding:'32px', textAlign:'center', color:'var(--color-text-subdued)'}}>
            No participants found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display:'flex', justifyContent:'center', alignItems:'center',
          gap:'8px', marginTop:'20px', flexWrap:'wrap'
        }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              background: page === 1 ? 'var(--color-bg-stripe)' : 'var(--color-brand-primary)',
              color: page === 1 ? 'var(--color-text-subdued)' : 'var(--color-brand-accent)',
              border:'none', borderRadius:'5px', padding:'7px 14px',
              fontSize:'12px', fontWeight:'700',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontFamily:'inherit'
            }}>← Prev</button>
          {Array.from({length: totalPages}, (_, i) => i + 1)
            .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
            .reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx-1] > 1) acc.push('...');
              acc.push(n);
              return acc;
            }, [])
            .map((n, idx) => n === '...' ? (
              <span key={`ellipsis-${idx}`} style={{color:'var(--color-text-subdued)', fontSize:'12px'}}>…</span>
            ) : (
              <button key={n} onClick={() => setPage(n)} style={{
                background: page === n ? 'var(--color-brand-primary)' : 'var(--color-bg-stripe)',
                color: page === n ? 'var(--color-brand-accent)' : 'var(--color-text-heading)',
                border:'none', borderRadius:'5px', padding:'7px 12px',
                fontSize:'12px', fontWeight:'700',
                cursor:'pointer', fontFamily:'inherit', minWidth:'34px'
              }}>{n}</button>
            ))
          }
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              background: page === totalPages ? 'var(--color-bg-stripe)' : 'var(--color-brand-primary)',
              color: page === totalPages ? 'var(--color-text-subdued)' : 'var(--color-brand-accent)',
              border:'none', borderRadius:'5px', padding:'7px 14px',
              fontSize:'12px', fontWeight:'700',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontFamily:'inherit'
            }}>Next →</button>
        </div>
      )}
    </div>
  );
}