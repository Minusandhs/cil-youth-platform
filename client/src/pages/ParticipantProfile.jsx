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
import ThemeToggle from '../components/common/ThemeToggle';

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
    { id: 'talents', label: 'Talents & Skills', icon: Star },
    { id: 'needs_risks', label: 'Needs & Risks', icon: AlertTriangle },
    { id: 'home_visits', label: 'Home Visits', icon: Home },
    { id: 'tes', label: 'TES History', icon: FileText },
  ];

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      color: 'var(--color-text-subdued)', fontSize: '14px'
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
        <div style={{ color: 'var(--color-danger)', fontSize: '16px' }}>{error}</div>
        <button onClick={() => fromAdmin ? navigate('/admin') : navigate(-1)} style={{
          background: 'var(--color-brand-accent-lt)', color: 'var(--color-text-heading)',
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-page)' }}>

      {/* Header */}
      <header style={{
        background: 'var(--color-brand-primary)', position: 'sticky',
        top: 0, zIndex: 100,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
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
                background: 'var(--color-brand-accent-lt)', color: 'var(--color-text-heading)',
                border: 'none', borderRadius: '20px',
                padding: '6px 14px', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: '700',
                fontSize: '12px', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}><ChevronLeft size={14} strokeWidth={3} /> Back</button>
            <div className="rsp-hide-mobile" style={{
              background: 'var(--color-brand-accent-lt)', color: 'var(--color-text-heading)',
              fontWeight: '700', fontSize: '10px',
              letterSpacing: '2px', padding: '4px 10px', borderRadius: '2px'
            }}>CIL</div>
          </div>

          {/* Row 2 (mobile) / middle (desktop): title + LDC */}
          <div className="rsp-header-title-wrap">
            <div className="rsp-header-title" style={{
              fontSize: '15px', fontWeight: '700', color: 'var(--color-brand-accent-lt)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>Participant Profile</span>
              {participant && !participant.is_active && (
                <span style={{
                  background: 'var(--color-text-subdued)', color: 'var(--color-brand-accent-lt)',
                  padding: '2px 8px', borderRadius: '3px',
                  fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px',
                  whiteSpace: 'nowrap'
                }}>INACTIVE</span>
              )}
            </div>
            <div className="rsp-header-sub" style={{
              fontSize: '11px', color: 'var(--color-text-on-dark)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {participant?.ldc_code} — {participant?.ldc_name}
            </div>
          </div>

          {/* Right: mobile ☰ */}
          <div className="rsp-header-actions">
            <ThemeToggle />
            <button
              className="rsp-show-mobile-only"
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-brand-accent-lt)',
                color: 'var(--color-brand-accent-lt)',
                borderRadius: '6px', padding: '6px 8px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            ><Menu size={20} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          borderTop: '1px solid var(--color-header-border)',
          background: 'var(--color-header-tabs-bg)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            {/* Desktop tab bar — bg full width, items aligned with content */}
            <div className="rsp-tabs rsp-tabs-desktop">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  fontSize: '12px', fontWeight: '600',
                  color: activeTab === tab.id ? 'var(--color-brand-accent-lt)' : 'var(--color-text-on-dark)',
                  background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab.id
                    ? '2px solid var(--color-brand-accent-lt)' : '2px solid transparent',
                  padding: '10px 20px', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s'
                }}>{tab.label}</button>
              ))}
            </div>
            {/* Mobile active-tab label */}
            <div className="rsp-tabs-mobile" style={{
              alignItems: 'center', padding: '0 16px',
              borderBottom: '2px solid var(--color-header-border)'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-brand-accent-lt)', padding: '13px 0' }}>
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
        background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border-subtle)',
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
              background: 'var(--color-brand-primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '700', color: 'var(--color-brand-accent-lt)',
              flexShrink: 0
            }}>
              {participant?.full_name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.3px' }}>
                {participant?.full_name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-subdued)', marginTop: '2px' }}>
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
                    background: participant.is_active ? 'var(--color-danger)' : 'var(--color-success)',
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
                background: participant?.gender === 'Female' ? 'var(--color-tint-danger)' : 'var(--color-tint-info)',
                color: participant?.gender === 'Female' ? 'var(--color-danger)' : 'var(--color-info)',
                padding: '4px 12px', borderRadius: '12px',
                fontSize: '11px', fontWeight: '700'
              }}>
                {participant?.gender}
              </span>
            </div>
            {/* Row 2 col 2 — Age */}
            <div className="rsp-sumbar-stat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-heading)' }}>
                {calcAge(participant?.date_of_birth)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-subdued)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Age
              </div>
            </div>
            {/* Row 3 col 1 — DOB */}
            <div className="rsp-sumbar-stat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-heading)' }}>
                {formatDate(participant?.date_of_birth)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-subdued)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                DOB
              </div>
            </div>
            {/* Row 3 col 2 — Completion */}
            <div className="rsp-sumbar-stat" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-heading)' }}>
                {formatDate(participant?.planned_completion)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-subdued)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
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
                  background: participant.is_active ? 'var(--color-danger)' : 'var(--color-success)',
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
          background: 'var(--color-bg-stripe)', borderBottom: '2px solid var(--color-text-subdued)',
          padding: '10px 24px'
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', color: 'var(--color-text-heading)', fontWeight: '600'
          }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            This participant is inactive. They are hidden from LDC staff. Use the Reactivate button to restore access.
          </div>
        </div>
      )}

      {/* Locked Banner — shown to LDC staff when participant is inactive */}
      {participant && !participant.is_active && isLDCStaff && (
        <div style={{
          background: 'var(--color-tint-warning)', borderBottom: '2px solid var(--color-warning)',
          padding: '10px 24px'
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '13px', color: 'var(--color-warning)', fontWeight: '600'
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