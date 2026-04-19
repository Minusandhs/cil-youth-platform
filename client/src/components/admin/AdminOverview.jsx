import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { statusLabel, statusColor } from '../../lib/constants';

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString();
}


function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB');
}

// ── Shared styles ─────────────────────────────────────────────────
const card = {
  background:'#fffef9', border:'1px solid #d4c9b0',
  borderRadius:'8px', padding:'20px',
  boxShadow:'0 2px 8px rgba(26,22,16,0.06)'
};

const sectionTitle = {
  fontSize:'15px', fontWeight:'700',
  marginBottom:'16px', color:'#1a1610',
  paddingBottom:'10px', borderBottom:'1px solid #e8e0d0'
};

const statCard = (color) => ({
  background:'#fffef9', border:'1px solid #d4c9b0',
  borderRadius:'8px', padding:'18px 20px',
  boxShadow:'0 2px 8px rgba(26,22,16,0.06)',
  borderTop: `3px solid ${color}`
});

export default function AdminOverview() {
  const [stats,           setStats          ] = useState(null);
  const [ldcs,            setLdcs           ] = useState([]);
  const [filterLDC,       setFilterLDC      ] = useState('');
  const [overview,        setOverview       ] = useState(null);
  const [loading,         setLoading        ] = useState(true);
  const [ovLoading,       setOvLoading      ] = useState(false);
  const [exporting,       setExporting      ] = useState('');
  const [exportError,     setExportError    ] = useState('');
  const [exportType,      setExportType     ] = useState('participants');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [statsRes, ldcRes, ovRes] = await Promise.all([
        api.get('/api/auth/stats'),
        api.get('/api/ldcs'),
        api.get('/api/participants/overview'),
      ]);
      setStats(statsRes.data);
      setLdcs(ldcRes.data);
      setOverview(ovRes.data);
    } catch {
      // silently fail individual sections
    } finally {
      setLoading(false);
    }
  }

  async function loadOverview(ldc) {
    setOvLoading(true);
    try {
      const params = ldc ? { ldc_id: ldc } : {};
      const res = await api.get('/api/participants/overview', { params });
      setOverview(res.data);
    } catch {
      // silently fail
    } finally {
      setOvLoading(false);
    }
  }

  function handleLDCChange(val) {
    setFilterLDC(val);
    loadOverview(val);
  }

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

  // ── Render helpers ──────────────────────────────────────────────
  function StatCard({ label, value, color, sub }) {
    return (
      <div style={statCard(color)}>
        <div style={{ fontSize:'28px', fontWeight:'700', color, lineHeight:1 }}>
          {loading ? '…' : fmt(value)}
        </div>
        <div style={{ fontSize:'11px', color:'#6b5e4a', marginTop:'6px',
          fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.4px' }}>
          {label}
        </div>
        {sub && <div style={{ fontSize:'11px', color:'#a09080', marginTop:'3px' }}>{sub}</div>}
      </div>
    );
  }

  // Compute total for bar widths
  const totalStatus = overview?.status_breakdown?.reduce((s,r) => s + r.count, 0) || 1;

  const selectedLDCLabel = filterLDC
    ? ldcs.find(l => l.id === filterLDC)?.ldc_id || ''
    : 'All LDCs';

  return (
    <div style={{ maxWidth:'1100px' }}>
      <h2 style={{ fontSize:'20px', fontWeight:'700', marginBottom:'4px' }}>
        Dashboard Overview
      </h2>
      <p style={{ color:'#6b5e4a', fontSize:'13px', marginBottom:'28px' }}>
        Platform summary and participant insights.
      </p>

      {/* ── SECTION 1: Summary ───────────────────────────────────── */}
      <div style={{ marginBottom:'32px' }}>
        <div style={sectionTitle}>Summary</div>
        <div className="rsp-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'16px' }}>
          <StatCard label="Total Users"         value={stats?.users}        color="#c49a3c" />
          <StatCard label="LDC Centres"         value={stats?.ldcs}         color="#2d6a4f" />
          <StatCard label="Active Participants"  value={stats?.participants} color="#1a4068" />
        </div>
        <div className="rsp-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
          <StatCard label="Inactive Participants" value={stats?.inactive_participants} color="#9b2335" />
          <StatCard label="Active Male"           value={stats?.active_male}           color="#2d6a4f" />
          <StatCard label="Active Female"         value={stats?.active_female}         color="#5a3e8a" />
        </div>
      </div>

      {/* ── SECTION 2: Participant Info (filterable) ──────────────── */}
      <div style={{ marginBottom:'32px' }}>
        {/* Header + LDC Filter */}
        <div className="rsp-section-header" style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:'16px',
          paddingBottom:'10px', borderBottom:'1px solid #e8e0d0' }}>
          <div style={{ fontSize:'15px', fontWeight:'700', color:'#1a1610' }}>
            Participant Information
            {filterLDC && (
              <span style={{ marginLeft:'10px', background:'#dce9f5',
                color:'#1a4068', padding:'2px 10px', borderRadius:'10px',
                fontSize:'11px', fontWeight:'700' }}>
                {selectedLDCLabel}
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <select
              aria-label="Filter by LDC"
              value={filterLDC}
              onChange={e => handleLDCChange(e.target.value)}
              style={{ padding:'7px 11px', border:'1px solid #d4c9b0',
                borderRadius:'5px', fontSize:'12px', background:'#faf8f3',
                color:'#1a1610', fontFamily:'inherit', outline:'none' }}>
              <option value="">All LDCs</option>
              {ldcs.map(l => (
                <option key={l.id} value={l.id}>{l.ldc_id} — {l.name}</option>
              ))}
            </select>
            {filterLDC && (
              <button onClick={() => handleLDCChange('')}
                style={{ background:'transparent', color:'#6b5e4a',
                  border:'1px solid #d4c9b0', borderRadius:'5px',
                  padding:'7px 12px', fontSize:'12px',
                  cursor:'pointer', fontFamily:'inherit' }}>
                Clear
              </button>
            )}
          </div>
        </div>

        {ovLoading ? (
          <div style={{ padding:'32px', textAlign:'center', color:'#6b5e4a', fontSize:'13px' }}>
            Loading...
          </div>
        ) : overview ? (
          <div>
            {/* Top row: Status breakdown + TES type breakdown */}
            <div className="rsp-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'16px' }}>

              {/* Status Breakdown */}
              <div style={card}>
                <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'14px', color:'#3d3528' }}>
                  Participant Status
                  <span style={{ marginLeft:'8px', color:'#a09080', fontWeight:'400', fontSize:'12px' }}>
                    ({fmt(overview.total_participants)} total)
                  </span>
                </div>
                {overview.status_breakdown.length === 0 ? (
                  <div style={{ color:'#a09080', fontSize:'13px' }}>No data</div>
                ) : (
                  overview.status_breakdown.map(row => {
                    const pct = Math.round((row.count / totalStatus) * 100);
                    const color = statusColor(row.status);
                    return (
                      <div key={row.status} style={{ marginBottom:'10px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between',
                          fontSize:'12px', marginBottom:'4px' }}>
                          <span style={{ color:'#3d3528', fontWeight:'600' }}>
                            {statusLabel(row.status)}
                          </span>
                          <span style={{ color:'#6b5e4a', fontWeight:'700' }}>
                            {fmt(row.count)} <span style={{ color:'#a09080', fontWeight:'400' }}>({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ height:'6px', background:'#f0ece2', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%',
                            background: color, borderRadius:'3px', transition:'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Personal Stats */}
              <div style={card}>
                  <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'14px', color:'#3d3528' }}>
                    Personal Information
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    {[
                      { label:'Married',           value: overview.married,     color:'#c49a3c' },
                      { label:'Has Children',       value: overview.has_children, color:'#2d6a4f' },
                      { label:'Pregnant',           value: overview.pregnant,    color:'#9b2335' },
                      { label:'Living Outside LDC', value: overview.outside_ldc, color:'#1a4068' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'#faf8f3',
                        border:'1px solid #e8e0d0', borderRadius:'6px',
                        padding:'12px', textAlign:'center' }}>
                        <div style={{ fontSize:'22px', fontWeight:'700', color: s.color }}>
                          {fmt(s.value)}
                        </div>
                        <div style={{ fontSize:'10px', color:'#6b5e4a',
                          marginTop:'4px', textTransform:'uppercase',
                          letterSpacing:'0.3px', fontWeight:'600' }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        ) : null}
      </div>

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
                  <span style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>
                    — use the filter above to export a single LDC
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

              <div className="rsp-submit-row" style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <select
                    aria-label="Export type"
                    value={exportType}
                    onChange={e => setExportType(e.target.value)}
                    disabled={!!exporting}
                    style={{ width:'100%', padding:'9px 11px',
                      border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
                      fontSize:'13px', color:'var(--color-brand-primary)',
                      background:'var(--color-bg-page)', outline:'none', fontFamily:'inherit',
                      cursor: exporting ? 'not-allowed' : 'pointer' }}>
                    {EXPORT_OPTIONS.map(opt => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                  {selected && (
                    <div style={{ fontSize:'10px', color:'var(--color-text-muted)', marginTop:'5px' }}>
                      {selected.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => selected?.fn()}
                  disabled={!!exporting}
                  style={{ background: exporting ? 'var(--color-text-muted)' : 'var(--color-brand-primary)',
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
