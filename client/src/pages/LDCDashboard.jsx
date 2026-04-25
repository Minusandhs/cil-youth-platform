import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Award, Key, LogOut, Menu } from 'lucide-react';
import LDCOverview from '../components/ldc/LDCOverview';
import LDCParticipantList from '../components/ldc/LDCParticipantList';
import LDCTESBatches from '../components/ldc/LDCTESBatches';
import ChangePasswordModal from '../components/common/ChangePasswordModal';
import MobileMenu from '../components/common/MobileMenu';
import ThemeToggle from '../components/common/ThemeToggle';

export default function LDCDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showChangePw, setShowChangePw] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    if (!window.confirm('Are you sure you want to sign out?')) return;
    logout();
    navigate('/login');
  }

  const tabs = [
    { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
    { id: 'participants', label: 'Participants', icon: Users           },
    { id: 'tes',          label: 'TES Batches',  icon: Award           },
  ];

  const userActions = [
    { label: 'Change Password', onClick: () => setShowChangePw(true), icon: Key },
    { label: 'Sign Out', onClick: handleLogout, icon: LogOut, danger: true },
  ];

  return (
    <div style={{minHeight:'100vh', background:'var(--color-bg-page)'}}>

      {/* Header */}
      <header style={{
        background:'var(--color-brand-primary)',
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 4px 24px rgba(0,0,0,0.18)',
        overflow:'visible'
      }}>
        <div className="rsp-header-pad" style={{
          maxWidth:'1200px', margin:'0 auto',
          padding:'12px 24px', display:'flex',
          alignItems:'center', gap:'14px'
        }}>
          {/* Row 1 left: CIL badge */}
          <div className="rsp-header-cil" style={{
            background:'var(--color-brand-accent-lt)', color:'var(--color-text-heading)',
            fontWeight:'700', fontSize:'10px',
            letterSpacing:'2px', padding:'4px 10px', borderRadius:'2px'
          }}>CIL</div>

          {/* Row 2 (mobile) / middle (desktop): title + LDC */}
          <div className="rsp-header-title-wrap">
            <div className="rsp-header-title" style={{
              fontSize:'15px', fontWeight:'700', color:'var(--color-brand-accent-lt)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
            }}>
              Youth Development Platform
            </div>
            <div className="rsp-header-sub" style={{
              fontSize:'11px', color:'var(--color-text-on-dark)',
              whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
            }}>
              {user?.ldc_code} — {user?.ldc_name || 'LDC Staff'}
            </div>
          </div>

          {/* Right: desktop buttons + mobile ☰ */}
          <div className="rsp-header-actions">
            <ThemeToggle />
            <span className="rsp-hide-mobile" style={{fontSize:'12px', color:'var(--color-text-on-dark)', whiteSpace:'nowrap'}}>
              {user?.full_name}
            </span>
            <button onClick={() => setShowChangePw(true)} className="rsp-header-btn rsp-hide-mobile" style={{
              background:'transparent', border:'1px solid var(--color-border-heavy)',
              color:'var(--color-text-on-dark)', padding:'6px 14px', borderRadius:'5px',
              fontSize:'12px', cursor:'pointer', fontFamily:'inherit',
              whiteSpace:'nowrap'
            }}>Change Password</button>
            <button onClick={handleLogout} className="rsp-header-btn rsp-hide-mobile" style={{
              background:'transparent', border:'1px solid var(--color-border-heavy)',
              color:'var(--color-text-on-dark)', padding:'6px 14px', borderRadius:'5px',
              fontSize:'12px', cursor:'pointer', fontFamily:'inherit',
              whiteSpace:'nowrap'
            }}>Sign Out</button>
            {/* Mobile ☰ — highly visible, hidden on desktop */}
            <button
              className="rsp-show-mobile-only"
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'transparent',
                border:'1px solid var(--color-brand-accent-lt)',
                color: 'var(--color-brand-accent-lt)',
                borderRadius:'6px', padding:'6px 8px',
                cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            ><Menu size={20} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          borderTop:'1px solid var(--color-header-border)',
          background:'var(--color-header-tabs-bg)'
        }}>
          <div style={{maxWidth:'1200px', margin:'0 auto', padding:'0 24px'}}>
            {/* Desktop tab bar — bg full width, items aligned with content */}
            <div className="rsp-tabs rsp-tabs-desktop">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  fontSize:'12px', fontWeight:'600',
                  color: activeTab === tab.id ? 'var(--color-brand-accent-lt)' : 'var(--color-text-on-dark)',
                  background:'transparent', border:'none',
                  borderBottom: activeTab === tab.id
                    ? '2px solid var(--color-brand-accent-lt)' : '2px solid transparent',
                  padding:'10px 20px', cursor:'pointer',
                  fontFamily:'inherit', transition:'all 0.2s'
                }}>{tab.label}</button>
              ))}
            </div>
            {/* Mobile active-tab label */}
            <div className="rsp-tabs-mobile" style={{
              alignItems:'center', padding:'0 16px',
              borderBottom:'2px solid var(--color-header-border)'
            }}>
              <span style={{fontSize:'12px', fontWeight:'600', color:'var(--color-brand-accent-lt)', padding:'13px 0'}}>
                {tabs.find(t => t.id === activeTab)?.label}
              </span>
            </div>
          </div>
        </div>

        {/* Modern Mobile Drawer Menu */}
        <MobileMenu 
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          user={user}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userActions={userActions}
        />
      </header>

      {/* Content */}
      <main className="rsp-main" style={{maxWidth:'1200px', margin:'0 auto', padding:'24px'}}>
        {activeTab === 'overview'     && <LDCOverview />}
        {activeTab === 'participants' && <LDCParticipantList />}
        {activeTab === 'tes'          && <LDCTESBatches />}
      </main>
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
    </div>
  );
}