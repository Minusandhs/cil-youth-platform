import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { statusLabel } from '../../lib/constants';
import { useDashboardSummary } from '../../lib/useDashboardSummary';
import {
  HeroStats, ParticipantDemographics, AcademicSection,
  DevelopmentSection, NeedsRisksSection, HomeVisitsSection, TalentsSection,
  DataCompletenessSection, DashboardMeta, RebuildSnapshotButton, DashboardEmptyState,
} from '../common/DashboardSections';

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB');
}

// ── Shared styles ─────────────────────────────────────────────────
const card = {
  background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
  borderRadius:'8px', padding:'20px',
  boxShadow:'0 2px 8px rgba(26,22,16,0.06)'
};

const sectionTitle = {
  fontSize:'15px', fontWeight:'700',
  marginBottom:'16px', color:'var(--color-text-heading)',
  paddingBottom:'10px', borderBottom:'1px solid var(--color-divider)'
};

export default function AdminOverview() {
  const { user } = useAuth();
  const [ldcs,            setLdcs           ] = useState([]);
  const [filterLDC,       setFilterLDC      ] = useState('');
  const [exporting,       setExporting      ] = useState('');
  const [exportError,     setExportError    ] = useState('');
  const [exportType,      setExportType     ] = useState('participants');

  const {
    data: summary,
    loading: summaryLoading,
    forceRefresh,
    refreshing,
  } = useDashboardSummary({ ldcId: filterLDC || null });

  const isSuperAdmin = user?.role === 'super_admin';

  async function handleRebuild() {
    try {
      await forceRefresh();
      toast.success('Dashboard snapshot rebuilt');
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to rebuild snapshot';
      toast.error(msg);
    }
  }

  useEffect(() => {
    api.get('/api/ldcs').then(r => setLdcs(r.data)).catch(() => {});
  }, []);

  // ── Export helpers ──────────────────────────────────────────────
  async function doExport(key, endpoint, buildRows, filename) {
    setExporting(key);
    setExportError('');
    try {
      const params = filterLDC ? { ldc_id: filterLDC } : {};
      const res = await api.get(endpoint, { params });
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
      const rows = buildRows(res.data);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const suffix = filterLDC
        ? '_' + (ldcs.find(l => l.id === filterLDC)?.ldc_id || 'LDC')
        : '_All';
      XLSX.writeFile(wb, `${filename}${suffix}_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
    } catch (e) {
      setExportError('Export failed: ' + e.message);
    } finally {
      setExporting('');
    }
  }

  function exportParticipants() {
    doExport('participants', '/api/participants/export/participants', data =>
      data.map(p => ({
        'Participant ID'       : p.participant_id,
        'Full Name'            : p.full_name,
        'LDC Code'             : p.ldc_code,
        'LDC Name'             : p.ldc_name,
        'Date of Birth'        : fmtDate(p.date_of_birth),
        'Gender'               : p.gender || '',
        'Planned Completion'   : fmtDate(p.planned_completion),
        'Active'               : p.is_active ? 'Yes' : 'No',
        'Current Status'       : statusLabel(p.current_status),
        'Marital Status'       : p.marital_status || '',
        'No of Children'       : p.number_of_children ?? '',
        'Pregnant'             : p.is_pregnant ? 'Yes' : 'No',
        'Living Outside LDC'   : p.living_outside_ldc ? 'Yes' : 'No',
        'Outside Purpose'      : p.outside_purpose || '',
        'Outside Location'     : p.outside_location || '',
        'OL Status'            : p.ol_status || '',
        'AL Status'            : p.al_status || '',
        'Family Income (LKR)'  : p.family_income || '',
        'No of Dependants'     : p.no_of_dependants ?? '',
        'Other Assistance'     : p.other_assistance || '',

        'Long Term Plan'       : p.long_term_plan || '',
        'Career Goal'          : p.career_goal || '',
        'OL Results'           : p.ol_results || '',
        'AL Results'           : p.al_results || '',
        'Certifications'       : p.certifications || '',
      })),
      'Participants'
    );
  }

  function exportAcademic() {
    doExport('academic', '/api/participants/export/academic', data => {
      const rows = [];
      for (const r of data.ol) {
        rows.push({
          'Participant ID' : r.participant_id,
          'Full Name'      : r.full_name,
          'LDC'            : r.ldc_code,
          'Level'          : 'OL',
          'Exam Year'      : r.exam_year,
          'School'         : r.school_name || '',
          'No of Passes'   : r.no_of_passes ?? '',
          'Verified'       : r.results_verified ? 'Yes' : 'No',
          'Subject'        : r.subject_name || '',
          'Grade'          : r.grade || '',
          'Subject Type'   : r.subject_type || '',
          'Stream'         : '',
          'Medium'         : '',
          'Z-Score'        : '',
        });
      }
      for (const r of data.al) {
        rows.push({
          'Participant ID' : r.participant_id,
          'Full Name'      : r.full_name,
          'LDC'            : r.ldc_code,
          'Level'          : 'AL',
          'Exam Year'      : r.exam_year,
          'School'         : r.school_name || '',
          'No of Passes'   : '',
          'Verified'       : r.results_verified ? 'Yes' : 'No',
          'Subject'        : r.subject_name || '',
          'Grade'          : r.grade || '',
          'Subject Type'   : r.subject_type || '',
          'Stream'         : r.stream || '',
          'Medium'         : r.medium || '',
          'Z-Score'        : r.z_score ?? '',
        });
      }
      return rows;
    }, 'Academic_Records');
  }

  function exportCertifications() {
    doExport('certifications', '/api/participants/export/certifications', data =>
      data.map(c => ({
        'Participant ID' : c.participant_id,
        'Full Name'      : c.full_name,
        'LDC'            : c.ldc_code,
        'Cert Type'      : c.cert_type,
        'Certificate'    : c.cert_name,
        'Issuing Body'   : c.issuing_body || '',
        'Issued Date'    : fmtDate(c.issued_date),
        'Expiry Date'    : fmtDate(c.expiry_date),
        'Grade / Result' : c.grade_result || '',
        'NVQ Level'      : c.nvq_level || '',
        'Verified'       : c.results_verified ? 'Yes' : 'No',
        'Notes'          : c.notes || '',
      })),
      'Certifications'
    );
  }

  function exportDevelopment() {
    doExport('development', '/api/participants/export/development', data =>
      data.map(d => ({
        'Participant ID'   : d.participant_id,
        'Full Name'        : d.full_name,
        'LDC'              : d.ldc_code,
        'Plan Year'        : d.plan_year,
        'Spiritual Goal'   : d.spiritual_goal || '',
        'Academic Goal'    : d.academic_goal || '',
        'Social Goal'      : d.social_goal || '',
        'Vocational Goal'  : d.vocational_goal || '',
        'Health Goal'      : d.health_goal || '',
        'Actions'          : d.actions || '',
        'Resources Needed' : d.resources_needed || '',
        'Timeline'         : d.timeline || '',
        'Progress Status'  : d.progress_status || '',
        'Completion %'     : d.completion_rate ?? '',
        'Primary Mentor'   : d.primary_mentor || '',
        'Mentor Contact'   : d.mentor_contact || '',
        'Last Reviewed'    : fmtDate(d.last_reviewed),
        'Next Review'      : fmtDate(d.next_review),
      })),
      'Development_Plans'
    );
  }

  const selectedLDCLabel = filterLDC
    ? ldcs.find(l => l.id === filterLDC)?.ldc_id || ''
    : 'All LDCs';

  return (
    <div style={{ maxWidth:'1100px' }}>
      <h2 style={{ color:'var(--color-text-heading)', fontSize:'20px', fontWeight:'700', marginBottom:'4px' }}>
        Dashboard Overview
      </h2>
      <p style={{ color:'var(--color-text-subdued)', fontSize:'13px', marginBottom:'28px' }}>
        Platform summary and participant insights.
      </p>

      {/* ── Page-level LDC filter + snapshot controls ─────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8" style={{
        paddingBottom:'12px', borderBottom:'1px solid var(--color-divider)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px', flexWrap:'wrap' }}>
          <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--color-text-subdued)' }}>
            Scope:
            <span style={{ marginLeft:'8px', background:'var(--color-tint-info)',
              color:'var(--color-info)', padding:'3px 10px', borderRadius:'10px',
              fontSize:'12px', fontWeight:'700' }}>
              {selectedLDCLabel}
            </span>
            {summaryLoading && (
              <span style={{ marginLeft:'10px', color:'var(--color-text-muted)', fontSize:'12px' }}>
                loading…
              </span>
            )}
          </div>
          <DashboardMeta generatedAt={summary?.generated_at} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
          <select
            aria-label="Filter by LDC"
            value={filterLDC}
            onChange={e => setFilterLDC(e.target.value)}
            style={{ padding:'7px 11px', border:'1px solid var(--color-border-subtle)',
              borderRadius:'5px', fontSize:'12px', background:'var(--color-bg-page)',
              color:'var(--color-text-heading)', fontFamily:'inherit', outline:'none' }}>
            <option value="">All LDCs</option>
            {ldcs.map(l => (
              <option key={l.id} value={l.id}>{l.ldc_id} — {l.name}</option>
            ))}
          </select>
          {filterLDC && (
            <button onClick={() => setFilterLDC('')}
              style={{ background:'transparent', color:'var(--color-text-subdued)',
                border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
                padding:'7px 12px', fontSize:'12px',
                cursor:'pointer', fontFamily:'inherit' }}>
              Clear
            </button>
          )}
          {isSuperAdmin && (
            <RebuildSnapshotButton onClick={handleRebuild} refreshing={refreshing} />
          )}
        </div>
      </div>

      {/* Empty state: no snapshot yet (first load or post-truncate) */}
      {!summary && !summaryLoading && (
        <DashboardEmptyState
          canRefresh={isSuperAdmin}
          refreshing={refreshing}
          onRefresh={handleRebuild}
        />
      )}

      {/* ── SECTION 1: Hero Stats ─────────────────────────────────── */}
      <HeroStats hero={summary?.hero} isAdmin={true} loading={summaryLoading} />

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

      {/* ── SECTION 9: Data Completeness (admin scope only) ──────── */}
      <DataCompletenessSection completeness={summary?.completeness} />

      {/* ── SECTION 4: Data Export ────────────────────────────────── */}
      {(() => {
        const EXPORT_OPTIONS = [
          { key: 'participants',   label: 'Participants',      fn: exportParticipants,   note: 'Personal info + OL/AL/Certs condensed' },
          { key: 'academic',       label: 'Academic Records',  fn: exportAcademic,       note: 'Full OL & AL subject detail' },
          { key: 'certifications', label: 'Certifications',    fn: exportCertifications, note: 'All certifications detail' },
          { key: 'development',    label: 'Development Plans', fn: exportDevelopment,    note: 'Goals, progress, mentors' },
        ];
        const selected = EXPORT_OPTIONS.find(o => o.key === exportType);
        return (
          <div>
            <div style={sectionTitle}>Data Export</div>
            <div style={card}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                <span style={{ fontSize:'12px', color:'var(--color-text-subdued)', fontWeight:'600' }}>
                  Exporting:
                </span>
                <span style={{ background: filterLDC ? 'var(--color-tint-info)' : 'var(--color-bg-stripe)',
                  color: filterLDC ? 'var(--color-info)' : 'var(--color-text-subdued)',
                  padding:'3px 10px', borderRadius:'10px',
                  fontSize:'12px', fontWeight:'700',
                  whiteSpace:'nowrap', flexShrink:0 }}>
                  {selectedLDCLabel}
                </span>
                {!filterLDC && (
                  <span style={{ fontSize:'12px', color:'var(--color-text-subdued)' }}>
                    — Use the filter above to export a single LDC
                  </span>
                )}
              </div>

              {exportError && (
                <div style={{ background:'var(--color-tint-danger)', border:'1px solid var(--color-danger)',
                  borderRadius:'6px', padding:'8px 12px', color:'var(--color-danger)',
                  fontSize:'12px', marginBottom:'14px' }}>
                  {exportError}
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-3 md:items-start">
                <div style={{ flex:1 }}>
                  <select
                    aria-label="Export type"
                    value={exportType}
                    onChange={e => setExportType(e.target.value)}
                    disabled={!!exporting}
                    style={{ width:'100%', padding:'9px 11px',
                      border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
                      fontSize:'13px', color:'var(--color-text-heading)',
                      background:'var(--color-bg-page)', outline:'none', fontFamily:'inherit',
                      cursor: exporting ? 'not-allowed' : 'pointer' }}>
                    {EXPORT_OPTIONS.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                  {selected && (
                    <div style={{ fontSize:'10px', color:'var(--color-text-subdued)', marginTop:'5px' }}>
                      {selected.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => selected?.fn()}
                  disabled={!!exporting}
                  style={{ background: exporting ? 'var(--color-text-subdued)' : 'var(--color-brand-primary)',
                    color:'var(--color-brand-accent)', border:'none', borderRadius:'6px',
                    padding:'10px 24px', fontSize:'13px', fontWeight:'700',
                    cursor: exporting ? 'not-allowed' : 'pointer',
                    fontFamily:'inherit', whiteSpace:'nowrap', flexShrink:0 }}>
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
