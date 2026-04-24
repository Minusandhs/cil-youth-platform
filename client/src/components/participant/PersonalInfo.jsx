import { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  CURRENT_STATUS,
  statusLabel, maritalLabel,
} from '../../lib/constants';
import { useConstants } from '../../lib/useConstants';

export default function PersonalInfo({ participant, onUpdate, readOnly = false }) {
  const options = useConstants();
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [schoolGrades, setSchoolGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [form, setForm] = useState({
    marital_status: '',
    living_outside_ldc: false,
    outside_purpose: '',
    outside_location: '',
    is_pregnant: false,
    number_of_children: 0,
    current_status: '',
    current_institution: '',
    current_course: '',
    current_year: '',
    current_exam_type: '',
    family_income: '',
    no_of_dependants: '',
  });

  useEffect(() => { loadAll(); }, [participant?.id]);

  async function loadAll() {
    try {
      const [profileRes, historyRes, gradesRes] = await Promise.all([
        api.get(`/api/participants/${participant.id}/profile`).catch(() => null),
        api.get(`/api/participants/${participant.id}/status-history`).catch(() => ({ data: [] })),
        api.get('/api/school-grades').catch(() => ({ data: [] })),
      ]);
      setSchoolGrades((gradesRes?.data || []).filter(g => g.is_active));

      if (profileRes?.data) {
        setProfile(profileRes.data);
        setForm({
          marital_status: profileRes.data.marital_status || '',
          living_outside_ldc: profileRes.data.living_outside_ldc || false,
          outside_purpose: profileRes.data.outside_purpose || '',
          outside_location: profileRes.data.outside_location || '',
          is_pregnant: profileRes.data.is_pregnant || false,
          number_of_children: profileRes.data.number_of_children || 0,
          current_status: profileRes.data.current_status || '',
          current_institution: profileRes.data.current_institution || '',
          current_course: profileRes.data.current_course || '',
          current_year: profileRes.data.current_year || '',
          current_exam_type: profileRes.data.current_exam_type || '',
          family_income: profileRes.data.family_income || '',
          no_of_dependants: profileRes.data.no_of_dependants || '',
        });
      } else {
        // No profile yet — open in edit mode
        setEditMode(true);
      }
      setHistory(historyRes?.data || []);
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    // ── Mandatory field validation ───────────────────────────────
    const missing = [];
    if (!form.marital_status) missing.push('Marital Status');
    if (!form.current_status) missing.push('Current Status');
    if (form.current_status && CURRENT_STATUS[form.current_status]) {
      for (const f of CURRENT_STATUS[form.current_status].fields) {
        if (!form[f.key]) missing.push(f.label);
      }
    }
    if (!form.family_income) missing.push('Family Monthly Income');
    if (form.no_of_dependants === '' || form.no_of_dependants === null || form.no_of_dependants === undefined)
      missing.push('Number of Dependants');
    if (missing.length > 0) {
      setError(`Please fill in the following required fields: ${missing.join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      // Save profile
      if (profile) {
        await api.put(`/api/participants/${participant.id}/profile`, form);
      } else {
        await api.post(`/api/participants/${participant.id}/profile`, form);
      }

      // Save status history if status changed
      if (form.current_status) {
        const lastHistory = history[0];
        const newInstitution = form.current_institution || form.current_exam_type || '';
        const newCourse = form.current_course || '';
        const newYearLevel = form.current_year || '';

        const hasChanged = !lastHistory ||
          lastHistory.status !== form.current_status ||
          (lastHistory.institution || '') !== newInstitution ||
          (lastHistory.course || '') !== newCourse ||
          (lastHistory.year_level || '') !== newYearLevel;

        if (hasChanged) {
          await api.post(`/api/participants/${participant.id}/status-history`, {
            status: form.current_status,
            institution: newInstitution,
            course: newCourse,
            year_level: newYearLevel,
          });
        }
      }

      setSuccess('Profile saved successfully');
      setEditMode(false);
      loadAll();
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setEditMode(false);
    setError(''); setSuccess('');
    if (!profile) {
      // No profile saved yet — reset to blank so next edit starts clean
      setForm({
        marital_status: '', living_outside_ldc: false, outside_purpose: '',
        outside_location: '', is_pregnant: false, number_of_children: 0,
        current_status: '', current_institution: '', current_course: '', current_year: '',
        current_exam_type: '',
        family_income: '', no_of_dependants: '',
      });
      return;
    }
    // Reset form to saved profile
    if (profile) {
      setForm({
        marital_status: profile.marital_status || '',
        living_outside_ldc: profile.living_outside_ldc || false,
        outside_purpose: profile.outside_purpose || '',
        outside_location: profile.outside_location || '',
        is_pregnant: profile.is_pregnant || false,
        number_of_children: profile.number_of_children || 0,
        current_status: profile.current_status || '',
        current_institution: profile.current_institution || '',
        current_course: profile.current_course || '',
        current_year: profile.current_year || '',
        current_exam_type: profile.current_exam_type || '',
        family_income: profile.family_income || '',
        no_of_dependants: profile.no_of_dependants || '',
      });
    }
  }

  // ── Style helpers ───────────────────────────────────────────────
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: '700',
    color: '#3d3528', letterSpacing: '0.3px',
    textTransform: 'uppercase', marginBottom: '5px'
  };

  const inputStyle = (disabled) => ({
    width: '100%', padding: '9px 11px',
    border: '1px solid #d4c9b0', borderRadius: '5px',
    fontSize: '13px', color: disabled ? '#a09080' : '#1a1610',
    background: disabled ? '#f0ece2' : '#faf8f3',
    outline: 'none', fontFamily: 'inherit',
    cursor: disabled ? 'default' : 'text'
  });

  const sectionStyle = {
    background: '#fffef9', border: '1px solid #d4c9b0',
    borderRadius: '8px', padding: '20px', marginBottom: '20px'
  };

  const sectionTitleStyle = {
    fontSize: '14px', fontWeight: '700',
    marginBottom: '16px', paddingBottom: '10px',
    borderBottom: '1px solid #e8e0d0', color: '#1a1610',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  };

  // ── View mode field renderer ────────────────────────────────────
  function ViewField({ label, value, inline = false }) {
    if (inline) {
      const hasValue = value !== undefined && value !== null && value !== '';
      return (
        <div className="pi-vf-row" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          gap: '16px', padding: '8px 0',
          borderBottom: '1px solid var(--color-divider)'
        }}>
          <div className="pi-vf-lbl" style={{
            fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0
          }}>{label}</div>
          <div style={{
            fontSize: '13px', textAlign: 'right',
            color: hasValue ? 'var(--color-brand-primary)' : 'var(--color-text-placeholder)'
          }}>
            {hasValue ? value : '—'}
          </div>
        </div>
      );
    }
    return (
      <div>
        <div style={{
          fontSize: '10px', fontWeight: '700', color: '#a09080',
          textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px'
        }}>{label}</div>
        <div style={{ fontSize: '13px', color: value ? '#1a1610' : '#c0b090' }}>
          {value || '—'}
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ padding: '32px', color: '#6b5e4a' }}>Loading profile...</div>
  );

  return (
    <div>
      {/* Messages */}
      {error && (
        <div style={{
          background: '#f5e0e3', border: '1px solid #9b2335',
          borderRadius: '6px', padding: '10px 14px',
          color: '#9b2335', fontSize: '13px', marginBottom: '16px'
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background: '#d8ede4', border: '1px solid #2d6a4f',
          borderRadius: '6px', padding: '10px 14px',
          color: '#2d6a4f', fontSize: '13px', marginBottom: '16px'
        }}>{success}</div>
      )}

      {/* ── VIEW MODE ─────────────────────────────────────────── */}
      {!editMode && profile && (
        <div>
          {/* Edit Button */}
          {!readOnly && (
            <div className="rsp-edit-btn-row" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => setEditMode(true)} style={{
                background: '#1a1610', color: '#c49a3c', border: 'none',
                borderRadius: '6px', padding: '10px 24px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
              }}>
                Edit Profile
              </button>
            </div>
          )}

          {/* Current Status */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Current Status</div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                background: 'var(--color-brand-primary)',
                color: 'white', padding: '4px 10px', borderRadius: '12px',
                fontSize: '12px', fontWeight: '600'
              }}>
                {statusLabel(form.current_status)}
              </span>
            </div>
            {form.current_status && CURRENT_STATUS[form.current_status] && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                {CURRENT_STATUS[form.current_status].fields.map(f => (
                  <ViewField key={f.key} label={f.label} value={form[f.key]} />
                ))}
              </div>
            )}
          </div>

          {/* Personal & Family Status (includes Family Background) */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Personal & Family Status</div>
            <div className="rsp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
              <ViewField inline label="Marital Status" value={maritalLabel(form.marital_status)} />
              <ViewField inline label="Number of Children" value={form.number_of_children} />
              <ViewField inline label="Pregnant / Spouse Pregnant" value={form.is_pregnant ? 'Yes' : 'No'} />
              <ViewField inline label="Family Income (LKR/month)" value={form.family_income} />
              <ViewField inline label="No of Dependants" value={form.no_of_dependants} />
              {form.living_outside_ldc && (
                <>
                  <ViewField inline label="Living Outside LDC" value="Yes" />
                  <ViewField inline label="Purpose" value={form.outside_purpose} />
                  <ViewField inline label="Location" value={form.outside_location} />
                </>
              )}
            </div>
          </div>

          {/* Status History */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Status History</div>
            {history.length === 0 ? (
              <div style={{ color: '#a09080', fontSize: '13px' }}>
                No status history recorded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {(showAllHistory ? history : history.slice(0, 5)).map((h, i) => (
                  <div key={h.id} style={{
                    border: '1px solid #d4c9b0',
                    borderRadius: '8px',
                    padding: '16px',
                    background: i === 0 ? '#f5edd8' : '#fffef9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* Card Header: Status Tag & Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2px', paddingBottom: '10px', borderBottom: '1px solid #e8e0d0' }}>
                      <div>
                        <span style={{
                          background: '#dce9f5', color: '#1a4068',
                          padding: '4px 10px', borderRadius: '12px',
                          fontSize: '12px', fontWeight: '700',
                          display: 'inline-block'
                        }}>
                          {statusLabel(h.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#a09080', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Recorded on {new Date(h.recorded_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>

                    {/* Card Body: Dynamic Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                      {h.institution && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#a09080', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.4px', marginBottom: '2px' }}>
                            {CURRENT_STATUS[h.status]?.fields.find(f => f.key === 'current_institution' || f.key === 'current_exam_type')?.label || 'Institution / Employer'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#1a1610' }}>{h.institution}</div>
                        </div>
                      )}
                      {h.course && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#a09080', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.4px', marginBottom: '2px' }}>
                            {CURRENT_STATUS[h.status]?.fields.find(f => f.key === 'current_course')?.label || 'Course / Role'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#1a1610' }}>{h.course}</div>
                        </div>
                      )}
                      {h.year_level && (
                        <div>
                          <div style={{ fontSize: '10px', color: '#a09080', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.4px', marginBottom: '2px' }}>
                            {CURRENT_STATUS[h.status]?.fields.find(f => f.key === 'current_year')?.label || 'Year / Duration'}
                          </div>
                          <div style={{ fontSize: '13px', color: '#1a1610' }}>{h.year_level}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {history.length > 5 && (
                  <button 
                    onClick={() => setShowAllHistory(!showAllHistory)} 
                    style={{
                      background: 'transparent', color: '#1a4068', border: '1px solid #dce9f5',
                      borderRadius: '6px', padding: '10px', fontSize: '13px',
                      fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                      marginTop: '8px'
                    }}
                  >
                    {showAllHistory ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT MODE ─────────────────────────────────────────── */}
      {editMode && (
        <form onSubmit={handleSave}>

          {/* Current Status — Dynamic */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Current Status</div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle(false)} value={form.current_status}
                onChange={e => setForm({
                  ...form,
                  current_status: e.target.value,
                  current_institution: '',
                  current_course: '',
                  current_year: '',
                  current_exam_type: ''
                })}>
                <option value="">— Select Status —</option>
                {options.currentStatuses.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Dynamic fields */}
            {form.current_status && CURRENT_STATUS[form.current_status] && (
              <div className="rsp-grid-3" style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px',
                background: '#f5edd8', padding: '14px', borderRadius: '6px',
                border: '1px solid #e8d4a0'
              }}>
                {CURRENT_STATUS[form.current_status].fields.map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label} *</label>
                    {f.type === 'grade_select' ? (
                      <select style={inputStyle(false)}
                        value={form[f.key]}
                        required
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                        <option value="">— Select Grade —</option>
                        {schoolGrades.map(g => (
                          <option key={g.id} value={g.grade_label}>{g.grade_label}</option>
                        ))}
                      </select>
                    ) : f.type === 'select' ? (
                      <select style={inputStyle(false)}
                        value={form[f.key] || ''}
                        required
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                        <option value="">— Select {f.label} —</option>
                        {f.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input style={inputStyle(false)}
                        value={form[f.key]}
                        required
                        placeholder={f.placeholder || ''}
                        onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal & Family Status (includes Family Background fields) */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}>Personal & Family Status</div>
            <div className="rsp-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Marital Status</label>
                <select style={inputStyle(false)} value={form.marital_status}
                  onChange={e => setForm({ ...form, marital_status: e.target.value })}>
                  <option value="">— Select —</option>
                  {options.maritalStatuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Number of Children</label>
                <input style={inputStyle(false)} type="number" min="0"
                  value={form.number_of_children}
                  onChange={e => setForm({ ...form, number_of_children: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '20px' }}>
                <input type="checkbox" id="pregnant"
                  checked={form.is_pregnant}
                  onChange={e => setForm({ ...form, is_pregnant: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#c49a3c' }} />
                <label htmlFor="pregnant" style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Pregnant / Spouse Pregnant
                </label>
              </div>
              <div>
                <label style={labelStyle}>Family Monthly Income (LKR) *</label>
                <input style={inputStyle(false)} type="number"
                  value={form.family_income}
                  onChange={e => setForm({ ...form, family_income: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Number of Dependants *</label>
                <input style={inputStyle(false)} type="number" min="0"
                  value={form.no_of_dependants}
                  onChange={e => setForm({ ...form, no_of_dependants: e.target.value })} />
              </div>
              {/* Living Outside LDC */}
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px',
                  background: form.living_outside_ldc ? '#fdecd8' : '#faf8f3',
                  border: `1px solid ${form.living_outside_ldc ? '#c49a3c' : '#d4c9b0'}`,
                  borderRadius: '6px', marginBottom: form.living_outside_ldc ? '12px' : '0'
                }}>
                  <input type="checkbox" id="living_outside"
                    checked={form.living_outside_ldc}
                    onChange={e => setForm({
                      ...form,
                      living_outside_ldc: e.target.checked,
                      outside_purpose: '',
                      outside_location: ''
                    })}
                    style={{ width: '16px', height: '16px', accentColor: '#c49a3c' }} />
                  <label htmlFor="living_outside" style={{ fontSize: '13px', fontWeight: '400', cursor: 'pointer' }}>
                    Participant is currently living outside the LDC area
                  </label>
                </div>
                {form.living_outside_ldc && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={labelStyle}>Purpose *</label>
                      <select style={inputStyle(false)} value={form.outside_purpose}
                        onChange={e => setForm({ ...form, outside_purpose: e.target.value })}>
                        <option value="">— Select Purpose —</option>
                        {options.outsidePurposes.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Where *</label>
                      <input style={inputStyle(false)}
                        value={form.outside_location}
                        onChange={e => setForm({ ...form, outside_location: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save / Cancel Buttons */}
          <div className="rsp-submit-row" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} style={{
              background: saving ? '#a09080' : '#2d6a4f',
              color: '#fff', border: 'none', borderRadius: '6px',
              padding: '12px 32px', fontSize: '14px', fontWeight: '700',
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
            }}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button type="button" onClick={handleCancel} style={{
              background: 'transparent', color: '#6b5e4a',
              border: '1px solid #d4c9b0', borderRadius: '6px',
              padding: '12px 24px', fontSize: '14px',
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Cancel
            </button>
          </div>

        </form>
      )}

      {/* ── No Profile Yet ────────────────────────────────────── */}
      {!editMode && !profile && (
        <div style={{
          background: '#fffef9', border: '1px solid #d4c9b0',
          borderRadius: '8px', padding: '40px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
            No Profile Yet
          </div>
          <div style={{ color: '#6b5e4a', fontSize: '13px', marginBottom: '20px' }}>
            {readOnly
              ? 'No profile was recorded for this participant.'
              : 'Start by creating a profile for this participant.'}
          </div>
          {!readOnly && (
            <button onClick={() => setEditMode(true)} style={{
              background: '#1a1610', color: '#c49a3c', border: 'none',
              borderRadius: '6px', padding: '10px 24px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Create Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}