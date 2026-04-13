import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import PersonalInfo     from '../components/participant/PersonalInfo';
import AcademicRecords  from '../components/participant/AcademicRecords';
import Certifications   from '../components/participant/Certifications';
import DevelopmentPlan  from '../components/participant/DevelopmentPlan';
import TESHistory from '../components/participant/TESHistory';

export default function ParticipantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromAdmin = new URLSearchParams(location.search).get('from') === 'admin';
  const { user, isLDCStaff, isSuperAdmin } = useAuth();
  const [participant,  setParticipant ] = useState(null);
  const [loading,      setLoading     ] = useState(true);
  const [activeTab,    setActiveTab   ] = useState('personal');
  const [error,        setError       ] = useState('');
  const [toggling,     setToggling    ] = useState(false);

  useEffect(() => { loadParticipant(); }, [id]);

  async function loadParticipant() {
    try {
      const res = await api.get(`/api/participants/${id}`);
      setParticipant(res.data);
    } catch {
      setError('Failed to load participant');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive() {
    const action = participant.is_active ? 'deactivate' : 'reactivate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${participant.full_name}?`)) return;
    setToggling(true);
    try {
      await api.patch(`/api/participants/${id}/active`, { is_active: !participant.is_active });
      await loadParticipant();
    } catch {
      setError(`Failed to ${action} participant`);
    } finally {
      setToggling(false);
    }
  }

  function calcAge(dob) {
    if (!dob) return '—';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB');
  }

  const tabs = [
    { id: 'personal',     label: 'Personal Info'     },
    { id: 'academic',     label: 'Academic Records'  },
    { id: 'certs',        label: 'Certifications'    },
    { id: 'development',  label: 'Development Plan'  },
    { id:'tes',           label:'TES History'        },
  ];

  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center',
      justifyContent:'center', height:'100vh',
      color:'#6b5e4a', fontSize:'14px'
    }}>
      Loading participant...
    </div>
  );

  if (error) return (
    <div style={{
      display:'flex', alignItems:'center',
      justifyContent:'center', height:'100vh'
    }}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:'48px', marginBottom:'16px'}}>⚠️</div>
        <div style={{color:'#9b2335', fontSize:'16px'}}>{error}</div>
          <button onClick={() => fromAdmin ? navigate('/admin') : navigate(-1)} style={{
            marginTop:'16px', background:'#1a1610',
            color:'#c49a3c', border:'none', borderRadius:'6px',
            padding:'10px 20px', cursor:'pointer', fontFamily:'inherit'
          }}>Go Back</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh', background:'#faf8f3'}}>

      {/* Header */}
      <header style={{
        background:'#1a1610', position:'sticky',
        top:0, zIndex:100,
        boxShadow:'0 4px 24px rgba(26,22,16,0.18)'
      }}>
        <div style={{
          maxWidth:'1200px', margin:'0 auto',
          padding:'12px 24px', display:'flex',
          alignItems:'center', gap:'14px'
        }}>
          <button onClick={() => fromAdmin ? navigate('/admin') : navigate(-1)} style={{
            marginTop:'16px', background:'#1a1610',
            color:'#c49a3c', border:'none', borderRadius:'6px',
            padding:'10px 20px', cursor:'pointer', fontFamily:'inherit'
          }}>Go Back</button>
          <div style={{
            background:'#c49a3c', color:'#1a1610',
            fontWeight:'700', fontSize:'10px',
            letterSpacing:'2px', padding:'4px 10px', borderRadius:'2px'
          }}>CIL · TES</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px', fontWeight:'700', color:'#e8d4a0'}}>
              Participant Profile
              {participant && !participant.is_active && (
                <span style={{
                  marginLeft:'10px', background:'#6b5e4a',
                  color:'#e8d4a0', padding:'2px 8px',
                  borderRadius:'3px', fontSize:'10px',
                  fontWeight:'700', letterSpacing:'0.5px'
                }}>INACTIVE</span>
              )}
            </div>
            <div style={{fontSize:'11px', color:'#a09080'}}>
              {participant?.ldc_code} — {participant?.ldc_name}
            </div>
          </div>
          {/* Admin — Deactivate / Reactivate */}
          {isSuperAdmin && participant && (
            <button
              onClick={toggleActive}
              disabled={toggling}
              style={{
                background: participant.is_active ? '#9b2335' : '#2d6a4f',
                color:'#fff', border:'none', borderRadius:'6px',
                padding:'8px 16px', fontSize:'12px', fontWeight:'700',
                cursor: toggling ? 'not-allowed' : 'pointer',
                fontFamily:'inherit', opacity: toggling ? 0.7 : 1
              }}
            >
              {toggling ? '...' : participant.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{borderTop:'1px solid #3a3428'}}>
          <div style={{
            maxWidth:'1200px', margin:'0 auto',
            display:'flex', background:'#211e18'
          }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                fontSize:'12px', fontWeight:'600',
                color: activeTab === tab.id ? '#c49a3c' : '#a09080',
                background:'transparent', border:'none',
                borderBottom: activeTab === tab.id
                  ? '2px solid #c49a3c' : '2px solid transparent',
                padding:'10px 20px', cursor:'pointer',
                fontFamily:'inherit', transition:'all 0.2s'
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Participant Summary Bar */}
      <div style={{
        background:'#fffef9', borderBottom:'1px solid #d4c9b0',
        padding:'16px 24px'
      }}>
        <div style={{
          maxWidth:'1200px', margin:'0 auto',
          display:'flex', alignItems:'center',
          gap:'24px', flexWrap:'wrap'
        }}>
          {/* Avatar */}
          <div style={{
            width:'52px', height:'52px', borderRadius:'50%',
            background:'#1a1610', display:'flex',
            alignItems:'center', justifyContent:'center',
            fontSize:'20px', fontWeight:'700', color:'#c49a3c',
            flexShrink:0
          }}>
            {participant?.full_name?.charAt(0)}
          </div>
          {/* Name & ID */}
          <div style={{flex:1}}>
            <div style={{fontSize:'18px', fontWeight:'700', letterSpacing:'-0.3px'}}>
              {participant?.full_name}
            </div>
            <div style={{fontSize:'12px', color:'#6b5e4a', marginTop:'2px'}}>
              {participant?.participant_id} · {participant?.ldc_code}
            </div>
          </div>
          {/* Quick Stats */}
          {[
            { label:'Age',    value: calcAge(participant?.date_of_birth)     },
            { label:'Gender', value: participant?.gender || '—'              },
            { label:'DOB',    value: formatDate(participant?.date_of_birth)  },
            { label:'Completion', value: formatDate(participant?.planned_completion) },
          ].map(s => (
            <div key={s.label} style={{textAlign:'center'}}>
              <div style={{fontSize:'15px', fontWeight:'700', color:'#1a1610'}}>
                {s.value}
              </div>
              <div style={{
                fontSize:'10px', color:'#a09080',
                textTransform:'uppercase', letterSpacing:'0.4px'
              }}>
                {s.label}
              </div>
            </div>
          ))}
          {/* Gender Badge */}
          <span style={{
            background: participant?.gender === 'Female' ? '#f5e0e3' : '#dce9f5',
            color: participant?.gender === 'Female' ? '#9b2335' : '#1a4068',
            padding:'4px 12px', borderRadius:'12px',
            fontSize:'11px', fontWeight:'700'
          }}>
            {participant?.gender}
          </span>
          {/* Exited Badge */}
          {participant?.is_exited && (
            <span style={{
              background:'#f5e0c8', color:'#7a4f1a',
              padding:'4px 12px', borderRadius:'12px',
              fontSize:'11px', fontWeight:'700',
              border:'1px solid #d4956a'
            }}>
              EXITED
            </span>
          )}
        </div>
      </div>

      {/* Inactive Banner — shown to admin when participant is deactivated */}
      {participant && !participant.is_active && isSuperAdmin && (
        <div style={{
          background:'#f0ece2', borderBottom:'2px solid #6b5e4a',
          padding:'10px 24px'
        }}>
          <div style={{
            maxWidth:'1200px', margin:'0 auto',
            display:'flex', alignItems:'center', gap:'10px',
            fontSize:'13px', color:'#3d3528', fontWeight:'600'
          }}>
            <span style={{fontSize:'16px'}}>⚠️</span>
            This participant is inactive. They are hidden from LDC staff. Use the Reactivate button to restore access.
          </div>
        </div>
      )}

      {/* Locked Banner — shown to LDC staff when participant is exited */}
      {participant?.is_exited && isLDCStaff && (
        <div style={{
          background:'#fef3e2', borderBottom:'2px solid #d4956a',
          padding:'10px 24px'
        }}>
          <div style={{
            maxWidth:'1200px', margin:'0 auto',
            display:'flex', alignItems:'center', gap:'10px',
            fontSize:'13px', color:'#7a4f1a', fontWeight:'600'
          }}>
            <span style={{fontSize:'16px'}}>🔒</span>
            This participant has exited the program. Their profile is view-only — editing is disabled.
          </div>
        </div>
      )}

      {/* Tab Content */}
      <main style={{maxWidth:'1200px', margin:'0 auto', padding:'24px'}}>
        {activeTab === 'personal'    && (
          <PersonalInfo
            participant={participant}
            onUpdate={loadParticipant}
            readOnly={isLDCStaff && !!participant?.is_exited}
          />
        )}
        {activeTab === 'academic'    && (
          <AcademicRecords
            participantId={id}
            participant={participant}
            readOnly={isLDCStaff && !!participant?.is_exited}
          />
        )}
        {activeTab === 'certs'       && (
          <Certifications
            participantId={id}
            readOnly={isLDCStaff && !!participant?.is_exited}
          />
        )}
        {activeTab === 'development' && (
          <DevelopmentPlan
            participantId={id}
            participant={participant}
            readOnly={isLDCStaff && !!participant?.is_exited}
          />
        )}
          {activeTab === 'tes' && participant && (
            <TESHistory participantId={participant.id} />
          )}
      </main>
    </div>
  );
}