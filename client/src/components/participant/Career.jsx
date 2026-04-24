import { useState, useEffect } from 'react';
import api from '../../lib/api';

const EMPTY_PLAN = {
  career_aspiration: '',
  aspired_industry: '',
  long_term_plan: '',
  further_education: false,
  education_details: '',
  interested_to_apply: false,
  interest_industry: '',
  interest_notes: '',
  holland_primary: '',
  holland_secondary: '',
  holland_tertiary: '',
  career_choice_1: '',
  career_choice_2: '',
  career_choice_3: '',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function Career({ participantId, readOnly = false }) {
  const [plan, setPlan] = useState(null);
  const [readiness, setReadiness] = useState([]);
  const [config, setConfig] = useState({ readiness_items: [], industries: [], holland_codes: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_PLAN);
  const [itemNotes, setItemNotes] = useState({});  // { item: notesDraft }
  const [savingItem, setSavingItem] = useState(null);

  useEffect(() => { loadAll(); }, [participantId]);

  async function loadAll() {
    try {
      const [dataRes, configRes] = await Promise.all([
        api.get(`/api/career/${participantId}`),
        api.get('/api/career/config'),
      ]);
      setPlan(dataRes.data.plan);
      setReadiness(dataRes.data.readiness);
      setConfig(configRes.data);
      if (dataRes.data.plan) {
        const p = dataRes.data.plan;
        setForm({
          career_aspiration: p.career_aspiration || '',
          aspired_industry: p.aspired_industry || '',
          long_term_plan: p.long_term_plan || '',
          further_education: p.further_education || false,
          education_details: p.education_details || '',
          interested_to_apply: p.interested_to_apply || false,
          interest_industry: p.interest_industry || '',
          interest_notes: p.interest_notes || '',
          holland_primary: p.holland_primary || '',
          holland_secondary: p.holland_secondary || '',
          holland_tertiary: p.holland_tertiary || '',
          career_choice_1: p.career_choice_1 || '',
          career_choice_2: p.career_choice_2 || '',
          career_choice_3: p.career_choice_3 || '',
        });
      } else {
        setEditMode(true);
      }
    } catch {
      setError('Failed to load career data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      if (plan) {
        await api.put(`/api/career/${participantId}/plan`, form);
      } else {
        await api.post(`/api/career/${participantId}/plan`, form);
      }
      setSuccess('Career plan saved.');
      setTimeout(() => setSuccess(''), 3000);
      setEditMode(false);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save career plan');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setError(''); setSuccess('');
    if (plan) {
      setForm({
        career_aspiration: plan.career_aspiration || '',
        aspired_industry: plan.aspired_industry || '',
        long_term_plan: plan.long_term_plan || '',
        further_education: plan.further_education || false,
        education_details: plan.education_details || '',
        interested_to_apply: plan.interested_to_apply || false,
        interest_industry: plan.interest_industry || '',
        interest_notes: plan.interest_notes || '',
        holland_primary: plan.holland_primary || '',
        holland_secondary: plan.holland_secondary || '',
        holland_tertiary: plan.holland_tertiary || '',
        career_choice_1: plan.career_choice_1 || '',
        career_choice_2: plan.career_choice_2 || '',
        career_choice_3: plan.career_choice_3 || '',
      });
      setEditMode(false);
    } else {
      setForm(EMPTY_PLAN);
    }
  }

  // ── Readiness handlers ──────────────────────────────────────────
  async function toggleReadinessItem(item, currentEntry) {
    setSavingItem(currentEntry?.id || item); setError('');
    try {
      const nextCompleted = !(currentEntry?.completed);
      const completed_date = nextCompleted
        ? new Date().toISOString().slice(0, 10)
        : null;
      if (currentEntry) {
        // Existing entry — PATCH so change history is logged
        await api.patch(
          `/api/career/${participantId}/readiness/${currentEntry.id}`,
          { completed: nextCompleted, completed_date }
        );
      } else {
        // First time — create the entry
        await api.post(`/api/career/${participantId}/readiness`, {
          item,
          completed: nextCompleted,
          completed_date,
        });
      }
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update readiness item');
    } finally {
      setSavingItem(null);
    }
  }

  async function saveReadinessNotes(entry, notes) {
    setSavingItem(entry.id); setError('');
    try {
      await api.patch(
        `/api/career/${participantId}/readiness/${entry.id}`,
        { notes }
      );
      await loadAll();
      setItemNotes(prev => {
        const next = { ...prev };
        delete next[entry.item];
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save notes');
    } finally {
      setSavingItem(null);
    }
  }

  async function updateCompletedDate(entry, completed_date) {
    setSavingItem(entry.id); setError('');
    try {
      await api.patch(
        `/api/career/${participantId}/readiness/${entry.id}`,
        { completed_date: completed_date || null }
      );
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update date');
    } finally {
      setSavingItem(null);
    }
  }

  // ── Styles ──────────────────────────────────────────────────────
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
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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
  const btnSuccess = {
    background: 'var(--color-success)', color: '#fff',
    border: 'none', borderRadius: '6px', padding: '10px 24px',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
  };
  const btnGhost = {
    background: 'transparent', color: 'var(--color-text-subdued)',
    border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
    padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  };

  if (loading) return (
    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', padding: '24px' }}>
      Loading career data...
    </div>
  );

  const industryLabel = v =>
    config.industries.find(i => i.value === v)?.label || v;

  // Derived 3-letter Holland Code (skips blanks, e.g. "SIA")
  const hollandCode = [form.holland_primary, form.holland_secondary, form.holland_tertiary]
    .filter(Boolean).join('');
  const hollandCodeSaved = plan
    ? [plan.holland_primary, plan.holland_secondary, plan.holland_tertiary].filter(Boolean).join('')
    : '';

  // Divider style for in-card sub-sections
  const subHeader = {
    fontSize: '12px', fontWeight: '700',
    color: 'var(--color-text-heading)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    marginTop: '8px', marginBottom: '10px',
    paddingBottom: '6px',
    borderBottom: '1px dashed var(--color-divider)',
  };

  // Map readiness item -> entry (if any)
  const entriesByItem = Object.fromEntries(
    readiness.map(e => [e.item, e])
  );
  const totalItems = config.readiness_items.length;
  const completedCount = config.readiness_items.reduce(
    (sum, it) => sum + (entriesByItem[it.value]?.completed ? 1 : 0),
    0
  );
  const pct = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Messages ─────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'var(--color-tint-danger)', border: '1px solid var(--color-danger)',
          borderRadius: '6px', padding: '10px 14px',
          color: 'var(--color-danger)', fontSize: '13px',
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background: 'var(--color-tint-success)', border: '1px solid var(--color-success)',
          borderRadius: '6px', padding: '10px 14px',
          color: 'var(--color-success)', fontSize: '13px',
        }}>{success}</div>
      )}

      {/* ── 1. Career Plan ───────────────────────────────────── */}
      <div style={card}>
        <div style={secTitle}>
          <span>Career Plan</span>
          {!editMode && plan && !readOnly && (
            <button onClick={() => setEditMode(true)} style={{
              ...btnPrimary, padding: '6px 14px', fontSize: '12px',
            }}>Edit Plan</button>
          )}
        </div>

        {/* VIEW */}
        {!editMode && plan && (
          <div>
            <div className="rsp-grid-2" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
            }}>
              <ViewField label="Career Aspiration" value={plan.career_aspiration} />
              <ViewField label="Aspired Industry" value={plan.aspired_industry ? industryLabel(plan.aspired_industry) : ''} />
              <ViewField label="Long Term Plan (5 years)" value={plan.long_term_plan} fullWidth />
              <ViewField label="Plans for Further Education"
                value={plan.further_education ? 'Yes' : 'No'} />
              {plan.further_education && (
                <ViewField label="Education Details" value={plan.education_details} />
              )}
            </div>

            {/* Top 3 Career Choices */}
            {(plan.career_choice_1 || plan.career_choice_2 || plan.career_choice_3) && (
              <>
                <div style={subHeader}>Top 3 Career Choices</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[plan.career_choice_1, plan.career_choice_2, plan.career_choice_3].map((c, i) => (
                    c ? (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px',
                        background: 'var(--color-bg-page)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: '5px',
                      }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: 'var(--color-brand-primary)',
                          color: 'var(--color-brand-accent)',
                          fontSize: '11px', fontWeight: '700', flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: '13px', color: 'var(--color-brand-primary)' }}>{c}</span>
                      </div>
                    ) : null
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* EDIT (or no plan yet) */}
        {(editMode || !plan) && (
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Career Aspiration</label>
                  <input
                    style={inputStyle}
                    value={form.career_aspiration}
                    onChange={e => setForm({ ...form, career_aspiration: e.target.value })}
                    placeholder="e.g. Software engineer, Doctor, Business owner..."
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Aspired Industry</label>
                  <select
                    style={inputStyle}
                    value={form.aspired_industry}
                    onChange={e => setForm({ ...form, aspired_industry: e.target.value })}
                    disabled={readOnly}
                  >
                    <option value="">— Select Industry —</option>
                    {config.industries.map(i => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Long Term Plan (within 5 years)</label>
                <textarea
                  style={{ ...inputStyle, minHeight: '80px' }}
                  value={form.long_term_plan}
                  onChange={e => setForm({ ...form, long_term_plan: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 14px',
                background: form.further_education ? 'var(--color-bg-highlight)' : 'var(--color-bg-page)',
                border: `1px solid ${form.further_education ? 'var(--color-brand-accent)' : 'var(--color-border-subtle)'}`,
                borderRadius: '6px',
              }}>
                <input
                  type="checkbox"
                  id="career_further_ed"
                  checked={form.further_education}
                  onChange={e => setForm({ ...form, further_education: e.target.checked })}
                  disabled={readOnly}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand-accent)' }}
                />
                <label htmlFor="career_further_ed" style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Plans for further education
                </label>
              </div>

              {form.further_education && (
                <div>
                  <label style={labelStyle}>Education Details</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '70px' }}
                    value={form.education_details}
                    onChange={e => setForm({ ...form, education_details: e.target.value })}
                    disabled={readOnly}
                  />
                </div>
              )}

              {/* Top 3 Career Choices */}
              <div>
                <div style={subHeader}>Top 3 Career Choices</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[1, 2, 3].map(n => (
                    <div key={n} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'var(--color-brand-primary)',
                        color: 'var(--color-brand-accent)',
                        fontSize: '11px', fontWeight: '700', flexShrink: 0,
                      }}>{n}</span>
                      <input
                        style={inputStyle}
                        value={form[`career_choice_${n}`]}
                        onChange={e => setForm({ ...form, [`career_choice_${n}`]: e.target.value })}
                        placeholder={`Career choice ${n}${n === 1 ? ' (most preferred)' : ''}...`}
                        disabled={readOnly}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {!readOnly && (
              <div className="rsp-submit-row" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" disabled={saving} style={{ ...btnSuccess, opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving...' : 'Save Career Plan'}
                </button>
                {plan && (
                  <button type="button" onClick={handleCancel} style={btnGhost}>
                    Cancel
                  </button>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {/* ── 2. Holland Code (RIASEC) ─────────────────────────── */}
      <div style={card}>
        <div style={secTitle}>
          <span>Holland Code (RIASEC)</span>
          {(!editMode && plan && hollandCodeSaved) && (
            <span style={{
              background: 'var(--color-brand-primary)',
              color: 'var(--color-brand-accent)',
              padding: '3px 14px', borderRadius: '12px',
              fontSize: '13px', fontWeight: '700',
              letterSpacing: '2px',
            }}>{hollandCodeSaved}</span>
          )}
        </div>

        {!editMode && plan ? (
          hollandCodeSaved ? (
            <div className="rsp-grid-3" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
            }}>
              {['Primary', 'Secondary', 'Tertiary'].map((rank, i) => {
                const code = [plan.holland_primary, plan.holland_secondary, plan.holland_tertiary][i];
                const meta = config.holland_codes.find(h => h.value === code);
                return (
                  <div key={rank} style={{
                    padding: '12px 14px',
                    background: 'var(--color-bg-page)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '6px',
                  }}>
                    <div style={{
                      fontSize: '10px', fontWeight: '700',
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.4px',
                      marginBottom: '6px',
                    }}>{rank}</div>
                    {code ? (
                      <>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          marginBottom: '4px',
                        }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: 'var(--color-brand-accent)',
                            color: 'var(--color-brand-primary)',
                            fontSize: '13px', fontWeight: '700',
                          }}>{code}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-brand-primary)' }}>
                            {meta?.label}
                          </span>
                        </div>
                        {meta?.description && (
                          <div style={{
                            fontSize: '11px', color: 'var(--color-text-subdued)',
                            lineHeight: '1.4',
                          }}>{meta.description}</div>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-placeholder)' }}>—</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              No Holland Code recorded yet.
            </div>
          )
        ) : (
          <div>
            <div style={{
              fontSize: '12px', color: 'var(--color-text-subdued)',
              marginBottom: '14px', lineHeight: '1.5',
            }}>
              Pick the three personality types that best match this participant, in order of fit.
              The top three letters form their Holland Code (e.g. <strong>SIA</strong>).
            </div>
            <div className="rsp-grid-3" style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
              marginBottom: '14px',
            }}>
              {[
                { key: 'holland_primary',   label: 'Primary' },
                { key: 'holland_secondary', label: 'Secondary' },
                { key: 'holland_tertiary',  label: 'Tertiary' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <select
                    style={inputStyle}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    disabled={readOnly}
                  >
                    <option value="">— None —</option>
                    {config.holland_codes.map(h => (
                      <option key={h.value} value={h.value}>
                        {h.value} — {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Live preview of derived code */}
            {hollandCode && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--color-brand-primary)',
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '14px',
              }}>
                <span style={{
                  fontSize: '10px', fontWeight: '700',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                }}>Holland Code</span>
                <span style={{
                  fontSize: '18px', fontWeight: '700',
                  color: 'var(--color-brand-accent)',
                  letterSpacing: '4px',
                }}>{hollandCode}</span>
              </div>
            )}

            {/* Type reference chart */}
            <div style={{ display: 'grid', gap: '6px' }}>
              {config.holland_codes.map(h => {
                const active = [form.holland_primary, form.holland_secondary, form.holland_tertiary].includes(h.value);
                return (
                  <div key={h.value} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '6px 10px',
                    background: active ? 'var(--color-bg-highlight)' : 'transparent',
                    borderRadius: '4px',
                    opacity: active ? 1 : 0.75,
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: active ? 'var(--color-brand-accent)' : 'var(--color-bg-stripe)',
                      color: active ? 'var(--color-brand-primary)' : 'var(--color-text-subdued)',
                      fontSize: '11px', fontWeight: '700', flexShrink: 0,
                    }}>{h.value}</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-brand-primary)', minWidth: '90px' }}>
                      {h.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-subdued)', lineHeight: '1.4' }}>
                      {h.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Career Readiness ──────────────────────────────── */}
      <div style={card}>
        <div style={secTitle}>
          <span>Career Readiness</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '400' }}>
            {completedCount} / {totalItems} complete
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          background: 'var(--color-bg-stripe)',
          height: '10px', borderRadius: '5px',
          overflow: 'hidden', marginBottom: '18px',
          border: '1px solid var(--color-border-subtle)',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: pct === 100 ? 'var(--color-success)' : 'var(--color-brand-accent)',
            transition: 'width 0.3s ease',
          }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {config.readiness_items.map(item => {
            const entry = entriesByItem[item.value];
            const isCompleted = entry?.completed;
            const isSaving = savingItem === item.value || savingItem === entry?.id;
            const notesDraft = itemNotes[item.value] !== undefined
              ? itemNotes[item.value]
              : (entry?.notes || '');

            return (
              <div key={item.value} style={{
                border: `1px solid ${isCompleted ? 'var(--color-success)' : 'var(--color-border-subtle)'}`,
                background: isCompleted ? 'var(--color-tint-success)' : 'var(--color-bg-page)',
                borderRadius: '6px', padding: '12px 14px',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '12px', flexWrap: 'wrap',
                }}>
                  <input
                    type="checkbox"
                    id={`ready_${item.value}`}
                    checked={!!isCompleted}
                    disabled={readOnly || isSaving}
                    onChange={() => toggleReadinessItem(item.value, entry)}
                    style={{
                      width: '18px', height: '18px',
                      accentColor: 'var(--color-success)',
                      cursor: readOnly ? 'default' : 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <label htmlFor={`ready_${item.value}`} style={{
                    fontSize: '13px', fontWeight: '600', flex: 1,
                    color: isCompleted ? 'var(--color-success)' : 'var(--color-brand-primary)',
                    cursor: readOnly ? 'default' : 'pointer',
                  }}>
                    {item.label}
                  </label>

                  {entry && isCompleted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: '700',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.4px',
                      }}>
                        Completed
                      </span>
                      {readOnly ? (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-subdued)' }}>
                          {formatDate(entry.completed_date)}
                        </span>
                      ) : (
                        <input
                          type="date"
                          value={entry.completed_date
                            ? entry.completed_date.slice(0, 10) : ''}
                          onChange={e => updateCompletedDate(entry, e.target.value)}
                          disabled={isSaving}
                          style={{
                            ...inputStyle,
                            width: 'auto',
                            padding: '4px 8px',
                            fontSize: '12px',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                {entry && isCompleted && (
                  <div style={{ marginTop: '10px', paddingLeft: '30px' }}>
                    {readOnly ? (
                      entry.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-subdued)', fontStyle: 'italic' }}>
                          {entry.notes}
                        </div>
                      )
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <input
                          type="text"
                          value={notesDraft}
                          onChange={e => setItemNotes({ ...itemNotes, [item.value]: e.target.value })}
                          placeholder="Optional notes..."
                          style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
                          disabled={isSaving}
                        />
                        {notesDraft !== (entry.notes || '') && (
                          <button
                            type="button"
                            onClick={() => saveReadinessNotes(entry, notesDraft)}
                            disabled={isSaving}
                            style={{
                              ...btnPrimary, padding: '6px 12px', fontSize: '11px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Save
                          </button>
                        )}
                      </div>
                    )}
                    {entry.history && entry.history.length > 0 && (
                      <div style={{
                        marginTop: '8px', fontSize: '10px',
                        color: 'var(--color-text-muted)',
                      }}>
                        {entry.history.length} change{entry.history.length !== 1 ? 's' : ''} logged
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Job Interest ──────────────────────────────────── */}
      <div style={{
        ...card,
        background: plan?.interested_to_apply
          ? 'var(--color-bg-highlight)'
          : 'var(--color-bg-card)',
        border: plan?.interested_to_apply
          ? '2px solid var(--color-brand-accent)'
          : '1px solid var(--color-border-subtle)',
      }}>
        <div style={secTitle}>
          <span>Job Interest</span>
          {plan?.interested_to_apply && (
            <span style={{
              background: 'var(--color-brand-accent)',
              color: 'var(--color-brand-primary)',
              padding: '3px 12px', borderRadius: '12px',
              fontSize: '11px', fontWeight: '700',
              letterSpacing: '0.3px',
            }}>
              Interested to Apply
            </span>
          )}
        </div>

        {!editMode && plan ? (
          plan.interested_to_apply ? (
            <div>
              <div style={{
                fontSize: '13px', color: 'var(--color-text-subdued)',
                marginBottom: '14px', lineHeight: '1.6',
              }}>
                This participant is looking for employment opportunities.
              </div>
              <div className="rsp-grid-2" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
              }}>
                <ViewField label="Preferred Industry"
                  value={plan.interest_industry ? industryLabel(plan.interest_industry) : ''} />
                <ViewField label="Notes" value={plan.interest_notes} fullWidth />
              </div>
            </div>
          ) : (
            <div style={{
              fontSize: '13px', color: 'var(--color-text-muted)',
              fontStyle: 'italic',
            }}>
              Not currently flagged as interested in job placement.
            </div>
          )
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px',
              background: form.interested_to_apply
                ? 'var(--color-brand-primary)'
                : 'var(--color-bg-page)',
              border: `1px solid ${form.interested_to_apply ? 'var(--color-brand-accent)' : 'var(--color-border-subtle)'}`,
              borderRadius: '6px',
            }}>
              <input
                type="checkbox"
                id="interested_to_apply"
                checked={form.interested_to_apply}
                onChange={e => setForm({ ...form, interested_to_apply: e.target.checked })}
                disabled={readOnly}
                style={{ width: '16px', height: '16px', accentColor: 'var(--color-brand-accent)' }}
              />
              <label htmlFor="interested_to_apply" style={{
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                color: form.interested_to_apply
                  ? 'var(--color-brand-accent)'
                  : 'var(--color-brand-primary)',
              }}>
                Participant is interested in job placement
              </label>
            </div>

            {form.interested_to_apply && (
              <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Preferred Industry</label>
                  <select
                    style={inputStyle}
                    value={form.interest_industry}
                    onChange={e => setForm({ ...form, interest_industry: e.target.value })}
                    disabled={readOnly}
                  >
                    <option value="">— Select Industry —</option>
                    {config.industries.map(i => (
                      <option key={i.value} value={i.value}>{i.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <input
                    style={inputStyle}
                    value={form.interest_notes}
                    onChange={e => setForm({ ...form, interest_notes: e.target.value })}
                    placeholder="e.g. Available from June, willing to relocate..."
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── View mode field renderer ───────────────────────────────────────
function ViewField({ label, value, fullWidth = false }) {
  const has = value !== undefined && value !== null && value !== '';
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <div style={{
        fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px',
      }}>{label}</div>
      <div style={{
        fontSize: '13px',
        color: has ? 'var(--color-brand-primary)' : 'var(--color-text-placeholder)',
        whiteSpace: 'pre-wrap',
      }}>
        {has ? value : '—'}
      </div>
    </div>
  );
}
