import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/common/ChangePasswordModal';
import AdminOverview    from '../components/admin/AdminOverview';
import UserManagement   from '../components/admin/UserManagement';
import LDCManagement    from '../components/admin/LDCManagement';
import ParticipantSync  from '../components/admin/ParticipantSync';
import ParticipantList  from '../components/admin/ParticipantList';
import ReferenceData from '../components/admin/ReferenceData';
import TESManagement from '../components/admin/TESManagement';

export default function AdminDashboard() {
  const { user, logout, isNationalAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showChangePw, setShowChangePw] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    logout();
    navigate('/login');
  }

  const allTabs = [
    { id: 'overview',      label: 'Overview'         },
    { id: 'participants',  label: 'Participants'     },
    { id: 'users',         label: 'User Management'  },
    { id: 'ldcs',          label: 'LDC Management'   },
    { id: 'sync',          label: 'Participant Sync', adminOnly: true },
    { id: 'reference',     label: 'Reference Data'   },
    { id: 'tes',           label: 'TES Batches'      },
  ];
  const nationalAdminAllowed = ['overview', 'participants', 'tes'];
  const tabs = isNationalAdmin
    ? allTabs.filter(t => nationalAdminAllowed.includes(t.id))
    : allTabs;

  return (
    <div style={{minHeight:'100vh', background:'#faf8f3'}}>
      <header style={{
        background:'#1a1610',
        position:'sticky',
        top:0,
        zIndex:100,
        boxShadow:'0 4px 24px rgba(26,22,16,0.18)',
        overflow:'visible'
      }}>
        <div className="rsp-header-pad" style={{
          maxWidth:'1200px', margin:'0 auto',
          padding:'12px 24px', display:'flex',
          alignItems:'center', gap:'14px'
        }}>
          {/* Row 1 left: CIL badge */}
          <div className="rsp-header-cil" style={{
            background:'#c49a3c', color:'#1a1610',
            fontWeight:'700', fontSize:'10px',
            letterSpacing:'2px', padding:'4px 10px', borderRadius:'2px'
          }}>CIL</div>

          {/* Row 2 (mobile) / middle (desktop): title + subtitle */}
          <div className="rsp-header-title-wrap">
            <div className="rsp-header-title" style={{
              fontSize:'15px', fontWeight:'700', color:'#e8d4a0',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
            }}>
              Youth Development Platform
            </div>
            <div className="rsp-header-sub" style={{fontSize:'11px', color:'#a09080'}}>
              {isNationalAdmin ? 'National Office — Read Only' : 'Super Admin Console'}
            </div>
          </div>

          {/* Right: desktop buttons + mobile ☰ */}
          <div className="rsp-header-actions">
            <span className="rsp-hide-mobile" style={{fontSize:'12px', color:'#a09080', whiteSpace:'nowrap'}}>
              {user?.full_name}
            </span>
            <button onClick={() => setShowChangePw(true)} className="rsp-header-btn rsp-hide-mobile" style={{
              background:'transparent', border:'1px solid #4a4234',
              color:'#a09080', padding:'6px 14px', borderRadius:'5px',
              fontSize:'12px', cursor:'pointer', fontFamily:'inherit',
              whiteSpace:'nowrap'
            }}>Change Password</button>
            <button onClick={handleLogout} className="rsp-header-btn rsp-hide-mobile" style={{
              background:'transparent', border:'1px solid #4a4234',
              color:'#a09080', padding:'6px 14px', borderRadius:'5px',
              fontSize:'12px', cursor:'pointer', fontFamily:'inherit',
              whiteSpace:'nowrap'
            }}>Sign Out</button>
            {/* Mobile ☰ — highly visible, hidden on desktop */}
            <button
              className="rsp-show-mobile-only"
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: menuOpen ? '#c49a3c' : 'transparent',
                border:'1px solid #c49a3c',
                color: menuOpen ? '#1a1610' : '#c49a3c',
                borderRadius:'6px', padding:'6px 11px',
                cursor:'pointer', fontSize:'17px', lineHeight:1,
                fontFamily:'inherit', fontWeight:'700'
              }}
            >☰</button>
          </div>
        </div>
        <div style={{borderTop:'1px solid #3a3428'}}>
          <div style={{maxWidth:'1200px', margin:'0 auto'}}>
            {/* Desktop tab bar */}
            <div className="rsp-tabs rsp-tabs-desktop">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  fontSize:'12px', fontWeight:'600',
                  color: activeTab === tab.id ? '#c49a3c' : '#a09080',
                  background:'transparent', border:'none',
                  borderBottom: activeTab === tab.id ? '2px solid #c49a3c' : '2px solid transparent',
                  padding:'10px 20px', cursor:'pointer',
                  fontFamily:'inherit', transition:'all 0.2s'
                }}>{tab.label}</button>
              ))}
            </div>
            {/* Mobile active-tab label */}
            <div className="rsp-tabs-mobile" style={{
              alignItems:'center', padding:'0 16px',
              borderBottom:'2px solid #3a3428'
            }}>
              <span style={{fontSize:'12px', fontWeight:'600', color:'#c49a3c', padding:'13px 0'}}>
                {tabs.find(t => t.id === activeTab)?.label}
              </span>
            </div>
          </div>
        </div>
        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="rsp-tabs-mobile" style={{
            flexDirection:'column',
            position:'absolute', top:'100%', left:0, right:0,
            background:'#1a1610', borderTop:'1px solid #3a3428',
            zIndex:200, boxShadow:'0 8px 24px rgba(0,0,0,0.3)'
          }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMenuOpen(false); }} style={{
                display:'block', width:'100%', textAlign:'left',
                fontSize:'13px', fontWeight: activeTab === tab.id ? '700' : '500',
                color: activeTab === tab.id ? '#c49a3c' : '#a09080',
                background: activeTab === tab.id ? '#2a2418' : 'transparent',
                border:'none', borderBottom:'1px solid #3a3428',
                padding:'14px 20px', cursor:'pointer', fontFamily:'inherit'
              }}>{tab.label}</button>
            ))}
            {/* User actions — visually separated section */}
            <div style={{background:'#111009', borderTop:'2px solid #3a3428'}}>
              <div style={{padding:'8px 20px 4px', fontSize:'10px', fontWeight:'700', color:'#5a5040', letterSpacing:'1px', textTransform:'uppercase'}}>
                Account
              </div>
              <button onClick={() => { setShowChangePw(true); setMenuOpen(false); }} style={{
                display:'block', width:'100%', textAlign:'left',
                fontSize:'13px', fontWeight:'500',
                color:'#a09080', background:'transparent',
                border:'none', borderBottom:'1px solid #2a2418',
                padding:'12px 20px', cursor:'pointer', fontFamily:'inherit'
              }}>Change Password</button>
              <button onClick={() => { handleLogout(); }} style={{
                display:'block', width:'100%', textAlign:'left',
                fontSize:'13px', fontWeight:'600',
                color:'#e07070', background:'transparent',
                border:'none',
                padding:'12px 20px', cursor:'pointer', fontFamily:'inherit'
              }}>Sign Out</button>
            </div>
          </div>
        )}
      </header>
    <main className="rsp-main" style={{maxWidth:'1200px', margin:'0 auto', padding:'24px'}}>
      {activeTab === 'overview'     && <AdminOverview />}
      {activeTab === 'participants' && <ParticipantList readOnly={isNationalAdmin} />}
      {activeTab === 'users'        && <UserManagement     readOnly={isNationalAdmin} />}
      {activeTab === 'ldcs'         && <LDCManagement      readOnly={isNationalAdmin} />}
      {activeTab === 'sync'         && <ParticipantSync    readOnly={isNationalAdmin} />}
      {activeTab === 'reference'    && <ReferenceData       readOnly={isNationalAdmin} />}
      {activeTab === 'tes'          && <TESManagement      readOnly={isNationalAdmin} />}
    </main>
    {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
