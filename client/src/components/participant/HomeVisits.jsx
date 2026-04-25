import { useState, useEffect } from 'react';
import api from '../../lib/api';

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '700',
  color: 'var(--color-text-heading)', letterSpacing: '0.3px',
  textTransform: 'uppercase', marginBottom: '5px'
};
const inputStyle = {
  width: '100%', padding: '9px 11px',
  border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
  fontSize: '13px', color: 'var(--color-text-heading)',
  background: 'var(--color-bg-page)', outline: 'none', fontFamily: 'inherit'
};
const cardStyle = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: '8px', padding: '16px 20px',
  boxShadow: '0 2px 8px rgba(26,22,16,0.06)'
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB');
}
function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  return `${hr % 12 || 12}:${m} ${ampm}`;
}

function printBlankForm(participant) {
  const name  = participant?.full_name || 'Participant';
  const pid   = participant?.participant_id || '';
  const ldc   = participant?.ldc_name || '';

  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const lines = (n) => Array.from({ length: n })
    .map(() => '<div class="bl"></div>').join('');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Home Visit Form</title>
<style>
  @page { size: A4; margin: 18mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; color: var(--color-brand-primary); font-size: 12px; height: 100%; }
  .page { display: flex; flex-direction: column; min-height: 247mm; }
  .header { display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 3px solid var(--color-brand-primary); padding-bottom: 10px; margin-bottom: 14px; }
  .header-left .org { font-size: 9px; font-weight: 700; letter-spacing: 2px;
                      text-transform: uppercase; color: var(--color-text-subdued); margin-bottom: 3px; }
  .header-left .title { font-size: 19px; font-weight: 700; letter-spacing: -0.5px; }
  .badge { background: var(--color-brand-primary); color: var(--color-brand-accent); font-size: 9px; font-weight: 700;
           letter-spacing: 1.5px; padding: 5px 11px; border-radius: 3px; }
  .info-row { display: flex; border: 1px solid #ccc; border-radius: 5px;
              overflow: hidden; margin-bottom: 10px; }
  .info-cell { flex: 1; padding: 8px 12px; border-right: 1px solid #ccc; }
  .info-cell:last-child { border-right: none; }
  .info-cell .lbl { font-size: 8px; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.5px; color: var(--color-text-subdued); margin-bottom: 2px; }
  .info-cell .val { font-size: 12px; font-weight: 700; }
  .info-cell .write-line { border-bottom: 1px solid #999; min-height: 20px; }
  .section { border: 1px solid #ccc; border-radius: 5px; margin-bottom: 8px; overflow: hidden; flex: 1; }
  .section.grow { display: flex; flex-direction: column; }
  .section-label { background: var(--color-bg-stripe); padding: 6px 12px; font-size: 8px; font-weight: 700;
                   text-transform: uppercase; letter-spacing: 0.8px; color: var(--color-text-heading);
                   border-bottom: 1px solid #ccc; }
  .section-body { padding: 8px 12px; flex: 1; display: flex; flex-direction: column; gap: 0; }
  .bl { flex: 1; border-bottom: 1px solid #ddd; min-height: 18px; }
  .footer { margin-top: 12px; border-top: 1px solid #ccc; padding-top: 8px;
            display: flex; justify-content: space-between; font-size: 10px; color: var(--color-text-subdued); }
  .sig-row { display: flex; gap: 16px; margin-top: 10px; }
  .sig-cell { flex: 1; border-bottom: 1px solid #999; padding-bottom: 2px; }
  .sig-lbl { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-subdued); margin-top: 4px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="org">CIL Youth Development Platform</div>
      <div class="title">Home Visit Form</div>
    </div>
    <div class="badge">HOME VISIT</div>
  </div>

  <div class="info-row">
    <div class="info-cell">
      <div class="lbl">Participant Name</div>
      <div class="val">${esc(name)}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">PID</div>
      <div class="val">${esc(pid)}</div>
    </div>
    <div class="info-cell">
      <div class="lbl">LDC</div>
      <div class="val">${esc(ldc)}</div>
    </div>
  </div>

  <div class="info-row">
    <div class="info-cell">
      <div class="lbl">Visit Date</div>
      <div class="write-line"></div>
    </div>
    <div class="info-cell">
      <div class="lbl">Visit Time</div>
      <div class="write-line"></div>
    </div>
    <div class="info-cell">
      <div class="lbl">Purpose of Visit</div>
      <div class="write-line"></div>
    </div>
  </div>

  <div class="section grow">
    <div class="section-label">People in Home</div>
    <div class="section-body">${lines(3)}</div>
  </div>

  <div class="section grow">
    <div class="section-label">Discussion Points</div>
    <div class="section-body">${lines(6)}</div>
  </div>

  <div class="section grow">
    <div class="section-label">Suggestions / Recommendations</div>
    <div class="section-body">${lines(5)}</div>
  </div>

  <div class="footer">
    <div>
      <div class="sig-row">
        <div>
          <div class="sig-cell"></div>
          <div class="sig-lbl">Youth Worker Signature</div>
        </div>
        <div>
          <div class="sig-cell"></div>
          <div class="sig-lbl">Date</div>
        </div>
      </div>
    </div>
    <div style="text-align:right; font-size:9px; color:#aaa;">CIL Youth Development Platform</div>
  </div>
</div>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

const EMPTY_FORM = {
  visited_date: '', visited_time: '', purpose: '',
  people_in_home: '', discussion_points: '', suggestions: ''
};

export default function HomeVisits({ participantId, participant, readOnly }) {
  const [visits,    setVisits   ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [form,      setForm     ] = useState(EMPTY_FORM);
  const [saving,    setSaving   ] = useState(false);
  const [error,     setError    ] = useState('');
  const [success,   setSuccess  ] = useState('');
  const [expanded,  setExpanded ] = useState({});
  const [editId,    setEditId   ] = useState(null);
  const [editForm,  setEditForm ] = useState(EMPTY_FORM);

  useEffect(() => { loadVisits(); }, [participantId]);

  async function loadVisits() {
    try {
      const res = await api.get(`/api/home-visits/${participantId}`);
      setVisits(res.data);
    } catch {
      setError('Failed to load home visits');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const res = await api.post(`/api/home-visits/${participantId}`, form);
      setVisits(prev => [res.data, ...prev]);
      setSuccess('Visit logged successfully');
      setForm(EMPTY_FORM);
      setExpanded(prev => ({ ...prev, [res.data.id]: true }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log visit');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(visit) {
    setEditId(visit.id);
    setEditForm({
      visited_date     : visit.visited_date ? visit.visited_date.split('T')[0] : '',
      visited_time     : visit.visited_time ? visit.visited_time.slice(0, 5) : '',
      purpose          : visit.purpose || '',
      people_in_home   : visit.people_in_home || '',
      discussion_points: visit.discussion_points || '',
      suggestions      : visit.suggestions || ''
    });
  }

  async function handleEdit(e, visitId) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await api.patch(`/api/home-visits/${participantId}/${visitId}`, editForm);
      setVisits(prev => prev.map(v => v.id === visitId ? res.data : v));
      setEditId(null);
      setSuccess('Visit updated');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update visit');
    }
  }

  async function handleDelete(visitId) {
    if (!window.confirm('Delete this visit record?')) return;
    setError('');
    try {
      await api.delete(`/api/home-visits/${participantId}/${visitId}`);
      setVisits(prev => prev.filter(v => v.id !== visitId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete visit');
    }
  }

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (loading) return (
    <div style={{ padding: '32px', color: 'var(--color-text-subdued)' }}>Loading...</div>
  );

  return (
    <div>
      {/* Section header */}
      <div className="rsp-section-header" style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-heading)' }}>
            Home Visits
          </h2>
          <p style={{ color: 'var(--color-text-subdued)', fontSize: '13px', marginTop: '2px' }}>
            Record and review home visit reports
          </p>
        </div>
        <button onClick={() => printBlankForm(participant)} style={{
          background: 'transparent', color: 'var(--color-text-subdued)',
          border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
          padding: '8px 14px', fontSize: '12px', fontWeight: '600',
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>⬇ Print Blank Form</button>
      </div>

      {error && (
        <div style={{
          background: 'var(--color-tint-danger)', border: '1px solid var(--color-danger)',
          borderRadius: '6px', padding: '10px 14px',
          color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px'
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background: 'var(--color-tint-success)', border: '1px solid var(--color-success)',
          borderRadius: '6px', padding: '10px 14px',
          color: 'var(--color-success)', fontSize: '13px', marginBottom: '16px'
        }}>{success}</div>
      )}

      {/* Log Visit Form */}
      {!readOnly && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{
            fontSize: '14px', fontWeight: '700', marginBottom: '16px',
            paddingBottom: '10px', borderBottom: '1px solid var(--color-divider)',
            color: 'var(--color-text-heading)'
          }}>Log New Visit</div>
          <form onSubmit={handleCreate}>
            <div className="rsp-grid-3" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '14px', marginBottom: '14px'
            }}>
              <div>
                <label style={labelStyle}>Visit Date *</label>
                <input type="date" style={inputStyle} required
                  value={form.visited_date}
                  onChange={e => setForm({ ...form, visited_date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Visit Time</label>
                <input type="time" style={inputStyle}
                  value={form.visited_time}
                  onChange={e => setForm({ ...form, visited_time: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Purpose *</label>
                <input type="text" style={inputStyle} required
                  placeholder="e.g. Follow-up visit"
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>People in Home</label>
              <input type="text" style={inputStyle}
                placeholder="e.g. Participant, mother, younger sibling"
                value={form.people_in_home}
                onChange={e => setForm({ ...form, people_in_home: e.target.value })} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Discussion Points</label>
              <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                placeholder="Key topics discussed during the visit"
                value={form.discussion_points}
                onChange={e => setForm({ ...form, discussion_points: e.target.value })} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Suggestions / Recommendations</label>
              <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                placeholder="Any follow-up actions or recommendations"
                value={form.suggestions}
                onChange={e => setForm({ ...form, suggestions: e.target.value })} />
            </div>
            <div className="rsp-submit-row" style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} style={{
                background: 'var(--color-brand-primary)', color: 'var(--color-brand-accent)',
                border: 'none', borderRadius: '6px', padding: '10px 24px',
                fontSize: '13px', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: saving ? 0.7 : 1
              }}>
                {saving ? 'Saving...' : 'Log Visit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Visit History */}
      {visits.length === 0 ? (
        <div style={{
          ...cardStyle, padding: '40px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🏠</div>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>
            No Visits Recorded
          </div>
          <div style={{ color: 'var(--color-text-subdued)', fontSize: '13px' }}>
            {readOnly ? 'No home visits have been logged for this participant.'
              : 'Log a visit above to start building the visit history.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {visits.map(visit => (
            <div key={visit.id} style={cardStyle}>
              {editId === visit.id ? (
                /* ── Inline Edit Form ── */
                <form onSubmit={e => handleEdit(e, visit.id)}>
                  <div style={{
                    fontSize: '13px', fontWeight: '700', marginBottom: '14px',
                    color: 'var(--color-text-heading)'
                  }}>Edit Visit</div>
                  <div className="rsp-grid-3" style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '14px', marginBottom: '14px'
                  }}>
                    <div>
                      <label style={labelStyle}>Visit Date *</label>
                      <input type="date" style={inputStyle} required
                        value={editForm.visited_date}
                        onChange={e => setEditForm({ ...editForm, visited_date: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Visit Time</label>
                      <input type="time" style={inputStyle}
                        value={editForm.visited_time}
                        onChange={e => setEditForm({ ...editForm, visited_time: e.target.value })} />
                    </div>
                    <div>
                      <label style={labelStyle}>Purpose *</label>
                      <input type="text" style={inputStyle} required
                        value={editForm.purpose}
                        onChange={e => setEditForm({ ...editForm, purpose: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>People in Home</label>
                    <input type="text" style={inputStyle}
                      value={editForm.people_in_home}
                      onChange={e => setEditForm({ ...editForm, people_in_home: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Discussion Points</label>
                    <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                      value={editForm.discussion_points}
                      onChange={e => setEditForm({ ...editForm, discussion_points: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Suggestions / Recommendations</label>
                    <textarea style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                      value={editForm.suggestions}
                      onChange={e => setEditForm({ ...editForm, suggestions: e.target.value })} />
                  </div>
                  <div className="rsp-submit-row" style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={{
                      background: 'var(--color-success)', color: '#fff',
                      border: 'none', borderRadius: '6px', padding: '9px 22px',
                      fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                    }}>Save Changes</button>
                    <button type="button" onClick={() => setEditId(null)} style={{
                      background: 'transparent', color: 'var(--color-text-subdued)',
                      border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
                      padding: '9px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit'
                    }}>Cancel</button>
                  </div>
                </form>
              ) : (
                /* ── Visit Card ── */
                <>
                  {/* Card Header */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => toggleExpand(visit.id)}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        cursor: 'pointer', textAlign: 'left', flex: 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text-heading)' }}>
                          {formatDate(visit.visited_date)}
                        </span>
                        {visit.visited_time && (
                          <span style={{
                            fontSize: '12px', color: 'var(--color-text-subdued)',
                            background: 'var(--color-bg-stripe)',
                            padding: '2px 8px', borderRadius: '4px'
                          }}>{formatTime(visit.visited_time)}</span>
                        )}
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-heading)' }}>
                          {visit.purpose}
                        </span>
                      </div>
                      {visit.created_by_name && (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)', marginTop: '3px' }}>
                          Logged by {visit.created_by_name}
                        </div>
                      )}
                    </button>

                    <div className="rsp-submit-row" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {!readOnly && (
                        <>
                          <button onClick={() => { startEdit(visit); setExpanded(p => ({ ...p, [visit.id]: false })); }} style={{
                            background: 'var(--color-tint-info)', color: 'var(--color-info)',
                            border: 'none', borderRadius: '5px',
                            padding: '5px 12px', fontSize: '11px', fontWeight: '700',
                            cursor: 'pointer', fontFamily: 'inherit'
                          }}>Edit</button>
                          <button onClick={() => handleDelete(visit.id)} style={{
                            background: 'var(--color-tint-danger)', color: 'var(--color-danger)',
                            border: 'none', borderRadius: '5px',
                            padding: '5px 12px', fontSize: '11px', fontWeight: '700',
                            cursor: 'pointer', fontFamily: 'inherit'
                          }}>Delete</button>
                        </>
                      )}
                      <button onClick={() => toggleExpand(visit.id)} style={{
                        background: 'var(--color-bg-stripe)', color: 'var(--color-text-subdued)',
                        border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
                        padding: '5px 10px', fontSize: '12px', fontWeight: '600',
                        cursor: 'pointer', fontFamily: 'inherit'
                      }}>
                        {expanded[visit.id] ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Detail */}
                  {expanded[visit.id] && (
                    <div style={{ marginTop: '14px', borderTop: '1px solid var(--color-divider)', paddingTop: '14px' }}>
                      {[
                        { label: 'People in Home',             value: visit.people_in_home    },
                        { label: 'Discussion Points',          value: visit.discussion_points },
                        { label: 'Suggestions / Recommendations', value: visit.suggestions   },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ marginBottom: '12px' }}>
                          <div style={{
                            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                            letterSpacing: '0.5px', color: 'var(--color-text-subdued)', marginBottom: '4px'
                          }}>{label}</div>
                          <div style={{
                            fontSize: '13px', color: value ? 'var(--color-text-heading)' : 'var(--color-text-placeholder)',
                            lineHeight: '1.6', whiteSpace: 'pre-wrap'
                          }}>
                            {value || '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
