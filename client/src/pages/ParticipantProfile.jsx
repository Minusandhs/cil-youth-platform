import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  User, GraduationCap, Award, TrendingUp,
  FileText, Menu, ChevronLeft, AlertTriangle, Home, Star, Briefcase
} from 'lucide-react';
import api from '../lib/api';
import PersonalInfo from '../components/participant/PersonalInfo';
import AcademicRecords from '../components/participant/AcademicRecords';
import Certifications from '../components/participant/Certifications';
import DevelopmentPlan from '../components/participant/DevelopmentPlan';
import TESHistory from '../components/participant/TESHistory';
import NeedsRisks from '../components/participant/NeedsRisks';
import HomeVisits from '../components/participant/HomeVisits';
import Talents from '../components/participant/Talents';
import Career from '../components/participant/Career';
import MobileMenu from '../components/common/MobileMenu';

export default function ParticipantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromAdmin = searchParams.get('from') === 'admin';
  const initialTab = searchParams.get('tab') || 'personal';
  const { user, isLDCStaff, isSuperAdmin, isNationalAdmin } = useAuth();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'academic', label: 'Academic Records', icon: GraduationCap },
    { id: 'certs', label: 'Certifications', icon: Award },
    { id: 'development', label: 'Development Plan', icon: TrendingUp },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'talents', label: 'Talents', icon: Star },
    { id: 'needs_risks', label: 'Needs & Risks', icon: AlertTriangle },
    { id: 'home_visits', label: 'Home Visits', icon: Home },
    { id: 'tes', label: 'TES History', icon: FileText },
  ];

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      color: '#6b5e4a', fontSize: '14px'
    }}>
      Loading participant...
    </div>
  );

  if (error) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ color: '#9b2335', fontSize: '16px' }}>{error}</div>
        <button onClick={() => fromAdmin ? navigate('/admin') : navigate(-1)} style={{
          background: '#c49a3c', color: '#1a1610',
          border: 'none', borderRadius: '20px',
          padding: '6px 16px', cursor: 'pointer',
          fontFamily: 'inherit', fontWeight: '700',
          fontSize: '12px', letterSpacing: '0.5px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>← Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f3' }}>

      {/* Header */}
      <header style={{
        background: '#1a1610', position: 'sticky',
        top: 0, zIndex: 100,
        boxShadow: '0 4px 24px rgba(26,22,16,0.18)',
        overflow: 'visible'
      }}>
        <div className="rsp-header-pad" style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '12px 24px', display: 'flex',
          alignItems: 'center', gap: '14px'
        }}>
          {/* Row 1 left: Back + CIL badge */}
          <div className="rsp-header-cil" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => fromAdmin ? navigate('/admin') : navigate(-1)}
              className="rsp-header-btn"
              style={{
                background: '#c49a3c', color: '#1a1610',
                border: 'none', borderRadius: '20px',
                padding: '6px 14px', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: '700',
                fontSize: '12px', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><ChevronLeft size={14} strokeWidth={3} /> Back</button>
            <div className="rsp-hide-mobile" style={{
              background: '#c49a3c', color: '#1a1610',
              fontWeight: '700', fontSize: '10px',
              letterSpacing: '2px', padding: '4px 10px', borderRadius: '2px'
            }}>CIL</div>
          </div>

          {/* Row 2 (mobile) / middle (desktop): title + LDC */}
          <div className="rsp-header-title-wrap">
            <div className="rsp-header-title" style={{
              fontSize: '15px', fontWeight: '700', color: '#e8d4a0',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>Participant Profile</span>
              {participant && !participant.is_active && (
                <span style={{
                  background: '#6b5e4a', color: '#e8d4a0',
                  padding: '2px 8px', borderRadius: '3px',
                  fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
                  whiteSpace: 'nowrap'
                }}>INACTIVE</span>
              )}
            </div>
            <div className="rsp-header-sub" style={{
              fontSize: '11px', color: '#a09080',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {participant?.ldc_code} — {participant?.ldc_name}
            </div>
          </div>

          {/* Right: mobile ☰ */}
          <div className="rsp-header-actions">
            <button
              className="rsp-show-mobile-only"
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid #c49a3c',
                color: '#c49a3c',
                borderRadius: '6px', padding: '6px 8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            ><Menu size={20} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderTop: '1px solid #3a3428' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Desktop tab bar */}
            <div className="rsp-tabs rsp-tabs-desktop">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  fontSize: '12px', fontWeight: '600',
                  color: activeTab === tab.id ? '#c49a3c' : '#a09080',
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab.id
                    ? '2px solid #c49a3c' : '2px solid transparent',
                  padding: '10px 20px', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s'
                }}>{tab.label}</button>
              ))}
            </div>
            {/* Mobile active-tab label */}
            <div className="rsp-tabs-mobile" style={{
              alignItems: 'center', padding: '0 16px',
              borderBottom: '2px solid #3a3428'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#c49a3c', padding: '13px 0' }}>
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
        />
      </header>

      {/* Participant Summary Bar */}
      <div style={{
        background: '#fffef9', borderBottom: '1px solid #d4c9b0',
        padding: '16px 24px'
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', alignItems: 'center',
          gap: '24px', flexWrap: 'wrap'
        }}>

          {/* Row 1 — Avatar + Name/ID (always a row) */}
          <div className="rsp-sumbar-identity">
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#1a1610', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '700', color: '#c49a3c',
              flexShrink: 0
            }}>
              {participant?.full_name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
                {participant?.full_name}
              </div>
              <div style={{ fontSize: '12px', color: '#6b5e4a', marginTop: '2px' }}>
                {participant?.participant_id} · {participant?.ldc_code}
              </div>
              {/* Desktop only: Deactivate/Reactivate below name */}
              {isSuperAdmin && !isNationalAdmin && participant && (
                <button
                  onClick={toggleActive}
                  disabled={toggling}
                  className="rsp-hide-mobile"
                  style={{
                    marginTop: '8px',
                    background: participant.is_active ? '#9b2335' : '#2d6a4f',
                    color: '#fff', border: 'none', borderRadius: '6px',
                    padding: '5px 14px', fontSize: '11px', fontWeight: '700',
                    cursor: toggling ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: toggling ? 0.7 : 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {toggling ? '...' : participant.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>

          {/* Rows 2 & 3 — Stats (desktop: flex row / mobile: 2×2 grid) */}
          <div className="rsp-sumbar-stats">
            {/* Row 2 col 1 — Gender badge */}
            <div className="rsp-sumbar-gender-cell">
              <span style={{
                background: participant?.gender === 'Female' ? '#f5e0e3' : '#dce9f5',
                color: participant?.gender === 'Female' ? '#9b2335' : '#1a4068',
                padding: '4px 12px', borderRadius: '12px',
                fontSize: '11px', fontWeight: '700'
              }}>
                {participant?.gender}
              </span>
            </div>
            {/* Row 2 col 2 — Age */}
            <div className="rsp-sumbar-stat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1610' }}>
                {calcAge(participant?.date_of_birth)}
              </div>
              <div style={{ fontSize: '10px', color: '#a09080', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Age
              </div>
            </div>
            {/* Row 3 col 1 — DOB */}
            <div className="rsp-sumbar-stat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1610' }}>
                {formatDate(participant?.date_of_birth)}
              </div>
              <div style={{ fontSize: '10px', color: '#a09080', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                DOB
              </div>
            </div>
            {/* Row 3 col 2 — Completion */}
            <div className="rsp-sumbar-stat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1610' }}>
                {formatDate(participant?.planned_completion)}
              </div>
              <div style={{ fontSize: '10px', color: '#a09080', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Completion
              </div>
            </div>
          </div>

          {/* Mobile only — Deactivate/Reactivate full-width */}
          {isSuperAdmin && !isNationalAdmin && participant && (
            <div className="rsp-show-mobile-only" style={{ width: '100%' }}>
              <button
                onClick={toggleActive}
                disabled={toggling}
                style={{
                  width: '100%',
                  background: participant.is_active ? '#9b2335' : '#2d6a4f',
                  color: '#fff', border: 'none', borderRadius: '6px',
                  padding: '8px 14px', fontSize: '12px', fontWeight: '700',
                  cursor: toggling ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', opacity: toggling ? 0.7 : 1,
                }}
              >
                {toggling ? '...' : participant.is_active ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Inactive Banner — shown to admin when participant is deactivated */}
      {participant && !participant.is_active && isSuperAdmin && (
        <div style={{
          background: '#f0ece2', borderBottom: '2px solid #6b5e4a',
          padding: '10px 24px'
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', color: '#3d3528', fontWeight: '600'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            This participant is inactive. They are hidden from LDC staff. Use the Reactivate button to restore access.
          </div>
        </div>
      )}

      {/* Locked Banner — shown to LDC staff when participant is inactive */}
      {participant && !participant.is_active && isLDCStaff && (
        <div style={{
          background: '#fef3e2', borderBottom: '2px solid #d4956a',
          padding: '10px 24px'
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', color: '#7a4f1a', fontWeight: '600'
          }}>
            <span style={{ fontSize: '16px' }}>🔒</span>
            This participant is inactive. Their profile is view-only — editing is disabled.
          </div>
        </div>
      )}

      {/* Tab Content */}
      <main className="rsp-main" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'personal' && (
          <PersonalInfo
            participant={participant}
            onUpdate={loadParticipant}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
        {activeTab === 'academic' && (
          <AcademicRecords
            participantId={id}
            participant={participant}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
        {activeTab === 'certs' && (
          <Certifications
            participantId={id}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
        {activeTab === 'development' && (
          <DevelopmentPlan
            participantId={id}
            participant={participant}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
        {activeTab === 'tes' && participant && (
          <TESHistory participantId={participant.id} />
        )}
        {activeTab === 'needs_risks' && participant && (
          <NeedsRisks
            participantId={participant.id}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
        {activeTab === 'home_visits' && participant && (
          <HomeVisits
            participantId={participant.id}
            participant={participant}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
        {activeTab === 'talents' && participant && (
          <Talents
            participantId={participant.id}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
        {activeTab === 'career' && participant && (
          <Career
            participantId={participant.id}
            readOnly={isNationalAdmin || (isLDCStaff && !participant?.is_active)}
          />
        )}
      </main>
    </div>
  );
}