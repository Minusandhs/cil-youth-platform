import { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { PLAN_GOALS, PLAN_STATUSES, ACTION_GOAL_TYPES, ACTION_STATUSES } from '../../lib/constants';

const CURRENT_YEAR = new Date().getFullYear();

// ── Shared styles ────────────────────────────────────────────────
const card = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '16px',
  boxShadow: '0 2px 8px rgba(26,22,16,0.06)',
};

const secTitle = {
  fontSize: '11px', fontWeight: '700',
  color: 'var(--color-text-subdued)',
  textTransform: 'uppercase', letterSpacing: '0.6px',
  marginBottom: '14px', paddingBottom: '8px',
  borderBottom: '1px solid var(--color-divider)',
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
  fontSize: '13px', color: 'var(--color-text-heading)',
  background: 'var(--color-bg-page)', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const btnPrimary = {
  background: 'var(--color-brand-primary)', color: 'var(--color-brand-accent)',
  border: 'none', borderRadius: '6px', padding: '9px 20px',
  fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
};

const btnSuccess = {
  background: 'var(--color-success)', color: '#fff',
  border: 'none', borderRadius: '6px', padding: '9px 20px',
  fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
};

const btnGhost = {
  background: 'transparent', color: 'var(--color-text-subdued)',
  border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
  padding: '9px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
};

const btnLink = {
  background: 'none', border: 'none', padding: 0,
  fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit',
  color: 'var(--color-info)', textDecoration: 'underline',
};

// ── Progress bar ─────────────────────────────────────────────────
function ProgressBar({ value, onChange, readonly }) {
  const segments = 10;
  const filled = Math.round((value / 100) * segments);
  return (
    <div>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '6px' }}>
        {Array.from({ length: segments }, (_, i) => (
          <div key={i}
            onClick={() => {
              if (readonly) return;
              const next = Math.round(((i + 1) / segments) * 100);
              onChange(next === value ? 0 : next);
            }}
            style={{
              flex: 1, height: '22px', borderRadius: '3px',
              background: i < filled
                ? 'var(--color-brand-accent)'
                : 'var(--color-divider)',
              cursor: readonly ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          />
        ))}
      </div>
      <div style={{
        fontSize: '12px', fontWeight: '700',
        color: 'var(--color-brand-accent)',
      }}>
        {value}% Complete
      </div>
    </div>
  );
}

// ── ViewField ────────────────────────────────────────────────────
function ViewField({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: '10px', fontWeight: '700', color: 'var(--color-text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px',
      }}>{label}</div>
      <div style={{
        fontSize: '13px', color: 'var(--color-text-heading)',
        lineHeight: '1.6', whiteSpace: 'pre-wrap',
      }}>{value}</div>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────
function StatusBadge({ status, list }) {
  const s = list.find(x => x.value === status) || list[0];
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: '10px',
      fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

// ── Empty form defaults ──────────────────────────────────────────
const emptyGoals = {
  spiritual_goal: '', academic_goal: '', social_goal: '',
  vocational_goal: '', health_goal: '', primary_mentor: '',
  progress_status: 'not_started',
};

const emptyItem = { goal_type: 'action_plan', action: '', due_date: '', status: 'pending' };

const emptyConv = {
  conversation_date: '', discussion_points: '',
  next_meeting_date: '', completion_rate: 0,
};

// ================================================================
export default function DevelopmentPlan({ participantId, participant, readOnly = false }) {
  const { user } = useAuth();
  const isLDCStaff = user?.role === 'ldc_staff';

  const [plans,        setPlans       ] = useState([]);
  const [selYear,      setSelYear     ] = useState(CURRENT_YEAR);
  const [plan,         setPlan        ] = useState(null);
  const [actionItems,  setActionItems ] = useState([]);
  const [conversations,setConversations] = useState([]);
  const [loading,      setLoading     ] = useState(true);
  const [error,        setError       ] = useState('');
  const [success,      setSuccess     ] = useState('');

  // Goals editing
  const [goalsEdit,    setGoalsEdit   ] = useState(false);
  const [goalsForm,    setGoalsForm   ] = useState(emptyGoals);
  const [savingGoals,  setSavingGoals ] = useState(false);

  // Action items
  const [showAddItem,  setShowAddItem ] = useState(false);
  const [newItemForm,  setNewItemForm ] = useState(emptyItem);
  const [editItemId,   setEditItemId  ] = useState(null);
  const [editItemForm, setEditItemForm] = useState(emptyItem);
  const [savingItem,   setSavingItem  ] = useState(false);

  // Conversations
  const [showAddConv,  setShowAddConv ] = useState(false);
  const [convForm,     setConvForm    ] = useState(emptyConv);
  const [savingConv,   setSavingConv  ] = useState(false);
  const [deletingConv, setDeletingConv] = useState(null);

  // Creating plan
  const [creating,     setCreating    ] = useState(false);

  // ── Load all plans for participant ───────────────────────────
  const loadPlans = useCallback(async () => {
    try {
      const res = await api.get(`/api/development/${participantId}`);
      setPlans(res.data);
    } catch {
      setError('Failed to load plans');
    }
  }, [participantId]);

  // ── Load plan for selected year + sub-resources ──────────────
  const loadPlan = useCallback(async () => {
    setLoading(true);
    setPlan(null);
    setActionItems([]);
    setConversations([]);
    setGoalsEdit(false);
    setShowAddItem(false);
    setEditItemId(null);
    setError(''); setSuccess('');
    try {
      const res = await api.get(`/api/development/${participantId}/${selYear}`);
      const p = res.data;
      setPlan(p);
      setGoalsForm({
        spiritual_goal:  p.spiritual_goal  || '',
        academic_goal:   p.academic_goal   || '',
        social_goal:     p.social_goal     || '',
        vocational_goal: p.vocational_goal || '',
        health_goal:     p.health_goal     || '',
        primary_mentor:  p.primary_mentor  || '',
        progress_status: p.progress_status || 'not_started',
      });

      const [itemsRes, convsRes] = await Promise.all([
        api.get(`/api/development/${p.id}/actions`),
        api.get(`/api/development/${p.id}/conversations`),
      ]);
      setActionItems(itemsRes.data);
      setConversations(convsRes.data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
      setShowAddConv(false);
    }
  }, [participantId, selYear]);

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { loadPlan();  }, [loadPlan]);

  // ── Derived values ───────────────────────────────────────────
  const planYears   = plans.map(p => p.plan_year);
  const years       = [...new Set([...planYears, CURRENT_YEAR])].sort((a, b) => b - a);
  const planStatus  = PLAN_STATUSES.find(s => s.value === (plan?.progress_status || 'not_started'));

  function notify(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  }

  // ── Create plan ──────────────────────────────────────────────
  async function handleCreate() {
    setCreating(true); setError('');
    try {
      await api.post('/api/development', {
        participant_id: participantId,
        plan_year: selYear,
      });
      await loadPlans();
      await loadPlan();
      notify(`${selYear} development plan created.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create plan');
    } finally {
      setCreating(false);
    }
  }

  // ── Save goals ───────────────────────────────────────────────
  async function handleSaveGoals(e) {
    e.preventDefault();
    setSavingGoals(true); setError('');
    try {
      const res = await api.put(`/api/development/${plan.id}`, goalsForm);
      setPlan(res.data);
      setGoalsEdit(false);
      notify('Goals saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save goals');
    } finally {
      setSavingGoals(false);
    }
  }

  // ── Add action item ──────────────────────────────────────────
  async function handleAddItem(e) {
    e.preventDefault();
    setSavingItem(true); setError('');
    try {
      const res = await api.post(`/api/development/${plan.id}/actions`, newItemForm);
      setActionItems(prev => [...prev, res.data]);
      setNewItemForm(emptyItem);
      setShowAddItem(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    } finally {
      setSavingItem(false);
    }
  }

  // ── Save edited action item ──────────────────────────────────
  async function handleSaveItem(e) {
    e.preventDefault();
    setSavingItem(true); setError('');
    try {
      const res = await api.put(
        `/api/development/${plan.id}/actions/${editItemId}`,
        editItemForm
      );
      setActionItems(prev => prev.map(it => it.id === editItemId ? res.data : it));
      setEditItemId(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setSavingItem(false);
    }
  }

  // ── Delete action item ───────────────────────────────────────
  async function handleDeleteItem(itemId) {
    if (!window.confirm('Delete this action item?')) return;
    try {
      await api.delete(`/api/development/${plan.id}/actions/${itemId}`);
      setActionItems(prev => prev.filter(it => it.id !== itemId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  }

  // ── Save conversation ────────────────────────────────────────
  async function handleSaveConv(e) {
    e.preventDefault();
    setSavingConv(true); setError('');
    try {
      const res = await api.post(`/api/development/${plan.id}/conversations`, convForm);
      // Re-load conversations to get recorded_by_name from server join
      const convsRes = await api.get(`/api/development/${plan.id}/conversations`);
      setConversations(convsRes.data);
      // Update plan's completion_rate locally
      setPlan(prev => ({ ...prev, completion_rate: convForm.completion_rate }));
      setConvForm(emptyConv);
      setShowAddConv(false);
      notify('Conversation saved.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save conversation');
    } finally {
      setSavingConv(false);
    }
  }

  // ── Delete conversation ──────────────────────────────────────
  async function handleDeleteConv(convId) {
    if (!window.confirm('Delete this conversation record?')) return;
    setDeletingConv(convId);
    try {
      await api.delete(`/api/development/${plan.id}/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c.id !== convId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete conversation');
    } finally {
      setDeletingConv(null);
    }
  }

  // ── Generate PDF ─────────────────────────────────────────────
  function handleGeneratePDF() {
    const name = participant?.full_name || 'Participant';
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(buildPrintHTML(name, selYear, plan, actionItems, conversations));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  // ── Render ───────────────────────────────────────────────────
  if (loading) {
    return <div style={{ padding: '32px', color: 'var(--color-text-subdued)' }}>Loading...</div>;
  }

  return (
    <div>
      {/* Banners */}
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

      {/* Header — year selector + PDF button */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h3 style={{
            fontSize: '16px', fontWeight: '700',
            color: 'var(--color-text-heading)', margin: 0,
          }}>
            Development Plan
          </h3>
          <select
            value={selYear}
            onChange={e => setSelYear(parseInt(e.target.value))}
            style={{
              padding: '7px 11px', border: '1px solid var(--color-border-subtle)',
              borderRadius: '5px', fontSize: '13px',
              background: 'var(--color-bg-page)', outline: 'none',
              fontFamily: 'inherit', fontWeight: '700',
              color: 'var(--color-brand-accent)',
            }}
          >
            {years.map(y => (
              <option key={y} value={y}>{y} {planYears.includes(y) ? '✓' : ''}</option>
            ))}
          </select>
          {plan && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Started {new Date(plan.created_at).toLocaleDateString('en-GB')}
            </span>
          )}
        </div>

        {plan && (
          <button onClick={handleGeneratePDF} style={{
            ...btnGhost,
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', padding: '8px 14px',
          }}>
            ⬇ Generate PDF
          </button>
        )}
      </div>

      {/* Progress summary bar */}
      {plan && (
        <div style={{
          background: 'var(--color-brand-primary)', borderRadius: '8px',
          padding: '20px', marginBottom: '16px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
        }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{
              fontSize: '11px', color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px',
            }}>
              Overall Progress — {selYear}
            </div>
            <ProgressBar value={plan.completion_rate || 0} readonly />
          </div>
          <StatusBadge status={plan.progress_status} list={PLAN_STATUSES} />
        </div>
      )}

      {/* No plan yet */}
      {!plan && (
        <div style={{
          ...card,
          padding: '40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
          <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>
            No Plan for {selYear}
          </div>
          <div style={{ color: 'var(--color-text-subdued)', fontSize: '13px', marginBottom: '20px' }}>
            Create a development plan for {participant?.full_name?.split(' ')[0]} for {selYear}.
          </div>
          {!readOnly && (
            <button disabled={creating} onClick={handleCreate} style={btnPrimary}>
              {creating ? 'Creating...' : `+ Create ${selYear} Plan`}
            </button>
          )}
        </div>
      )}

      {plan && (
        <>
          {/* ── Development Goals ─────────────────────────────── */}
          <div style={card}>
            <div style={secTitle}>
              Development Goals
              {!readOnly && !goalsEdit && (
                <button onClick={() => setGoalsEdit(true)} style={{
                  ...btnLink, fontSize: '12px',
                }}>Edit</button>
              )}
            </div>

            {goalsEdit ? (
              <form onSubmit={handleSaveGoals}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {PLAN_GOALS.map(g => (
                    <div key={g.key}>
                      <label style={labelStyle}>{g.label}</label>
                      <textarea
                        style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }}
                        placeholder={g.placeholder}
                        value={goalsForm[g.key]}
                        onChange={e => setGoalsForm({ ...goalsForm, [g.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <label style={labelStyle}>Primary Mentor</label>
                    <input style={inputStyle}
                      value={goalsForm.primary_mentor}
                      onChange={e => setGoalsForm({ ...goalsForm, primary_mentor: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Plan Status</label>
                    <select style={inputStyle}
                      value={goalsForm.progress_status}
                      onChange={e => setGoalsForm({ ...goalsForm, progress_status: e.target.value })}
                    >
                      {PLAN_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2.5 mt-4">
                  <button type="submit" disabled={savingGoals} className="w-full md:w-auto" style={btnSuccess}>
                    {savingGoals ? 'Saving...' : 'Save Goals'}
                  </button>
                  <button type="button" className="w-full md:w-auto" onClick={() => {
                    setGoalsEdit(false);
                    setGoalsForm({
                      spiritual_goal:  plan.spiritual_goal  || '',
                      academic_goal:   plan.academic_goal   || '',
                      social_goal:     plan.social_goal     || '',
                      vocational_goal: plan.vocational_goal || '',
                      health_goal:     plan.health_goal     || '',
                      primary_mentor:  plan.primary_mentor  || '',
                      progress_status: plan.progress_status || 'not_started',
                    });
                  }} style={btnGhost}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 md:gap-x-6">
                  {PLAN_GOALS.map(g => (
                    <ViewField key={g.key} label={g.label} value={plan[g.key]} />
                  ))}
                </div>
                {!PLAN_GOALS.some(g => plan[g.key]) && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    No goals recorded yet.{!readOnly && ' Click Edit to add goals.'}
                  </div>
                )}
                {plan.primary_mentor && (
                  <div style={{
                    marginTop: '12px', paddingTop: '12px',
                    borderTop: '1px solid var(--color-divider)',
                  }}>
                    <ViewField label="Primary Mentor" value={plan.primary_mentor} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Action Plan Items ──────────────────────────────── */}
          <div style={card}>
            <div style={secTitle}>
              Action Plan
              {!readOnly && !showAddItem && (
                <button onClick={() => setShowAddItem(true)} style={btnPrimary}>
                  + Add Item
                </button>
              )}
            </div>

            {/* Add item form */}
            {!readOnly && showAddItem && (
              <form onSubmit={handleAddItem} style={{
                background: 'var(--color-bg-highlight)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '6px', padding: '16px', marginBottom: '16px',
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Goal Type</label>
                    <select style={inputStyle}
                      value={newItemForm.goal_type}
                      onChange={e => setNewItemForm({ ...newItemForm, goal_type: e.target.value })}
                      required
                    >
                      {ACTION_GOAL_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select style={inputStyle}
                      value={newItemForm.status}
                      onChange={e => setNewItemForm({ ...newItemForm, status: e.target.value })}
                    >
                      {ACTION_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={labelStyle}>Action</label>
                  <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                    value={newItemForm.action}
                    onChange={e => setNewItemForm({ ...newItemForm, action: e.target.value })}
                    placeholder="Describe the action step..."
                    required
                  />
                </div>
                <div style={{ marginTop: '12px' }}>
                  <label style={labelStyle}>Due Date</label>
                  <input type="date" style={{ ...inputStyle, maxWidth: '200px' }}
                    value={newItemForm.due_date}
                    onChange={e => setNewItemForm({ ...newItemForm, due_date: e.target.value })}
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-2.5 mt-3">
                  <button type="submit" disabled={savingItem} className="w-full md:w-auto" style={btnSuccess}>
                    {savingItem ? 'Adding...' : 'Add Item'}
                  </button>
                  <button type="button" className="w-full md:w-auto" onClick={() => {
                    setShowAddItem(false);
                    setNewItemForm(emptyItem);
                  }} style={btnGhost}>Cancel</button>
                </div>
              </form>
            )}

            {/* Action items table */}
            {actionItems.length === 0 && !showAddItem ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No action items yet.{!readOnly && ' Click "+ Add Item" to start.'}
              </div>
            ) : actionItems.length > 0 && (
              <div className="rsp-table-wrap">
                <table className="rsp-card-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-stripe)' }}>
                      {['Goal Type', 'Action', 'Due Date', 'Status', ''].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 10px',
                          fontSize: '10px', fontWeight: '700',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase', letterSpacing: '0.4px',
                          borderBottom: '1px solid var(--color-divider)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {actionItems.map(item => (
                      editItemId === item.id ? (
                        <tr key={item.id}>
                          <td colSpan={5} data-label="Edit" style={{ padding: '12px 10px' }}>
                            <form onSubmit={handleSaveItem}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                <div>
                                  <label style={labelStyle}>Goal Type</label>
                                  <select style={inputStyle}
                                    value={editItemForm.goal_type}
                                    onChange={e => setEditItemForm({ ...editItemForm, goal_type: e.target.value })}
                                  >
                                    {ACTION_GOAL_TYPES.map(t => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={labelStyle}>Status</label>
                                  <select style={inputStyle}
                                    value={editItemForm.status}
                                    onChange={e => setEditItemForm({ ...editItemForm, status: e.target.value })}
                                  >
                                    {ACTION_STATUSES.map(s => (
                                      <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div style={{ marginTop: '10px' }}>
                                <label style={labelStyle}>Action</label>
                                <textarea style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
                                  value={editItemForm.action}
                                  onChange={e => setEditItemForm({ ...editItemForm, action: e.target.value })}
                                  required
                                />
                              </div>
                              <div style={{ marginTop: '10px' }}>
                                <label style={labelStyle}>Due Date</label>
                                <input type="date" style={{ ...inputStyle, maxWidth: '180px' }}
                                  value={editItemForm.due_date}
                                  onChange={e => setEditItemForm({ ...editItemForm, due_date: e.target.value })}
                                />
                              </div>
                              <div className="flex flex-col md:flex-row gap-2 mt-2.5">
                                <button type="submit" disabled={savingItem} className="w-full md:w-auto" style={{ ...btnSuccess, padding: '7px 16px', fontSize: '12px' }}>
                                  {savingItem ? 'Saving...' : 'Save'}
                                </button>
                                <button type="button" onClick={() => setEditItemId(null)} className="w-full md:w-auto" style={{ ...btnGhost, padding: '7px 14px', fontSize: '12px' }}>
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                          <td data-label="Goal Type" style={{ padding: '10px', fontSize: '13px', verticalAlign: 'top' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-subdued)' }}>
                              {ACTION_GOAL_TYPES.find(t => t.value === item.goal_type)?.label || item.goal_type}
                            </span>
                          </td>
                          <td data-label="Action" style={{ padding: '10px', fontSize: '13px', verticalAlign: 'top', maxWidth: '300px' }}>
                            {item.action}
                          </td>
                          <td data-label="Due Date" style={{ padding: '10px', fontSize: '13px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {item.due_date
                              ? new Date(item.due_date).toLocaleDateString('en-GB')
                              : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                          </td>
                          <td data-label="Status" style={{ padding: '10px', verticalAlign: 'top' }}>
                            <StatusBadge status={item.status} list={ACTION_STATUSES} />
                          </td>
                          <td data-label="Actions" style={{ padding: '10px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                            {!readOnly && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => {
                                  setEditItemId(item.id);
                                  setEditItemForm({
                                    goal_type: item.goal_type,
                                    action: item.action,
                                    due_date: item.due_date ? item.due_date.split('T')[0] : '',
                                    status: item.status,
                                  });
                                  setShowAddItem(false);
                                }} style={{ ...btnLink, color: 'var(--color-info)' }}>Edit</button>
                                <button onClick={() => handleDeleteItem(item.id)}
                                  style={{ ...btnLink, color: 'var(--color-danger)' }}>Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Mentor Conversations ───────────────────────────── */}
          <div style={card}>
            <div style={secTitle}>
              <div>
                Mentor Conversations
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '400', textTransform: 'none', marginLeft: '8px' }}>
                  {conversations.length} record{conversations.length !== 1 ? 's' : ''}
                </span>
              </div>
              {!readOnly && !showAddConv && (
                <button onClick={() => setShowAddConv(true)} style={btnPrimary}>
                  + Add Conversation
                </button>
              )}
            </div>

            {/* Add conversation form */}
            {!readOnly && showAddConv && (
              <div style={{
                background: 'var(--color-bg-highlight)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '6px', padding: '16px', marginBottom: '20px',
              }}>
                <div style={{
                  fontSize: '11px', fontWeight: '700',
                  color: 'var(--color-text-subdued)',
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                  marginBottom: '12px',
                }}>Log New Conversation</div>
                <form onSubmit={handleSaveConv}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle}>Date &amp; Time</label>
                      <input type="datetime-local" style={inputStyle}
                        value={convForm.conversation_date}
                        onChange={e => setConvForm({ ...convForm, conversation_date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Next Meeting Date</label>
                      <input type="date" style={inputStyle}
                        value={convForm.next_meeting_date}
                        onChange={e => setConvForm({ ...convForm, next_meeting_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={labelStyle}>Discussion Points</label>
                    <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                      value={convForm.discussion_points}
                      onChange={e => setConvForm({ ...convForm, discussion_points: e.target.value })}
                      placeholder="What was discussed during this conversation..."
                      required
                    />
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={labelStyle}>Progress</label>
                    <ProgressBar
                      value={convForm.completion_rate}
                      onChange={val => setConvForm({ ...convForm, completion_rate: val })}
                    />
                  </div>
                  <div className="flex flex-col md:flex-row gap-2.5 mt-3.5">
                    <button type="submit" disabled={savingConv} className="w-full md:w-auto" style={btnSuccess}>
                      {savingConv ? 'Saving...' : 'Save Conversation'}
                    </button>
                    <button type="button" onClick={() => {
                      setConvForm(emptyConv);
                      setShowAddConv(false);
                    }} className="w-full md:w-auto" style={btnGhost}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Conversation history */}
            {conversations.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                No conversations recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {conversations.map(c => (
                  <div key={c.id} style={{
                    background: 'var(--color-bg-page)',
                    border: '1px solid var(--color-divider)',
                    borderRadius: '6px', padding: '14px',
                  }}>
                    {/* Date + recorded by + delete */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: '8px', flexWrap: 'wrap', marginBottom: '8px',
                    }}>
                      <span style={{
                        fontSize: '13px', fontWeight: '700',
                        color: 'var(--color-text-heading)',
                      }}>
                        {new Date(c.conversation_date).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span style={{
                        fontSize: '11px', fontWeight: '700',
                        color: 'var(--color-brand-accent)',
                      }}>
                        {c.completion_rate}%
                      </span>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {c.recorded_by_name && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {c.recorded_by_name}
                          </span>
                        )}
                        {!readOnly && (
                          <button
                            onClick={() => handleDeleteConv(c.id)}
                            disabled={deletingConv === c.id}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--color-danger)', fontSize: '11px',
                              fontFamily: 'inherit', padding: '2px 4px',
                            }}
                          >
                            {deletingConv === c.id ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Discussion points */}
                    <div style={{
                      fontSize: '13px', color: 'var(--color-text-heading)',
                      lineHeight: '1.6', marginBottom: c.next_meeting_date ? '10px' : 0,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {c.discussion_points}
                    </div>

                    {/* Next meeting */}
                    {c.next_meeting_date && (
                      <div style={{
                        display: 'inline-block',
                        background: 'var(--color-tint-info)',
                        color: 'var(--color-info)',
                        border: '1px solid var(--color-info)',
                        borderRadius: '4px', padding: '3px 10px',
                        fontSize: '11px', fontWeight: '600',
                      }}>
                        Next meeting:{' '}
                        {new Date(c.next_meeting_date).toLocaleDateString('en-GB')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ================================================================
// PDF print HTML builder — A4, 2 pages
// Page 1: Annual plan (goals + mentor details + action plan)
// Page 2: Mentor conversation records
// Both pages fill the full A4 content area using flexbox stretching.
// ================================================================
function buildPrintHTML(name, year, plan, actionItems, conversations) {
  const fmt = d => d ? new Date(d).toLocaleDateString('en-GB') : '—';
  const fmtDt = d => d ? new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';
  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');

  const goalDefs = [
    { key: 'spiritual_goal',  label: 'Spiritual Goal' },
    { key: 'academic_goal',   label: 'Academic Goal' },
    { key: 'social_goal',     label: 'Social / Community Goal' },
    { key: 'vocational_goal', label: 'Vocational / Career Goal' },
    { key: 'health_goal',     label: 'Health Goal' },
  ];

  const goalTypeLabel = v => ({
    action_plan: 'Action Plan',
    academic:    'Academic Goal',
    social:      'Social / Community Goal',
    vocational:  'Vocational / Career Goal',
    health:      'Health Goal',
  }[v] || v);

  const planStatusLabel = v => ({
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed:   'Completed',
    on_hold:     'On Hold',
  }[v] || '—');

  // ── Goals grid — each cell stretches to fill its row ─────────
  const goalRows = goalDefs.map(g => {
    const val = plan?.[g.key] || '';
    return `
      <div class="goal-block">
        <div class="field-label">${g.label}</div>
        <div class="goal-body">
          ${val
            ? `<div class="goal-value">${esc(val)}</div>`
            : `<div class="blank-lines"><div class="bl"></div><div class="bl"></div><div class="bl"></div></div>`
          }
        </div>
      </div>`;
  }).join('');

  // ── Action plan rows — no min padding, rows stretch via CSS ──
  const actionRows = (actionItems || []).map(it => `
    <tr>
      <td>${esc(goalTypeLabel(it.goal_type))}</td>
      <td>${esc(it.action)}</td>
      <td>${fmt(it.due_date)}</td>
      <td>${it.status ? it.status.charAt(0).toUpperCase() + it.status.slice(1) : ''}</td>
    </tr>`).join('') || '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';

  // ── Conversation rows ─────────────────────────────────────────
  const convRows = (conversations || []).map(c => `
    <tr>
      <td>${fmtDt(c.conversation_date)}</td>
      <td>${esc(c.discussion_points)}</td>
      <td>${fmt(c.next_meeting_date)}</td>
      <td style="text-align:center">${c.completion_rate ?? 0}%</td>
    </tr>`).join('') || '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>';

  const header = pg => `
    <div class="page-header">
      <div>
        <div class="org-name">CIL Youth Platform — Development Plan</div>
        <div class="subline">
          <strong>${esc(name)}</strong> &nbsp;·&nbsp; Year: <strong>${year}</strong>
          ${plan?.primary_mentor ? `&nbsp;·&nbsp; Mentor: <strong>${esc(plan.primary_mentor)}</strong>` : ''}
          &nbsp;·&nbsp; Status: <strong>${planStatusLabel(plan?.progress_status)}</strong>
        </div>
      </div>
      <div class="page-num">Page ${pg} / 2</div>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Development Plan — ${esc(name)} — ${year}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* A4: 297mm tall, 210mm wide. Margin 12mm all sides → content 273mm × 186mm */
    @page { size: A4 portrait; margin: 12mm; }

    html, body { height: 100%; font-family: Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }

    /* ── Page: flex column that fills exactly one A4 content area ── */
    .page {
      width: 100%;
      height: 273mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-after: always;
    }
    .page:last-child { page-break-after: avoid; }

    /* ── Header ── */
    .page-header {
      flex-shrink: 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--color-brand-primary);
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .org-name  { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
    .subline   { font-size: 10.5px; color: #444; }
    .page-num  { font-size: 10px; color: #999; white-space: nowrap; padding-top: 2px; }

    /* ── Meta bar ── */
    .meta-row {
      flex-shrink: 0;
      display: flex;
      gap: 0;
      border: 1px solid var(--color-border-subtle);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .meta-item {
      flex: 1;
      padding: 6px 10px;
      border-right: 1px solid var(--color-border-subtle);
      background: #f5f2ec;
    }
    .meta-item:last-child { border-right: none; }
    .meta-label { font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #888; margin-bottom: 2px; }
    .meta-value { font-size: 11px; font-weight: 700; color: #111; }

    /* ── Section title ── */
    .sec-title {
      flex-shrink: 0;
      font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.7px; color: #666;
      border-bottom: 1px solid #bbb;
      padding-bottom: 3px; margin-bottom: 8px;
    }

    /* ── Goals section: fixed height, grid fills it ── */
    .goals-section { flex-shrink: 0; margin-bottom: 10px; }
    .goals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(3, 1fr);
      gap: 6px 18px;
      height: 105mm;
    }
    .goal-block {
      display: flex;
      flex-direction: column;
    }
    .field-label {
      font-size: 8.5px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.3px;
      color: #777; margin-bottom: 3px; flex-shrink: 0;
    }
    .goal-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .goal-value {
      flex: 1;
      font-size: 11px; color: #111; line-height: 1.5;
      border-left: 2px solid var(--color-brand-accent);
      padding-left: 6px;
    }
    .blank-lines { flex: 1; display: flex; flex-direction: column; gap: 0; }
    .bl { flex: 1; border-bottom: 1px solid #ccc; }

    /* ── Stretching table section: takes all remaining space ── */
    .stretch-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .table-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    /* The table itself stretches; rows distribute the space evenly */
    .table-wrap table {
      width: 100%;
      flex: 1;
      height: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      table-layout: fixed;
    }
    th {
      background: var(--color-brand-primary); color: var(--color-brand-accent);
      border: 1px solid #333;
      padding: 5px 7px;
      text-align: left; font-size: 9px;
      text-transform: uppercase; letter-spacing: 0.3px;
      font-weight: 700;
    }
    /* height:1px on tr + height:100% on td = rows share all available space */
    .table-wrap tbody tr { height: 1px; }
    .table-wrap tbody td {
      height: 100%;
      border: 1px solid #ccc;
      padding: 4px 7px;
      vertical-align: top;
      word-break: break-word;
    }
    .table-wrap tbody tr:nth-child(even) td { background: var(--color-bg-page); }

    @media print {
      .page { page-break-after: always; }
      .page:last-child { page-break-after: avoid; }
    }
  </style>
</head>
<body>

<!-- ══════════════════════ PAGE 1 ══════════════════════ -->
<div class="page">
  ${header(1)}

  <div class="meta-row">
    <div class="meta-item">
      <div class="meta-label">Primary Mentor</div>
      <div class="meta-value">${esc(plan?.primary_mentor) || '—'}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Plan Status</div>
      <div class="meta-value">${planStatusLabel(plan?.progress_status)}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Overall Progress</div>
      <div class="meta-value">${plan?.completion_rate ?? 0}%</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Plan Started</div>
      <div class="meta-value">${fmt(plan?.created_at)}</div>
    </div>
  </div>

  <div class="goals-section">
    <div class="sec-title">Development Goals</div>
    <div class="goals-grid">${goalRows}</div>
  </div>

  <div class="stretch-section">
    <div class="sec-title">Action Plan</div>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col style="width:22%">
          <col>
          <col style="width:13%">
          <col style="width:12%">
        </colgroup>
        <thead>
          <tr>
            <th>Goal Type</th>
            <th>Action</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${actionRows}</tbody>
      </table>
    </div>
  </div>
</div>

<!-- ══════════════════════ PAGE 2 ══════════════════════ -->
<div class="page">
  ${header(2)}

  <div class="stretch-section">
    <div class="sec-title">Mentor Conversation Records</div>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col style="width:20%">
          <col>
          <col style="width:15%">
          <col style="width:10%">
        </colgroup>
        <thead>
          <tr>
            <th>Date &amp; Time</th>
            <th>Discussion Points</th>
            <th>Next Meeting</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>${convRows}</tbody>
      </table>
    </div>
  </div>
</div>

</body>
</html>`;
}
