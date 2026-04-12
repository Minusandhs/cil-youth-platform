import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminOverview    from '../components/admin/AdminOverview';
import UserManagement   from '../components/admin/UserManagement';
import LDCManagement    from '../components/admin/LDCManagement';
import ParticipantSync  from '../components/admin/ParticipantSync';
import ParticipantList  from '../components/admin/ParticipantList';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  function handleLogout() {
    logout();
    navigate('/login');
  }

const tabs = [
  { id: 'overview',      label: 'Overview'          },
  { id: 'participants',  label: 'Participants'       },
  { id: 'users',         label: 'User Management'   },
  { id: 'ldcs',          label: 'LDC Management'    },
  { id: 'sync',          label: 'Participant Sync'  },
];

  return (
    <div style={{minHeight:'100vh', background:'#faf8f3'}}>
      <header style={{
        background:'#1a1610',
        position:'sticky',
        top:0,
        zIndex:100,
        boxShadow:'0 4px 24px rgba(26,22,16,0.18)'
      }}>
        <div style={{
          maxWidth:'1200px', margin:'0 auto',
          padding:'12px 24px', display:'flex',
          alignItems:'center', gap:'14px'
        }}>
          <div style={{
            background:'#c49a3c', color:'#1a1610',
            fontWeight:'700', fontSize:'10px',
            letterSpacing:'2px', padding:'4px 10px', borderRadius:'2px'
          }}>CIL · TES</div>
          <div style={{flex:1}}>
            <div style={{fontSize:'15px', fontWeight:'700', color:'#e8d4a0'}}>
              Youth Development Platform
            </div>
            <div style={{fontSize:'11px', color:'#a09080'}}>Super Admin Console</div>
          </div>
          <div style={{fontSize:'12px', color:'#a09080', marginRight:'12px'}}>
            {user?.full_name}
          </div>
          <button onClick={handleLogout} style={{
            background:'transparent', border:'1px solid #4a4234',
            color:'#a09080', padding:'6px 14px', borderRadius:'5px',
            fontSize:'12px', cursor:'pointer', fontFamily:'inherit'
          }}>Sign Out</button>
        </div>
        <div style={{borderTop:'1px solid #3a3428'}}>
          <div style={{maxWidth:'1200px', margin:'0 auto', display:'flex', background:'#211e18'}}>
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
        </div>
      </header>
    <main style={{maxWidth:'1200px', margin:'0 auto', padding:'24px'}}>
      {activeTab === 'overview'     && <AdminOverview />}
      {activeTab === 'participants' && <ParticipantList />}
      {activeTab === 'users'        && <UserManagement />}
      {activeTab === 'ldcs'         && <LDCManagement />}
      {activeTab === 'sync'         && <ParticipantSync />}
    </main>
    </div>
  );
}
