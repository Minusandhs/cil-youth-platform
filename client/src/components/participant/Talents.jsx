import { useState, useEffect, Fragment } from 'react';
import api from '../../lib/api';

const EMPTY_FORM = { category: '', talent: '', level: 'emerging', notes: '' };

const LEVEL_META = {
  emerging:   { label: 'Emerging',   bg: 'var(--color-tint-warning)', color: 'var(--color-warning)' },
  developing: { label: 'Developing', bg: 'var(--color-tint-info)',    color: 'var(--color-info)' },
  proficient: { label: 'Proficient', bg: 'var(--color-tint-success)', color: 'var(--color-success)' },
  advanced:   { label: 'Advanced',   bg: 'var(--color-success)',      color: '#fff' },
  mastery:    { label: 'Mastery',    bg: 'var(--color-brand-primary)',color: 'var(--color-brand-accent)' },
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

export default function Talents({ participantId, readOnly = false }) {
  const [entries,   setEntries  ] = useState([]);
  const [config,    setConfig   ] = useState({ LEVELS: [] });
  const [loading,   setLoading  ] = useState(true);
  const [saving,    setSaving   ] = useState(false);
  const [updating,  setUpdating ] = useState(null); // entry id being patched
  const [expanded,  setExpanded ] = useState(null); // entry id with history open
  const [error,     setError    ] = useState('');
  const [success,   setSuccess  ] = useState('');
  const [form,      setForm     ] = useState(EMPTY_FORM);

  useEffect(() => { loadAll(); }, [participantId]);

  // Reset talent when category changes (so the second dropdown stays valid)
  useEffect(() => {
    setForm(f => ({ ...f, talent: '' }));
  }, [form.category]);

  async function loadAll() {
    try {
      const [entriesRes, configRes] = await Promise.all([
        api.get(`/api/talents/${participantId}`),
        api.get('/api/talents/categories'),
      ]);
      setEntries(entriesRes.data);
      setConfig(configRes.data);
    } catch {
      setError('Failed to load talents');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.category || !form.talent) {
      setError('Please select both a category and a talent');
      return;
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      await api.post(`/api/talents/${participantId}`, form);
      const res = await api.get(`/api/talents/${participantId}`);
      setEntries(res.data);
      setForm(EMPTY_FORM);
      setSuccess('Talent recorded.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record talent');
    } finally {
      setSaving(false);
    }
  }

  async function handleLevelChange(entryId, newLevel) {
    setUpdating(entryId); setError('');
    try {
      await api.patch(`/api/talents/${participantId}/${entryId}`, { level: newLevel });
      const res = await api.get(`/api/talents/${participantId}`);
      setEntries(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update level');
    } finally {
      setUpdating(null);
    }
  }

  // ── Styles (same patterns as NeedsRisks) ──────────────────────
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
    color: 'var(--color-brand-primary)',
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
    fontSize: '13px', color: 'var(--color-brand-primary)',
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
    color: 'var(--color-brand-primary)',
    borderBottom: '1px solid var(--color-divider)',
    verticalAlign: 'middle',
  };

  // Build the list of categories from the config (excluding LEVELS).
  // Each: { key: 'digital', label: 'Digital & Technical Proficiency', talents: [...] }
  const categoryEntries = Object.entries(config)
    .filter(([k]) => k !== 'LEVELS')
    .map(([key, val]) => ({ key, label: val.label, talents: val.talents }));

  // Filter the talent dropdown to ones not already recorded for this category
  const usedKeys = new Set(
    entries.filter(e => e.category === form.category).map(e => e.talent)
  );
  const selectedCategory = categoryEntries.find(c => c.key === form.category);
  const talentOptions = selectedCategory
    ? selectedCategory.talents.filter(t => !usedKeys.has(t.value))
    : [];

  if (loading) return (
    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '24px' }}>
      Loading...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── New Entry Form ──────────────────────────────────────── */}
      {!readOnly && (
        <div style={card}>
          <div style={secTitle}>Record New Talent</div>

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
            {/* Row 1: Category | Talent | Level */}
            <div className="rsp-grid-3" style={{
              display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '12px',
              marginBottom: '12px',
            }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  style={inputStyle}
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">— Select category —</option>
                  {categoryEntries.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Talent</label>
                {!form.category ? (
                  <div style={{
                    padding: '9px 11px', fontSize: '12px', fontStyle: 'italic',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
                    background: 'var(--color-bg-stripe)',
                  }}>
                    Pick a category first
                  </div>
                ) : talentOptions.length === 0 ? (
                  <div style={{
                    padding: '9px 11px', fontSize: '12px', fontStyle: 'italic',
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border-subtle)', borderRadius: '5px',
                    background: 'var(--color-bg-stripe)',
                  }}>
                    All talents in this category already recorded
                  </div>
                ) : (
                  <select
                    style={inputStyle}
                    value={form.talent}
                    onChange={e => setForm({ ...form, talent: e.target.value })}
                    required
                  >
                    <option value="">— Select talent —</option>
                    {talentOptions.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label style={labelStyle}>Level</label>
                <select
                  style={inputStyle}
                  value={form.level}
                  onChange={e => setForm({ ...form, level: e.target.value })}
                >
                  {(config.LEVELS || []).map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Notes */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Notes <span style={{
                color: 'var(--color-text-muted)', fontWeight: '400', textTransform: 'none',
              }}>(optional context — e.g., achievements, observations)</span></label>
              <input
                type="text"
                style={inputStyle}
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="Won regional debate 2025; built LDC website..."
              />
            </div>

            {/* Row 3: Actions */}
            <div className="rsp-submit-row" style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : 'Save Talent'}
              </button>
              <button type="button" style={btnGhost} onClick={() => { setForm(EMPTY_FORM); setError(''); }}>
                Clear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Talents Log ──────────────────────────────────────────── */}
      <div style={card}>
        <div style={secTitle}>
          Recorded Talents
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '400' }}>
            {entries.length} talent{entries.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Read-only error banner */}
        {readOnly && error && (
          <div style={{
            background: 'var(--color-tint-danger)', border: '1px solid var(--color-danger)',
            borderRadius: '6px', padding: '10px 14px',
            color: 'var(--color-danger)', fontSize: '13px', marginBottom: '16px',
          }}>{error}</div>
        )}

        {entries.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
            No talents recorded yet.
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
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Talent</th>
                  <th style={thStyle}>Level</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Recorded</th>
                  <th style={thStyle}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const isExpanded = expanded === entry.id;
                  const cat = categoryEntries.find(c => c.key === entry.category);
                  const catLabel = cat?.label || entry.category;
                  const talentLabel = cat?.talents.find(t => t.value === entry.talent)?.label || entry.talent;

                  return (
                    <Fragment key={entry.id}>
                      <tr>
                        <td data-label="Category" style={{ ...tdStyle, maxWidth: '220px' }}>
                          <span style={{ color: 'var(--color-text-subdued)', fontSize: '12px' }}>
                            {catLabel}
                          </span>
                        </td>

                        <td data-label="Talent" style={tdStyle}>
                          <span style={{ fontWeight: '600' }}>{talentLabel}</span>
                        </td>

                        <td data-label="Level" style={tdStyle}>
                          {readOnly ? (
                            <Badge meta={LEVEL_META[entry.level] || LEVEL_META.emerging} />
                          ) : (
                            <select
                              value={entry.level}
                              disabled={updating === entry.id}
                              onChange={e => handleLevelChange(entry.id, e.target.value)}
                              style={{
                                padding: '5px 8px', fontSize: '12px', fontWeight: '700',
                                border: '1px solid var(--color-border-subtle)',
                                borderRadius: '5px', fontFamily: 'inherit',
                                background: LEVEL_META[entry.level]?.bg || 'var(--color-bg-page)',
                                color: LEVEL_META[entry.level]?.color || 'var(--color-brand-primary)',
                                cursor: updating === entry.id ? 'not-allowed' : 'pointer',
                                minWidth: '120px',
                              }}
                            >
                              {(config.LEVELS || []).map(l => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                              ))}
                            </select>
                          )}
                        </td>

                        <td data-label="Notes" style={{ ...tdStyle, color: 'var(--color-text-subdued)' }}>
                          {entry.notes || <span style={{ color: 'var(--color-text-placeholder)' }}>—</span>}
                        </td>

                        <td data-label="Recorded" style={tdStyle}>
                          <div style={{ fontSize: '12px' }}>{formatDate(entry.created_at)}</div>
                          {entry.created_by_name && (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {entry.created_by_name}
                            </div>
                          )}
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
                            colSpan={6}
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
                                    {(h.old_value || '—').replace('_', ' ')}
                                  </span>
                                  <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                                  <span style={{
                                    background: 'var(--color-brand-primary)', padding: '1px 8px',
                                    borderRadius: '4px', fontWeight: '700', color: 'var(--color-brand-accent)',
                                    textTransform: 'capitalize',
                                  }}>
                                    {(h.new_value || '—').replace('_', ' ')}
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
