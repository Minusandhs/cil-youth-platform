import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function ParticipantList() {
  const navigate = useNavigate();
  const [participants,     setParticipants    ] = useState([]);
  const [ldcs,             setLdcs            ] = useState([]);
  const [loading,          setLoading         ] = useState(true);
  const [search,           setSearch          ] = useState('');
  const [filterLDC,        setFilterLDC       ] = useState('');
  const [showInactive,     setShowInactive    ] = useState(false);
  const [error,            setError           ] = useState('');
  const [togglingId,       setTogglingId      ] = useState(null);

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
    <div style={{padding:'32px', color:'#6b5e4a'}}>Loading...</div>
  );

  return (
    <div>
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px'
      }}>
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>Participants</h2>
          <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
            {participants.length} participants loaded
          </p>
        </div>
        <label style={{
          display:'flex', alignItems:'center', gap:'8px',
          fontSize:'13px', color:'#6b5e4a', cursor:'pointer'
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
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          color:'#9b2335', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}

      {/* Search & Filter */}
      <div style={{
        background:'#fffef9', border:'1px solid #d4c9b0',
        borderRadius:'8px', padding:'16px', marginBottom:'20px',
        display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'flex-end'
      }}>
        <div style={{flex:1, minWidth:'200px'}}>
          <label style={{
            display:'block', fontSize:'11px', fontWeight:'700',
            color:'#3d3528', textTransform:'uppercase',
            letterSpacing:'0.3px', marginBottom:'5px'
          }}>Search</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Name or Participant ID..."
            style={{
              width:'100%', padding:'9px 11px',
              border:'1px solid #d4c9b0', borderRadius:'5px',
              fontSize:'13px', background:'#faf8f3',
              outline:'none', fontFamily:'inherit'
            }}
          />
        </div>
        <div style={{minWidth:'200px'}}>
          <label style={{
            display:'block', fontSize:'11px', fontWeight:'700',
            color:'#3d3528', textTransform:'uppercase',
            letterSpacing:'0.3px', marginBottom:'5px'
          }}>Filter by LDC</label>
          <select
            value={filterLDC}
            onChange={e => setFilterLDC(e.target.value)}
            style={{
              width:'100%', padding:'9px 11px',
              border:'1px solid #d4c9b0', borderRadius:'5px',
              fontSize:'13px', background:'#faf8f3',
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
        <button onClick={handleSearch} style={{
          background:'#1a1610', color:'#c49a3c',
          border:'none', borderRadius:'6px',
          padding:'10px 20px', fontSize:'13px',
          fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
        }}>
          Search
        </button>
        <button onClick={() => {
          setSearch(''); setFilterLDC(''); loadData();
        }} style={{
          background:'transparent', color:'#6b5e4a',
          border:'1px solid #d4c9b0', borderRadius:'6px',
          padding:'10px 16px', fontSize:'13px',
          cursor:'pointer', fontFamily:'inherit'
        }}>
          Clear
        </button>
      </div>

      {/* Participants Table */}
      <div style={{
        background:'#fffef9', border:'1px solid #d4c9b0',
        borderRadius:'8px', overflow:'hidden'
      }}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#f0ece2'}}>
              {['Participant ID','Name','LDC','Age','Gender','Planned Completion','Sync Batch','Status','Action'].map(h => (
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
            {participants.map(p => (
              <tr key={p.id} style={{
                borderBottom:'1px solid #e8e0d0',
                cursor:'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.background='#faf8f3'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <td style={{padding:'10px 14px', color:'#c49a3c', fontWeight:'700'}}>
                  {p.participant_id}
                </td>
                <td style={{padding:'10px 14px', fontWeight:'600', color: !p.is_active ? '#a09080' : 'inherit'}}>
                  {p.full_name}
                </td>
                <td style={{padding:'10px 14px', color:'#6b5e4a'}}>{p.ldc_code}</td>
                <td style={{padding:'10px 14px', color:'#6b5e4a'}}>
                  {calcAge(p.date_of_birth)}
                </td>
                <td style={{padding:'10px 14px'}}>
                  <span style={{
                    background: p.gender === 'Female' ? '#f5e0e3' : '#dce9f5',
                    color: p.gender === 'Female' ? '#9b2335' : '#1a4068',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {p.gender}
                  </span>
                </td>
                <td style={{padding:'10px 14px', color:'#6b5e4a'}}>
                  {formatDate(p.planned_completion)}
                </td>
<td style={{padding:'10px 14px', color:'#a09080', fontSize:'12px'}}>
  {p.sync_batch || '—'}
</td>
<td style={{padding:'10px 14px'}}>
  {!p.is_active ? (
    <span style={{
      background:'#e8e0d0', color:'#6b5e4a',
      padding:'2px 8px', borderRadius:'10px',
      fontSize:'10px', fontWeight:'700'
    }}>INACTIVE</span>
  ) : p.is_exited ? (
    <span style={{
      background:'#f5e0c8', color:'#7a4f1a',
      padding:'2px 8px', borderRadius:'10px',
      fontSize:'10px', fontWeight:'700'
    }}>EXITED</span>
  ) : (
    <span style={{
      background:'#d8ede4', color:'#2d6a4f',
      padding:'2px 8px', borderRadius:'10px',
      fontSize:'10px', fontWeight:'700'
    }}>ACTIVE</span>
  )}
</td>
<td style={{padding:'10px 14px'}}>
  <div style={{display:'flex', gap:'6px'}}>
    <button
      onClick={() => navigate(`/participant/${p.id}?from=admin`)}
      style={{
        background:'#1a1610', color:'#c49a3c', border:'none',
        borderRadius:'4px', padding:'5px 12px', fontSize:'11px',
        fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
      }}
    >
      View Profile
    </button>
    <button
      onClick={() => toggleActive(p)}
      disabled={togglingId === p.id}
      style={{
        background: p.is_active ? '#f5e0e3' : '#d8ede4',
        color: p.is_active ? '#9b2335' : '#2d6a4f',
        border:'none', borderRadius:'4px',
        padding:'5px 12px', fontSize:'11px',
        fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
        opacity: togglingId === p.id ? 0.6 : 1
      }}
    >
      {p.is_active ? 'Deactivate' : 'Reactivate'}
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
        {participants.length === 0 && (
          <div style={{padding:'32px', textAlign:'center', color:'#6b5e4a'}}>
            No participants found.
          </div>
        )}
      </div>
    </div>
  );
}