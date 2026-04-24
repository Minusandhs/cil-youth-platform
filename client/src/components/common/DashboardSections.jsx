// ================================================================
// Dashboard Sections — shared renderers for AdminOverview & LDCOverview.
// Every section takes its slice of the /api/dashboard/summary payload
// and returns JSX. Admin-only sections accept an `isAdmin` flag and
// render null when false.
// ================================================================

import { statusLabel, statusColor, talentCategoryLabel, talentCategoryColor } from '../../lib/constants';

// ── Styles (shared) ──────────────────────────────────────────────
const card = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(26,22,16,0.06)',
};

const sectionTitle = {
  fontSize: '15px', fontWeight: '700',
  marginBottom: '16px', color: 'var(--color-brand-primary)',
  paddingBottom: '10px', borderBottom: '1px solid var(--color-divider)',
};

const subTitle = {
  fontSize: '13px', fontWeight: '700',
  marginBottom: '14px', color: 'var(--color-text-heading)',
};

const muted = { color: 'var(--color-text-muted)', fontSize: '13px' };

const statCardStyle = (color) => ({
  ...card,
  padding: '18px 20px',
  borderTop: `3px solid ${color}`,
});

const miniCard = {
  background: 'var(--color-bg-page)',
  border: '1px solid var(--color-divider)',
  borderRadius: '6px',
  padding: '12px',
  textAlign: 'center',
};

const label = {
  fontSize: '10px', color: 'var(--color-text-subdued)',
  marginTop: '4px', textTransform: 'uppercase',
  letterSpacing: '0.3px', fontWeight: '600',
};

const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString());
const fmtLKR = (n) => (n == null ? '—' : 'LKR ' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 }));
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

// ── Primitive: Stat Card ─────────────────────────────────────────
export function StatCard({ label: lbl, value, color, sub, loading }) {
  return (
    <div style={statCardStyle(color)}>
      <div style={{ fontSize: '26px', fontWeight: '700', color, lineHeight: 1 }}>
        {loading ? '…' : fmt(value)}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)',
        marginTop: '6px', fontWeight: '600', textTransform: 'uppercase',
        letterSpacing: '0.4px' }}>
        {lbl}
      </div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

// ── Primitive: Horizontal Bar Row ────────────────────────────────
function BarRow({ label: lbl, count, percent, color }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--color-text-heading)', fontWeight: '600' }}>{lbl}</span>
        <span style={{ color: 'var(--color-text-subdued)', fontWeight: '700' }}>
          {fmt(count)} <span style={{ color: 'var(--color-text-muted)', fontWeight: '400' }}>({percent}%)</span>
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--color-bg-stripe)',
        borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%',
          background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

// ── Primitive: Donut Chart (SVG) ─────────────────────────────────
function Donut({ segments, size = 140 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="var(--color-bg-stripe)" strokeWidth="14" />
      {total > 0 && segments.map((seg, i) => {
        if (seg.value === 0) return null;
        const len = (seg.value / total) * c;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`} />
        );
        offset += len;
        return el;
      })}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: '20px', fontWeight: '700', fill: 'var(--color-brand-primary)' }}>
        {total}
      </text>
    </svg>
  );
}

// ── Primitive: Segmented Progress Bar ────────────────────────────
function SegmentedBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return <div style={{ height: '14px', background: 'var(--color-bg-stripe)', borderRadius: '7px' }} />;
  }
  return (
    <div style={{ display: 'flex', height: '14px', borderRadius: '7px',
      overflow: 'hidden', background: 'var(--color-bg-stripe)' }}>
      {segments.map((seg, i) => (
        <div key={i} title={`${seg.label}: ${seg.value}`}
          style={{ width: `${(seg.value/total)*100}%`, background: seg.color }} />
      ))}
    </div>
  );
}


// ── Section 1 — Hero Stats ───────────────────────────────────────
export function HeroStats({ hero, isAdmin, loading }) {
  if (!hero) return null;
  const cards = isAdmin
    ? [
        { label: 'Active Participants',   value: hero.active,   color: 'var(--color-info)' },
        { label: 'Inactive / Exited',     value: hero.inactive, color: 'var(--color-danger)' },
        { label: 'Active Male',            value: hero.male,    color: 'var(--color-success)' },
        { label: 'Active Female',          value: hero.female,  color: 'var(--color-special)' },
        { label: 'LDC Centres',            value: hero.total_ldcs,  color: 'var(--color-brand-accent)' },
        { label: 'System Users',           value: hero.total_users, color: 'var(--color-text-subdued)' },
      ]
    : [
        { label: 'Active Participants',   value: hero.active,   color: 'var(--color-info)' },
        { label: 'Inactive / Exited',     value: hero.inactive, color: 'var(--color-danger)' },
        { label: 'Active Male',            value: hero.male,    color: 'var(--color-success)' },
        { label: 'Active Female',          value: hero.female,  color: 'var(--color-special)' },
      ];
  const cls = isAdmin ? 'rsp-grid-3' : 'rsp-grid-4';
  const cols = isAdmin ? 'repeat(3,1fr)' : 'repeat(4,1fr)';
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>Summary</div>
      <div className={cls} style={{ display: 'grid', gridTemplateColumns: cols, gap: '16px', marginBottom: isAdmin ? '16px' : '0' }}>
        {cards.slice(0, isAdmin ? 3 : 4).map(c =>
          <StatCard key={c.label} {...c} loading={loading} />)}
      </div>
      {isAdmin && (
        <div className="rsp-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {cards.slice(3).map(c => <StatCard key={c.label} {...c} loading={loading} />)}
        </div>
      )}
      <div style={{ marginTop: '16px' }}>
        <StatCard label="TES Active Scholars" value={hero.tes_active_scholars}
          color="#0e7c7b" loading={loading} sub="Approved on funded/completed batches" />
      </div>
    </div>
  );
}


// ── Section 2 — Status breakdown + Personal info ─────────────────
export function ParticipantDemographics({ statusBreakdown, personalInfo }) {
  if (!statusBreakdown || !personalInfo) return null;
  const total = statusBreakdown.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div style={{ marginBottom: '32px' }}>
      <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* 2A Status breakdown */}
        <div style={card}>
          <div style={subTitle}>
            Participant Status
            <span style={{ marginLeft: '8px', color: 'var(--color-text-muted)', fontWeight: '400', fontSize: '12px' }}>
              ({fmt(personalInfo.active_total)} active)
            </span>
          </div>
          {statusBreakdown.length === 0
            ? <div style={muted}>No data</div>
            : statusBreakdown.map(row => (
                <BarRow key={row.status}
                  label={statusLabel(row.status)}
                  count={row.count}
                  percent={pct(row.count, total)}
                  color={statusColor(row.status)} />
              ))
          }
        </div>

        {/* 2B Personal info */}
        <div style={card}>
          <div style={subTitle}>Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'Married',            value: personalInfo.married,      color: 'var(--color-brand-accent)' },
              { label: 'Has Children',       value: personalInfo.has_children, color: 'var(--color-success)' },
              { label: 'Pregnant',           value: personalInfo.pregnant,     color: 'var(--color-danger)' },
              { label: 'Living Outside LDC', value: personalInfo.outside_ldc,  color: 'var(--color-info)' },
              { label: 'Profiles Completed',
                value: `${personalInfo.profiles_completed}/${personalInfo.active_total}`,
                color: 'var(--color-special)' },
            ].map(s => (
              <div key={s.label} style={miniCard}>
                <div style={{ fontSize: '20px', fontWeight: '700', color: s.color }}>{typeof s.value === 'number' ? fmt(s.value) : s.value}</div>
                <div style={label}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Section 3 — Academic (OL, AL, Certs) ────────────────────────
export function AcademicSection({ academic }) {
  if (!academic) return null;
  const { ol, al, certs } = academic;
  const maxStream = Math.max(1, ...al.stream_distribution.map(s => s.count));

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>Academic Performance</div>
      <div className="rsp-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>

        {/* O/L */}
        <div style={card}>
          <div style={subTitle}>O/L Performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={miniCard}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-info)' }}>{fmt(ol.total_records)}</div>
              <div style={label}>Participants</div>
            </div>
            <div style={miniCard}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>{ol.pass_rate}%</div>
              <div style={label}>Pass Rate</div>
            </div>
            <div style={miniCard}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-brand-accent)' }}>{ol.avg_passes ?? '—'}</div>
              <div style={label}>Avg. Passes</div>
            </div>
          </div>
        </div>

        {/* A/L */}
        <div style={card}>
          <div style={subTitle}>A/L Performance</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={miniCard}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-info)' }}>{fmt(al.total_records)}</div>
              <div style={label}>Participants</div>
            </div>
            <div style={miniCard}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>{al.pass_rate}%</div>
              <div style={label}>Pass Rate</div>
            </div>
            <div style={{ ...miniCard, gridColumn: 'span 2' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-special)' }}>{fmt(al.university_selected)}</div>
              <div style={label}>University Selected</div>
            </div>
          </div>
          {al.stream_distribution.length > 0 && (
            <>
              <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)',
                fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: '0.3px', marginBottom: '8px' }}>Streams</div>
              {al.stream_distribution.map(s => (
                <BarRow key={s.stream} label={s.stream} count={s.count}
                  percent={pct(s.count, maxStream)} color="var(--color-info)" />
              ))}
            </>
          )}
        </div>

        {/* Certifications */}
        <div style={card}>
          <div style={subTitle}>Certifications</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div style={miniCard}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-info)' }}>{fmt(certs.total)}</div>
              <div style={label}>Total</div>
            </div>
            <div style={miniCard}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>{fmt(certs.participants_with_certs)}</div>
              <div style={label}>Participants</div>
            </div>
          </div>
          {certs.by_type.length > 0 && (
            <>
              <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)',
                fontWeight: '700', textTransform: 'uppercase',
                letterSpacing: '0.3px', marginBottom: '8px' }}>By Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {certs.by_type.map(t => (
                  <span key={t.type} style={{ background: 'var(--color-tint-info)',
                    color: 'var(--color-info)', padding: '3px 10px',
                    borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                    {t.type} <span style={{ color: 'var(--color-text-subdued)' }}>· {t.count}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Section 4 — TES Pipeline ─────────────────────────────────────
export function TesSection({ tes, isAdmin }) {
  if (!tes) return null;
  const cards = [
    { label: 'Open Batches',        value: tes.open_batches, color: 'var(--color-info)' },
    { label: 'Pending',             value: tes.pending,      color: 'var(--color-brand-accent)' },
    { label: 'Approved',            value: tes.approved,     color: 'var(--color-success)' },
    { label: 'Rejected',            value: tes.rejected,     color: 'var(--color-danger)' },
  ];
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>TES Scholarship Pipeline</div>

      <div className="rsp-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '16px' }}>
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: isAdmin ? '16px' : '0' }}>
        <div style={statCardStyle('var(--color-success)')}>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-success)', lineHeight: 1 }}>
            {fmtLKR(tes.total_approved_lkr)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)', marginTop: '6px',
            fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total Approved
          </div>
        </div>
        <div style={statCardStyle('#0e7c7b')}>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0e7c7b', lineHeight: 1 }}>
            {fmtLKR(tes.total_disbursed_lkr)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)', marginTop: '6px',
            fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Total Disbursed
          </div>
        </div>
      </div>

      {isAdmin && tes.funnel && (
        <div style={{ ...card, marginBottom: '16px' }}>
          <div style={subTitle}>Application Funnel</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
            {[
              { label: 'Pending',   value: tes.funnel.pending,   color: 'var(--color-brand-accent)' },
              { label: 'Approved',  value: tes.funnel.approved,  color: 'var(--color-success)' },
              { label: 'Funded',    value: tes.funnel.funded,    color: 'var(--color-info)' },
              { label: 'Disbursed', value: tes.funnel.disbursed, color: '#0e7c7b' },
            ].map((f, i, arr) => {
              const maxVal = Math.max(1, ...arr.map(x => x.value));
              const percent = pct(f.value, maxVal);
              return (
                <div key={f.label}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: f.color }}>{fmt(f.value)}</div>
                  <div style={{ ...label, marginTop: 0, marginBottom: '6px' }}>{f.label}</div>
                  <div style={{ height: '6px', background: 'var(--color-bg-stripe)',
                    borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%',
                      background: f.color, borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && tes.by_ldc && tes.by_ldc.length > 0 && (
        <div style={card}>
          <div style={subTitle}>Disbursement by LDC</div>
          {(() => {
            const max = Math.max(1, ...tes.by_ldc.map(r => r.disbursed));
            return tes.by_ldc.filter(r => r.disbursed > 0).map(r => (
              <BarRow key={r.ldc_code}
                label={`${r.ldc_code} — ${r.ldc_name}`}
                count={fmtLKR(r.disbursed)}
                percent={pct(r.disbursed, max)}
                color="#0e7c7b" />
            ));
          })()}
          {tes.by_ldc.every(r => r.disbursed === 0) && <div style={muted}>No disbursements yet.</div>}
        </div>
      )}
    </div>
  );
}


// ── Section 5 — Dev Plans + Mentoring + Action Items ─────────────
export function DevelopmentSection({ devPlans, mentorSessions, actionItems }) {
  if (!devPlans) return null;
  const segments = [
    { label: 'Not Started', value: devPlans.not_started,  color: 'var(--color-text-muted)' },
    { label: 'In Progress', value: devPlans.in_progress,  color: 'var(--color-info)' },
    { label: 'Completed',   value: devPlans.completed,    color: 'var(--color-success)' },
    { label: 'On Hold',     value: devPlans.on_hold,      color: 'var(--color-warning)' },
  ];
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>Development Plans & Mentoring</div>

      <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* 5A — Plan Status donut + counts */}
        <div style={card}>
          <div style={subTitle}>Plan Status (Current Year)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Donut segments={segments} size={130} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {segments.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', background: s.color, borderRadius: '2px' }} />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-subdued)' }}>{s.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-heading)', fontWeight: '700', marginLeft: 'auto' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
            <div style={miniCard}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-brand-accent)' }}>
                {devPlans.avg_completion_rate}%
              </div>
              <div style={label}>Avg. Completion</div>
            </div>
            <div style={miniCard}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-danger)' }}>
                {fmt(devPlans.without_plan)}
              </div>
              <div style={label}>Without Plan</div>
            </div>
          </div>
        </div>

        {/* 5B — Mentor Sessions */}
        <div style={card}>
          <div style={subTitle}>Mentor Sessions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={miniCard}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-info)' }}>
                {fmt(mentorSessions?.sessions_this_month)}
              </div>
              <div style={label}>Sessions This Month</div>
            </div>
            <div style={miniCard}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-danger)' }}>
                {fmt(mentorSessions?.never_mentored_60d)}
              </div>
              <div style={label}>No Sessions in 60 Days</div>
            </div>
          </div>
          <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
            Participants with no mentor conversation recorded in the last 60 days
            may need attention.
          </div>
        </div>
      </div>

      {/* 5C — Action items progress */}
      {actionItems && (
        <div style={card}>
          <div style={subTitle}>
            Action Items Progress
            <span style={{ marginLeft: '8px', color: 'var(--color-text-muted)',
              fontSize: '12px', fontWeight: '400' }}>
              ({actionItems.total} total, {actionItems.completion_rate}% completion)
            </span>
            {actionItems.overdue > 0 && (
              <span style={{ marginLeft: '8px', background: 'var(--color-tint-danger)',
                color: 'var(--color-danger)', padding: '2px 10px',
                borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                ⚠ {actionItems.overdue} overdue
              </span>
            )}
          </div>
          <SegmentedBar segments={[
            { label: 'Completed', value: actionItems.completed, color: 'var(--color-success)' },
            { label: 'Pending',   value: actionItems.pending,   color: 'var(--color-info)' },
            { label: 'Cancelled', value: actionItems.cancelled, color: 'var(--color-text-muted)' },
          ]} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
            <LegendChip color="var(--color-success)" label={`${actionItems.completed} completed`} />
            <LegendChip color="var(--color-info)" label={`${actionItems.pending} pending`} />
            <LegendChip color="var(--color-text-muted)" label={`${actionItems.cancelled} cancelled`} />
          </div>
        </div>
      )}
    </div>
  );
}

function LegendChip({ color, label: l }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ width: '10px', height: '10px', background: color, borderRadius: '2px' }} />
      <span style={{ fontSize: '12px', color: 'var(--color-text-subdued)' }}>{l}</span>
    </div>
  );
}


// ── Section 6 — Needs & Risks ────────────────────────────────────
export function NeedsRisksSection({ needsRisks }) {
  if (!needsRisks) return null;
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>Needs & Risks</div>
      <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={{ ...card, background: 'var(--color-tint-info)', borderColor: 'var(--color-info)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-info)' }}>Active Needs</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-info)' }}>
              {fmt(needsRisks.active_needs)}
            </span>
          </div>
          {needsRisks.top_need_categories.length > 0 ? needsRisks.top_need_categories.map(c => (
            <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '12px', padding: '5px 0', borderBottom: '1px solid rgba(26,64,104,0.15)' }}>
              <span style={{ color: 'var(--color-text-heading)' }}>{c.category}</span>
              <span style={{ color: 'var(--color-info)', fontWeight: '700' }}>{c.count}</span>
            </div>
          )) : <div style={muted}>No active needs.</div>}
        </div>

        <div style={{ ...card, background: 'var(--color-tint-danger)', borderColor: 'var(--color-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-danger)' }}>Active Risks</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-danger)' }}>
              {fmt(needsRisks.active_risks)}
            </span>
          </div>
          {needsRisks.top_risk_categories.length > 0 ? needsRisks.top_risk_categories.map(c => (
            <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: '12px', padding: '5px 0', borderBottom: '1px solid rgba(155,35,53,0.15)' }}>
              <span style={{ color: 'var(--color-text-heading)' }}>{c.category}</span>
              <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>{c.count}</span>
            </div>
          )) : <div style={muted}>No active risks.</div>}
        </div>

      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
        Resolved (all time): {fmt(needsRisks.resolved_all_time)}
      </div>
    </div>
  );
}


// ── Section 7 — Home Visits ──────────────────────────────────────
export function HomeVisitsSection({ homeVisits }) {
  if (!homeVisits) return null;
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>Home Visits</div>
      <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={miniCard}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-info)' }}>
                {fmt(homeVisits.visits_this_month)}
              </div>
              <div style={label}>Visits This Month</div>
            </div>
            <div style={miniCard}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-danger)' }}>
                {fmt(homeVisits.never_visited_60d)}
              </div>
              <div style={label}>No Visit in 60 Days</div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={subTitle}>Recent Visits</div>
          {homeVisits.recent.length === 0 ? (
            <div style={muted}>No visits recorded yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {homeVisits.recent.map((v, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '6px 0', borderBottom: i < homeVisits.recent.length - 1
                    ? '1px solid var(--color-divider)' : 'none' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: '600',
                      color: 'var(--color-text-heading)' }}>{v.participant_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.purpose}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)',
                    whiteSpace: 'nowrap', marginLeft: '8px' }}>
                    {fmtDate(v.visited_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ── Section 8 — Talents ──────────────────────────────────────────
export function TalentsSection({ talents }) {
  if (!talents) return null;
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>Talents</div>
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div style={miniCard}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-info)' }}>
              {fmt(talents.total_records)}
            </div>
            <div style={label}>Total Records</div>
          </div>
          <div style={miniCard}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>
              {fmt(talents.participants_with_talents)}
            </div>
            <div style={label}>Participants</div>
          </div>
          <div style={miniCard}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-special)' }}>
              {talents.by_category.length}
            </div>
            <div style={label}>Categories Used</div>
          </div>
        </div>
        {talents.by_category.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {talents.by_category.map(c => (
              <span key={c.category} style={{
                background: 'var(--color-bg-page)',
                border: `1px solid ${talentCategoryColor(c.category)}`,
                color: talentCategoryColor(c.category),
                padding: '4px 12px', borderRadius: '12px',
                fontSize: '11px', fontWeight: '700' }}>
                {talentCategoryLabel(c.category)} <span style={{ color: 'var(--color-text-subdued)' }}>· {c.count}</span>
              </span>
            ))}
          </div>
        ) : <div style={muted}>No talent records yet.</div>}
      </div>
    </div>
  );
}


// ── Section 9 — Data Completeness (admin only) ───────────────────
export function DataCompletenessSection({ completeness }) {
  if (!completeness) return null;
  const headline = [
    { label: 'Profile Completion',       value: completeness.profile_pct },
    { label: 'O/L Records Coverage',     value: completeness.ol_pct },
    { label: 'Development Plan Coverage', value: completeness.dev_plan_pct },
    { label: 'Home Visit Coverage',      value: completeness.visit_pct },
  ];
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={sectionTitle}>Data Completeness</div>
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '14px' }}>
          {headline.map(h => (
            <div key={h.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-heading)',
                  fontWeight: '600' }}>{h.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-subdued)',
                  fontWeight: '700' }}>{h.value}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--color-bg-stripe)',
                borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${h.value}%`, height: '100%',
                  background: h.value >= 70 ? 'var(--color-success)'
                    : h.value >= 40 ? 'var(--color-warning)' : 'var(--color-danger)',
                  borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {completeness.per_ldc.length > 0 && (
        <div style={card}>
          <div style={subTitle}>Per-LDC Breakdown</div>
          <div className="rsp-table-wrap">
            <table className="rsp-card-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-divider)', textAlign: 'left' }}>
                  <th style={{ padding: '8px', color: 'var(--color-text-heading)', fontWeight: '700' }}>LDC</th>
                  <th style={{ padding: '8px', color: 'var(--color-text-heading)', fontWeight: '700', textAlign: 'right' }}>Active</th>
                  <th style={{ padding: '8px', color: 'var(--color-text-heading)', fontWeight: '700', textAlign: 'right' }}>Profile %</th>
                  <th style={{ padding: '8px', color: 'var(--color-text-heading)', fontWeight: '700', textAlign: 'right' }}>O/L %</th>
                  <th style={{ padding: '8px', color: 'var(--color-text-heading)', fontWeight: '700', textAlign: 'right' }}>Dev Plan %</th>
                  <th style={{ padding: '8px', color: 'var(--color-text-heading)', fontWeight: '700', textAlign: 'right' }}>Visits %</th>
                </tr>
              </thead>
              <tbody>
                {completeness.per_ldc.map(r => (
                  <tr key={r.ldc_code} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td data-label="LDC" style={{ padding: '8px' }}>
                      <strong>{r.ldc_code}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{r.ldc_name}</div>
                    </td>
                    <td data-label="Active" style={{ padding: '8px', textAlign: 'right' }}>{r.active}</td>
                    <td data-label="Profile %" style={{ padding: '8px', textAlign: 'right' }}>{r.profile_pct}%</td>
                    <td data-label="O/L %" style={{ padding: '8px', textAlign: 'right' }}>{r.ol_pct}%</td>
                    <td data-label="Dev Plan %" style={{ padding: '8px', textAlign: 'right' }}>{r.dev_plan_pct}%</td>
                    <td data-label="Visits %" style={{ padding: '8px', textAlign: 'right' }}>{r.visit_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
