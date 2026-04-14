import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function LDCParticipantList() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [loading,      setLoading     ] = useState(true);
  const [search,       setSearch      ] = useState('');
  const [error,        setError       ] = useState('');
  const [page,         setPage        ] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => { loadParticipants(); }, []);

  async function loadParticipants() {
    try {
      const res = await api.get('/api/participants');
      setParticipants(res.data);
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
      const res = await api.get('/api/participants', {
        params: { search }
      });
      setParticipants(res.data);
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
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
    <div style={{padding:'32px', color:'#6b5e4a'}}>Loading participants...</div>
  );

  const totalPages = Math.ceil(participants.length / PAGE_SIZE);
  const paged = participants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div style={{marginBottom:'20px'}}>
        <h2 style={{fontSize:'20px', fontWeight:'700'}}>
          Participants — {user?.ldc_code}
        </h2>
        <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
          {participants.length} participants in your LDC
          {totalPages > 1 && ` — Page ${page} of ${totalPages}`}
        </p>
      </div>

      {error && (
        <div style={{
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          color:'#9b2335', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}

      {/* Search */}
      <div style={{
        background:'#fffef9', border:'1px solid #d4c9b0',
        borderRadius:'8px', padding:'16px', marginBottom:'20px',
        display:'flex', gap:'10px', alignItems:'flex-end', flexWrap:'wrap'
      }}>
        <div
          className="rsp-search-input" 
          style={{flex:1}}>
          <label style={{
            display:'block', fontSize:'11px', fontWeight:'700',
            color:'#3d3528', textTransform:'uppercase',
            letterSpacing:'0.3px', marginBottom:'5px'
          }}>Search Participant</label>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{
              width:'100%', padding:'9px 11px',
              border:'1px solid #d4c9b0', borderRadius:'5px',
              fontSize:'13px', background:'#faf8f3',
              outline:'none', fontFamily:'inherit'
            }}
          />
        </div>
        <div className="rsp-search-buttons">
          <button onClick={handleSearch} style={{
            background:'#1a1610', color:'#c49a3c',
            border:'none', borderRadius:'6px',
            padding:'10px 20px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>Search</button>
          <button onClick={() => { setSearch(''); loadParticipants(); }} style={{
            background:'transparent', color:'#6b5e4a',
            border:'1px solid #d4c9b0', borderRadius:'6px',
            padding:'10px 16px', fontSize:'13px',
            cursor:'pointer', fontFamily:'inherit'
          }}>Clear</button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rsp-card-wrap">
        <div style={{overflowX:'auto', WebkitOverflowScrolling:'touch'}}>
        <table className="rsp-card-table rsp-participant-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'520px'}}>
          <thead>
            <tr style={{background:'#f0ece2'}}>
              {['Participant ID','Name','Age','Gender','Planned Completion','Action'].map(h => (
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
            {paged.map(p => (
              <tr key={p.id} style={{borderBottom:'1px solid #e8e0d0'}}
                onMouseEnter={e => e.currentTarget.style.background='#faf8f3'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <td data-label="ID" style={{padding:'10px 14px', color:'#c49a3c', fontWeight:'700'}}>
                  <div className="rsp-pcard-avatar">{p.full_name?.charAt(0)}</div>
                  <span className="rsp-pcard-pid">{p.participant_id}</span>
                </td>
                <td data-label="Name" style={{padding:'10px 14px', fontWeight:'600'}}>
                  {p.full_name}
                  <div className="rsp-pcard-sub">{p.participant_id}</div>
                </td>
                <td data-label="Age" style={{padding:'10px 14px', color:'#6b5e4a'}}>
                  {calcAge(p.date_of_birth)}
                </td>
                <td data-label="Gender" style={{padding:'10px 14px'}}>
                  <span style={{
                    background: p.gender === 'Female' ? '#f5e0e3' : '#dce9f5',
                    color: p.gender === 'Female' ? '#9b2335' : '#1a4068',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>{p.gender}</span>
                </td>
                <td data-label="Completion" style={{padding:'10px 14px', color:'#6b5e4a'}}>
                  {formatDate(p.planned_completion)}
                </td>
                <td data-label="Action" style={{padding:'10px 14px'}}>
                  <div style={{display:'flex', gap:'6px'}}>
                    <button
                      onClick={() => navigate(`/participant/${p.id}`)}
                      style={{
                        background:'#f0ece2', color:'#3d3528',
                        border:'1px solid #d4c9b0', borderRadius:'4px',
                        padding:'5px 12px', fontSize:'11px',
                        fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
                    }}>
                      View Profile
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {participants.length === 0 && (
          <div style={{padding:'32px', textAlign:'center', color:'#6b5e4a'}}>
            No participants found for your LDC.
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
              background: page === 1 ? '#f0ece2' : '#1a1610',
              color: page === 1 ? '#a09080' : '#c49a3c',
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
              <span key={`ellipsis-${idx}`} style={{color:'#a09080', fontSize:'12px'}}>…</span>
            ) : (
              <button key={n} onClick={() => setPage(n)} style={{
                background: page === n ? '#1a1610' : '#f0ece2',
                color: page === n ? '#c49a3c' : '#3d3528',
                border:'none', borderRadius:'5px', padding:'7px 12px',
                fontSize:'12px', fontWeight:'700',
                cursor:'pointer', fontFamily:'inherit', minWidth:'34px'
              }}>{n}</button>
            ))
          }
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              background: page === totalPages ? '#f0ece2' : '#1a1610',
              color: page === totalPages ? '#a09080' : '#c49a3c',
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