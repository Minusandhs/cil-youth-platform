import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { statusLabel } from '../../lib/constants';
import { useDashboardSummary } from '../../lib/useDashboardSummary';
import { exportToCsv } from '../../lib/csvExport';
import {
  HeroStats, ParticipantDemographics, AcademicSection,
  DevelopmentSection, NeedsRisksSection, HomeVisitsSection, TalentsSection,
  DashboardMeta,
} from '../common/DashboardSections';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB');
}

const card = {
  background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
  borderRadius: '8px', padding: '20px',
  boxShadow: '0 2px 8px rgba(26,22,16,0.06)',
};

const sectionTitle = {
  fontSize: '15px', fontWeight: '700',
  marginBottom: '16px', color: 'var(--color-text-heading)',
  paddingBottom: '10px', borderBottom: '1px solid var(--color-divider)',
};

export default function LDCOverview() {
  const { user } = useAuth();
  const [exporting,   setExporting  ] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportType,  setExportType ] = useState('participants');

  const { data: summary, loading: summaryLoading } = useDashboardSummary();

  // ── Export helpers ──────────────────────────────────────────────
  async function doExport(key, endpoint, buildRows, filename) {
    setExporting(key);
    setExportError('');
    try {
      const res = await api.get(endpoint);
      const rows = buildRows(res.data);
      const ldcCode = user?.ldc_code || 'LDC';
      const datePart = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      exportToCsv(`${filename}_${ldcCode}_${datePart}.csv`, rows);
    } catch (e) {
      setExportError('Export failed: ' + e.message);
    } finally {
      setExporting('');
    }
  }

  function exportParticipants() {
    doExport('participants', '/api/participants/export/participants', data =>
      data.map(p => ({
        'Participant ID'      : p.participant_id,
        'Full Name'           : p.full_name,
        'LDC Code'            : p.ldc_code,
        'Date of Birth'       : fmtDate(p.date_of_birth),
        'Gender'              : p.gender || '',
        'Planned Completion'  : fmtDate(p.planned_completion),
        'Active'              : p.is_active ? 'Yes' : 'No',
        'Current Status'      : statusLabel(p.current_status),
        'Marital Status'      : p.marital_status || '',
        'No of Children'      : p.number_of_children ?? '',
        'Pregnant'            : p.is_pregnant ? 'Yes' : 'No',
        'Living Outside LDC'  : p.living_outside_ldc ? 'Yes' : 'No',
        'Outside Purpose'     : p.outside_purpose || '',
        'Outside Location'    : p.outside_location || '',
        'OL Status'           : p.ol_status || '',
        'AL Status'           : p.al_status || '',
        'Family Income (LKR)' : p.family_income || '',
        'No of Dependants'    : p.no_of_dependants ?? '',
        'Other Assistance'    : p.other_assistance || '',

        'Long Term Plan'      : p.long_term_plan || '',
        'Career Goal'         : p.career_goal || '',
        'OL Results'          : p.ol_results || '',
        'AL Results'          : p.al_results || '',
        'Certifications'      : p.certifications || '',
      })),
      'Participants'
    );
  }

  function exportAcademic() {
    doExport('academic', '/api/participants/export/academic', data => {
      const rows = [];
      for (const r of data.ol) {
        rows.push({
          'Participant ID': r.participant_id, 'Full Name': r.full_name,
          'LDC': r.ldc_code, 'Level': 'OL', 'Exam Year': r.exam_year,
          'School': r.school_name || '', 'No of Passes': r.no_of_passes ?? '',
          'Verified': r.results_verified ? 'Yes' : 'No',
          'Subject': r.subject_name || '', 'Grade': r.grade || '',
          'Subject Type': r.subject_type || '', 'Stream': '', 'Medium': '', 'Z-Score': '',
        });
      }
      for (const r of data.al) {
        rows.push({
          'Participant ID': r.participant_id, 'Full Name': r.full_name,
          'LDC': r.ldc_code, 'Level': 'AL', 'Exam Year': r.exam_year,
          'School': r.school_name || '', 'No of Passes': '',
          'Verified': r.results_verified ? 'Yes' : 'No',
          'Subject': r.subject_name || '', 'Grade': r.grade || '',
          'Subject Type': r.subject_type || '', 'Stream': r.stream || '',
          'Medium': r.medium || '', 'Z-Score': r.z_score ?? '',
        });
      }
      return rows;
    }, 'Academic_Records');
  }

  function exportCertifications() {
    doExport('certifications', '/api/participants/export/certifications', data =>
      data.map(c => ({
        'Participant ID': c.participant_id, 'Full Name': c.full_name, 'LDC': c.ldc_code,
        'Cert Type': c.cert_type, 'Certificate': c.cert_name,
        'Issuing Body': c.issuing_body || '', 'Issued Date': fmtDate(c.issued_date),
        'Expiry Date': fmtDate(c.expiry_date), 'Grade / Result': c.grade_result || '',
        'NVQ Level': c.nvq_level || '', 'Verified': c.results_verified ? 'Yes' : 'No',
        'Notes': c.notes || '',
      })),
      'Certifications'
    );
  }

  function exportDevelopment() {
    doExport('development', '/api/participants/export/development', data =>
      data.map(d => ({
        'Participant ID'       : d.participant_id,
        'Full Name'            : d.full_name,
        'LDC'                  : d.ldc_code,
        'Plan Year'            : d.plan_year,
        'Spiritual Goal'       : d.spiritual_goal || '',
        'Academic Goal'        : d.academic_goal || '',
        'Social Goal'          : d.social_goal || '',
        'Vocational Goal'      : d.vocational_goal || '',
        'Health Goal'          : d.health_goal || '',
        'Primary Mentor'       : d.primary_mentor || '',
        'Progress Status'      : d.progress_status || '',
        'Completion %'         : d.completion_rate ?? '',
        'Action Items'         : d.action_items || '',
        'Mentor Conversations' : d.conversation_count ?? 0,
        'Last Conversation'    : fmtDate(d.last_conversation_date),
        'Next Meeting'         : fmtDate(d.next_meeting_date),
        'Created'              : fmtDate(d.created_at),
        'Updated'              : fmtDate(d.updated_at),
      })),
      'Development_Plans'
    );
  }

  function exportCareer() {
    doExport('career', '/api/participants/export/career', data =>
      data.map(c => ({
        'Participant ID'      : c.participant_id,
        'Full Name'           : c.full_name,
        'LDC'                 : c.ldc_code,
        'Career Aspiration'   : c.career_aspiration || '',
        'Aspired Industry'    : c.aspired_industry || '',
        'Long Term Plan'      : c.long_term_plan || '',
        'Further Education'   : c.further_education ? 'Yes' : 'No',
        'Education Details'   : c.education_details || '',
        'Interested to Apply' : c.interested_to_apply ? 'Yes' : 'No',
        'Preferred Industry'  : c.interest_industry || '',
        'Job Interest Notes'  : c.interest_notes || '',
        'Holland Code'        : [c.holland_primary, c.holland_secondary, c.holland_tertiary]
                                  .filter(Boolean).join('') || '',
        'Career Choice 1'     : c.career_choice_1 || '',
        'Career Choice 2'     : c.career_choice_2 || '',
        'Career Choice 3'     : c.career_choice_3 || '',
        'Readiness Checklist' : c.readiness_checklist || '',
        'Created'             : fmtDate(c.created_at),
        'Updated'             : fmtDate(c.updated_at),
      })),
      'Career_Plans'
    );
  }

  function exportTalents() {
    doExport('talents', '/api/participants/export/talents', data =>
      data.map(t => ({
        'Participant ID' : t.participant_id,
        'Full Name'      : t.full_name,
        'LDC'            : t.ldc_code,
        'Category'       : t.category || '',
        'Talent'         : t.talent || '',
        'Level'          : t.level || '',
        'Notes'          : t.notes || '',
        'Recorded'       : fmtDate(t.created_at),
        'Last Updated'   : fmtDate(t.updated_at),
      })),
      'Talents_and_Skills'
    );
  }

  function exportNeedsRisks() {
    doExport('needs_risks', '/api/participants/export/needs-risks', data =>
      data.map(n => ({
        'Participant ID' : n.participant_id,
        'Full Name'      : n.full_name,
        'LDC'            : n.ldc_code,
        'Type'           : n.type || '',
        'Category'       : n.category || '',
        'Severity'       : n.severity || '',
        'Status'         : n.status || '',
        'Notes'          : n.notes || '',
        'Logged'         : fmtDate(n.created_at),
        'Last Updated'   : fmtDate(n.updated_at),
      })),
      'Needs_and_Risks'
    );
  }

  function exportHomeVisits() {
    doExport('home_visits', '/api/participants/export/home-visits', data =>
      data.map(v => ({
        'Participant ID'    : v.participant_id,
        'Full Name'         : v.full_name,
        'LDC'               : v.ldc_code,
        'Visit Date'        : fmtDate(v.visited_date),
        'Visit Time'        : v.visited_time || '',
        'Purpose'           : v.purpose || '',
        'People in Home'    : v.people_in_home || '',
        'Discussion Points' : v.discussion_points || '',
        'Suggestions'       : v.suggestions || '',
        'Visited By'        : v.visited_by || '',
        'Recorded'          : fmtDate(v.created_at),
      })),
      'Home_Visits'
    );
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
        Dashboard Overview
      </h2>
      <p style={{ color: 'var(--color-text-subdued)', fontSize: '13px', marginBottom: '14px' }}>
        {user?.ldc_code} — {user?.ldc_name || 'LDC'} summary.
      </p>

      <div style={{ marginBottom: '20px', paddingBottom: '12px',
        borderBottom: '1px solid var(--color-divider)' }}>
        <DashboardMeta generatedAt={summary?.generated_at} />
      </div>

      {/* ── SECTION 1: Hero Stats ─────────────────────────────────── */}
      <HeroStats hero={summary?.hero} isAdmin={false} loading={summaryLoading} />

      {/* ── SECTION 2: Demographics (status + personal info) ─────── */}
      <ParticipantDemographics
        statusBreakdown={summary?.status_breakdown}
        personalInfo={summary?.personal_info}
      />

      {/* ── SECTION 3: Academic Performance ──────────────────────── */}
      <AcademicSection academic={summary?.academic} />

      {/* ── SECTION 5: Development Plans + Mentoring + Actions ───── */}
      <DevelopmentSection
        devPlans={summary?.dev_plans}
        mentorSessions={summary?.mentor_sessions}
        actionItems={summary?.action_items}
      />

      {/* ── SECTION 6: Home Visits ───────────────────────────────── */}
      <HomeVisitsSection homeVisits={summary?.home_visits} />

      {/* ── SECTION 7: Needs & Risks ─────────────────────────────── */}
      <NeedsRisksSection needsRisks={summary?.needs_risks} />

      {/* ── SECTION 8: Talents & Skills ──────────────────────────── */}
      <TalentsSection talents={summary?.talents} />

      {/* ── SECTION 4: Data Export ───────────────────────────────── */}
      {(() => {
        const EXPORT_OPTIONS = [
          { key: 'participants',   label: 'Participants',      fn: exportParticipants,   note: 'Personal info + OL/AL/Certs condensed' },
          { key: 'academic',       label: 'Academic Records',  fn: exportAcademic,       note: 'Full OL & AL subject detail' },
          { key: 'certifications', label: 'Certifications',    fn: exportCertifications, note: 'All certifications detail' },
          { key: 'development',    label: 'Development Plans', fn: exportDevelopment,    note: 'Goals, action items, mentor conversations' },
          { key: 'career',         label: 'Career Plans',      fn: exportCareer,         note: 'Aspirations, Holland code, readiness checklist' },
          { key: 'talents',        label: 'Talents & Skills',  fn: exportTalents,        note: 'Categories, talents, proficiency levels' },
          { key: 'needs_risks',    label: 'Needs & Risks',     fn: exportNeedsRisks,     note: 'Type, category, severity, status' },
          { key: 'home_visits',    label: 'Home Visits',       fn: exportHomeVisits,     note: 'Visit logs with discussion points' },
        ];
        const selected = EXPORT_OPTIONS.find(o => o.key === exportType);
        return (
          <div>
            <div style={sectionTitle}>Data Export</div>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subdued)', fontWeight: '600' }}>Exporting:</span>
                <span style={{ background: 'var(--color-tint-info)', color: 'var(--color-info)',
                  padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700' }}>
                  {user?.ldc_code} — {user?.ldc_name}
                </span>
              </div>

              {exportError && (
                <div style={{ background: 'var(--color-tint-danger)', border: '1px solid var(--color-danger)',
                  borderRadius: '6px', padding: '8px 12px', color: 'var(--color-danger)',
                  fontSize: '12px', marginBottom: '14px' }}>
                  {exportError}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 md:items-start">
                <div style={{ flex: 1 }}>
                  <select
                    aria-label="Export type"
                    value={exportType}
                    onChange={e => setExportType(e.target.value)}
                    disabled={!!exporting}
                    style={{ width: '100%', padding: '9px 11px',
                      border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
                      fontSize: '13px', color: 'var(--color-text-heading)',
                      background: 'var(--color-bg-page)', outline: 'none', fontFamily: 'inherit',
                      cursor: exporting ? 'not-allowed' : 'pointer' }}>
                    {EXPORT_OPTIONS.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                  {selected && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '5px' }}>
                      {selected.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => selected?.fn()}
                  disabled={!!exporting}
                  style={{ background: exporting ? 'var(--color-border-subtle)' : 'var(--color-brand-primary)',
                    color: 'var(--color-brand-accent)', border: 'none', borderRadius: '6px',
                    padding: '10px 24px', fontSize: '13px', fontWeight: '700',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {exporting ? 'Exporting…' : '↓ Export'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
