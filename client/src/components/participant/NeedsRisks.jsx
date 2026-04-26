import { useState, useEffect, Fragment } from 'react';
import api from '../../lib/api';

const EMPTY_FORM = { type: 'need', category: '', severity: 'medium', notes: '' };

const STATUS_META = {
  open: { label: 'Open', bg: 'var(--color-tint-info)', color: 'var(--color-info)' },
  in_progress: { label: 'In Progress', bg: 'var(--color-tint-warning)', color: 'var(--color-warning)' },
  resolved: { label: 'Resolved', bg: 'var(--color-tint-success)', color: 'var(--color-success)' },
};

const SEVERITY_META = {
  low: { label: 'Low', bg: 'var(--color-tint-info)', color: 'var(--color-info)' },
  medium: { label: 'Medium', bg: 'var(--color-tint-warning)', color: 'var(--color-warning)' },
  high: { label: 'High', bg: 'var(--color-tint-danger)', color: 'var(--color-danger)' },
};

function Badge({ meta }) {
  return (
    <span style={{
      background: meta.bg, color: meta.color,
      padding: '2px 10px', borderRadius: '10px',
      fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function NeedsRisks({ participantId, readOnly = false }) {
  const [entries, setEntries] = useState([]);
  const [cats, setCats] = useState({ needs: [], risks: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(null); // entry id being patched
  const [expanded, setExpanded] = useState(null); // entry id with history open
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  function openCreate() {
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError(''); setSuccess('');
  }

  function cancelForm() {
    setShowForm(false);
    setError(''); setSuccess('');
  }

  useEffect(() => { loadAll(); }, [participantId]);

  // Reset category when type changes
  useEffect(() => {
    setForm(f => ({ ...f, category: '' }));
  }, [form.type]);

  async function loadAll() {
    try {
      const [entriesRes, catsRes] = await Promise.all([
        api.get(`/api/needs-risks/${participantId}`),
        api.get('/api/needs-risks/categories'),
      ]);
      setEntries(entriesRes.data);
      setCats(catsRes.data);
    } catch {
      setError('Failed to load needs & risks');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.category) { setError('Please select a category'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post(`/api/needs-risks/${participantId}`, form);
      const res = await api.get(`/api/needs-risks/${participantId}`);
      setEntries(res.data);
      setForm(EMPTY_FORM);
      setSuccess('Entry recorded.');
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(entryId, newStatus) {
    setUpdating(entryId); setError('');
    try {
      await api.patch(`/api/needs-risks/${participantId}/${entryId}`, { status: newStatus });
      const res = await api.get(`/api/needs-risks/${participantId}`);
      setEntries(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  // ── Styles ────────────────────────────────────────────────────
  const card = {
    background: 'var(--color-bg-card)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: '8px', padding: '20px',
    boxShadow: '0 2px 8px rgba(26,22,16,0.06)',
  };

  const secTitle = {
    fontSize: '14px', fontWeight: '700',
    marginBottom: '16px', paddingBottom: '10px',
    borderBottom: '1px solid var(--color-divider)',
    color: 'var(--color-text-heading)',
    display: 'flex', alignItems: 'center', gap: '8px',
  };

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    color: 'var(--color-text-heading)', letterSpacing: '0.3px',
    textTransform: 'uppercase', marginBottom: '5px',
  };

  const inputStyle = {
    width: '100%', padding: '9px 11px',
    border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
    fontSize: '13px', color: 'var(--color-text-heading)',
    background: 'var(--color-bg-page)', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  const btnPrimary = {
    background: 'var(--color-brand-primary)', color: 'var(--color-brand-accent)',
    border: 'none', borderRadius: '6px', padding: '10px 24px',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
  };

  const btnGhost = {
    background: 'transparent', color: 'var(--color-text-subdued)',
    border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
    padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  };

  const thStyle = {
    padding: '8px 12px', textAlign: 'left',
    fontSize: '10px', fontWeight: '700', letterSpacing: '0.4px',
    textTransform: 'uppercase', color: 'var(--color-text-subdued)',
    background: 'var(--color-bg-stripe)',
    borderBottom: '1px solid var(--color-border-subtle)',
    whiteSpace: 'nowrap',
  };

  const tdStyle = {
    padding: '10px 12px', fontSize: '13px',
    color: 'var(--color-text-heading)',
    borderBottom: '1px solid var(--color-divider)',
    verticalAlign: 'middle',
  };

  const usedCategories = new Set(
    entries.filter(e => e.type === form.type).map(e => e.category)
  );
  const categoryOptions = (form.type === 'need' ? cats.needs : cats.risks)
    .filter(c => !usedCategories.has(c.value));

  if (loading) return (
    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '24px' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header with Add Button ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-2">
        <div>
          <h3 style={{fontSize:'16px', fontWeight:'700'}}>
            Needs & Risks
          </h3>
          <p style={{color:'var(--color-text-subdued)', fontSize:'13px', marginTop:'2px'}}>
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'} recorded
          </p>
        </div>
        {!showForm && !readOnly && (
          <button onClick={openCreate} className="w-full md:w-auto" style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'9px 18px', fontSize:'13px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>+ Add Entry</button>
        )}
      </div>

      {/* ── New Entry Form ──────────────────────────────────────── */}
      {showForm && !readOnly && (
        <div style={card}>
          <div style={secTitle}>Needs & Risks: Log New Entry</div>

          {error && (
            <div style={{
              background: 'var(--color-tint-danger)', border: '1px solid var(--color-danger)',
              borderRadius: '6px', padding: '10px 14px',
              color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px',
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: 'var(--color-tint-success)', border: '1px solid var(--color-success)',
              borderRadius: '6px', padding: '10px 14px',
              color: 'var(--color-success)', fontSize: '13px', marginBottom: '16px',
            }}>{success}</div>
          )}

          <form onSubmit={handleSave}>
            {/* Row 1: Type | Category | Severity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_1fr] gap-3 mb-3">
              <div>
                <label style={labelStyle}>Type</label>
                <select
                  style={inputStyle}
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="need">Need</option>
                  <option value="risk">Risk</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                {categoryOptions.length === 0 ? (
                  <div style={{
                    padding: '9px 11px', fontSize: '12px', fontStyle: 'italic',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
                    background: 'var(--color-bg-stripe)',
                  }}>
                    All {form.type} categories already logged
                  </div>
                ) : (
                  <select
                    style={inputStyle}
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    <option value="">— Select category —</option>
                    {categoryOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label style={labelStyle}>Severity</label>
                <select
                  style={inputStyle}
                  value={form.severity}
                  onChange={e => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Row 2: Notes */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Notes</label>
              <input
                type="text"
                style={inputStyle}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Brief context or observation..."
              />
            </div>

            {/* Row 3: Actions */}
            <div className="flex flex-col md:flex-row gap-2.5">
              <button type="submit" disabled={saving} className="w-full md:w-auto" style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Entry'}
              </button>
              <button type="button" className="w-full md:w-auto" style={btnGhost} onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Log Table ────────────────────────────────────────────── */}
      <div style={card}>
        <div style={secTitle}>
          Needs &amp; Risks Log
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '400' }}>
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
          </span>
        </div>

        {/* Read-only error banner (no form above) */}
        {readOnly && error && (
          <div style={{
            background: 'var(--color-tint-danger)', border: '1px solid var(--color-danger)',
            borderRadius: '6px', padding: '10px 14px',
            color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px',
          }}>{error}</div>
        )}

        {entries.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No entries logged yet.
          </div>
        ) : (
          <div className="rsp-table-wrap">
            <table
              className="rsp-card-table"
              style={{
                width: '100%', borderCollapse: 'collapse',
                fontSize: '13px', minWidth: '720px',
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Date Logged</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const isExpanded = expanded === entry.id;
                  const catList = entry.type === 'need' ? cats.needs : cats.risks;
                  const catLabel = catList.find(c => c.value === entry.category)?.label || entry.category;

                  return (
                    <Fragment key={entry.id}>
                      <tr>
                        <td data-label="Date Logged" style={tdStyle}>
                          <div>{formatDate(entry.created_at)}</div>
                          {entry.created_by_name && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {entry.created_by_name}
                            </div>
                          )}
                        </td>

                        <td data-label="Type" style={tdStyle}>
                          <span style={{
                            background: entry.type === 'risk'
                              ? 'var(--color-tint-danger)' : 'var(--color-tint-info)',
                            color: entry.type === 'risk'
                              ? 'var(--color-danger)' : 'var(--color-info)',
                            padding: '2px 10px', borderRadius: '10px',
                            fontSize: '11px', fontWeight: '700', textTransform: 'capitalize',
                          }}>
                            {entry.type}
                          </span>
                        </td>

                        <td data-label="Category" style={{ ...tdStyle, maxWidth: '240px' }}>
                          <span style={{ color: 'var(--color-text-subdued)', fontSize: '12px' }}>
                            {catLabel}
                          </span>
                        </td>

                        <td data-label="Severity" style={tdStyle}>
                          <Badge meta={SEVERITY_META[entry.severity] || SEVERITY_META.medium} />
                        </td>

                        <td data-label="Status" style={tdStyle}>
                          {readOnly ? (
                            <Badge meta={STATUS_META[entry.status] || STATUS_META.open} />
                          ) : (
                            <select
                              value={entry.status}
                              disabled={updating === entry.id}
                              onChange={e => handleStatusChange(entry.id, e.target.value)}
                              style={{
                                padding: '5px 8px', fontSize: '12px', fontWeight: '700',
                                border: '1px solid var(--color-border-subtle)',
                                borderRadius: '5px', fontFamily: 'inherit',
                                background: STATUS_META[entry.status]?.bg || 'var(--color-bg-page)',
                                color: STATUS_META[entry.status]?.color || 'var(--color-brand-primary)',
                                cursor: updating === entry.id ? 'not-allowed' : 'pointer',
                                minWidth: '110px',
                              }}
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                          )}
                        </td>

                        <td data-label="Notes" style={{ ...tdStyle, color: 'var(--color-text-subdued)' }}>
                          {entry.notes || <span style={{ color: 'var(--color-text-placeholder)' }}>—</span>}
                        </td>

                        <td data-label="Last Updated" style={tdStyle}>
                          <div style={{ fontSize: '12px' }}>{formatDate(entry.updated_at)}</div>
                          {entry.history.length > 0 && (
                            <button
                              onClick={() => setExpanded(isExpanded ? null : entry.id)}
                              style={{
                                marginTop: '4px', background: 'none', border: 'none',
                                padding: 0, fontSize: '11px', fontWeight: '700',
                                color: 'var(--color-brand-accent)',
                                cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              {isExpanded ? 'Hide' : `History (${entry.history.length})`}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* ── History expansion row ──────────────────── */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={7}
                            data-label="History"
                            style={{
                              padding: '0 12px 14px',
                              background: 'var(--color-bg-highlight)',
                              borderBottom: '1px solid var(--color-divider)',
                            }}
                          >
                            <div style={{
                              fontSize: '10px', fontWeight: '700', letterSpacing: '0.4px',
                              textTransform: 'uppercase', color: 'var(--color-text-subdued)',
                              padding: '10px 0 8px',
                            }}>
                              Change History
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {entry.history.map(h => (
                                <div key={h.id} style={{
                                  display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                                  gap: '6px', padding: '6px 10px',
                                  background: 'var(--color-bg-card)',
                                  border: '1px solid var(--color-divider)',
                                  borderRadius: '5px', fontSize: '12px',
                                }}>
                                  <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                                    {new Date(h.changed_at).toLocaleDateString('en-GB', {
                                      day: '2-digit', month: 'short', year: 'numeric',
                                    })}
                                  </span>
                                  <span style={{ color: 'var(--color-text-heading)', fontWeight: '700', textTransform: 'capitalize' }}>
                                    {h.changed_field}
                                  </span>
                                  <span style={{ color: 'var(--color-text-muted)' }}>changed from</span>
                                  <span style={{
                                    background: 'var(--color-bg-stripe)', padding: '1px 8px',
                                    borderRadius: '4px', fontWeight: '700',
                                    color: 'var(--color-text-subdued)', textTransform: 'capitalize',
                                  }}>
                                    {h.old_value.replace('_', ' ')}
                                  </span>
                                  <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                                  <span style={{
                                    background: 'var(--color-brand-primary)', padding: '1px 8px',
                                    borderRadius: '4px', fontWeight: '700', color: 'var(--color-brand-accent)',
                                    textTransform: 'capitalize',
                                  }}>
                                    {h.new_value.replace('_', ' ')}
                                  </span>
                                  {h.changed_by_name && (
                                    <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                                      {h.changed_by_name}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
