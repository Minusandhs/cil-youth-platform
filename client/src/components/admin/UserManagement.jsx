import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagement({ readOnly = false }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [ldcs, setLdcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showPwForm, setShowPwForm] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    username: '', password: '', full_name: '', email: '', role: 'ldc_staff', ldc_id: ''
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [usersRes, ldcsRes] = await Promise.all([
        api.get('/api/auth/users'),
        api.get('/api/ldcs')
      ]);
      setUsers(usersRes.data);
      setLdcs(ldcsRes.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditUser(null);
    setForm({ username: '', password: '', full_name: '', email: '', role: 'ldc_staff', ldc_id: '' });
    setShowForm(true);
    setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openEdit(user) {
    setEditUser(user);
    setForm({
      username: user.username,
      full_name: user.full_name,
      email: user.email || '',
      role: user.role,
      ldc_id: user.ldc_id || '',
      password: ''
    });
    setShowForm(true);
    setShowPwForm(null);
    setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelForm() {
    setShowForm(false);
    setEditUser(null);
    setShowPwForm(null);
    setNewPassword('');
    setError(''); setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editUser) {
        await api.put(`/api/auth/users/${editUser.id}`, {
          full_name: form.full_name,
          email: form.email,
          is_active: editUser.is_active,
          ldc_id: form.ldc_id || null
        });
        setSuccess('User updated successfully');
      } else {
        await api.post('/api/auth/users', form);
        setSuccess('User created successfully');
      }
      setShowForm(false);
      setEditUser(null);
      setForm({ username: '', password: '', full_name: '', email: '', role: 'ldc_staff', ldc_id: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    }
  }

  async function handleResetPassword(userId) {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put(`/api/auth/users/${userId}/password`, {
        password: newPassword
      });
      setSuccess('Password reset successfully');
      setShowPwForm(null);
      setNewPassword('');
    } catch {
      setError('Failed to reset password');
    }
  }

  async function toggleActive(user) {
    try {
      await api.put(`/api/auth/users/${user.id}`, {
        full_name: user.full_name,
        is_active: !user.is_active,
        ldc_id: user.ldc_id
      });
      setSuccess(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`);
      loadData();
    } catch {
      setError('Failed to update user');
    }
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user "${user.full_name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/api/auth/users/${user.id}`);
      setSuccess('User deleted successfully');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  }



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

  if (loading) return (
    <div style={{ padding: '32px', color: 'var(--color-text-subdued)' }}>Loading...</div>
  );

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.ldc_code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-8">
        <div>
          <h2 style={{ color: 'var(--color-text-heading)', fontSize: '20px', fontWeight: '700' }}>User Management</h2>
          <p style={{ color: 'var(--color-text-subdued)', fontSize: '13px', marginTop: '2px' }}>
            Create and manage LDC staff accounts
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2.5 w-full md:w-auto">

            <button onClick={openCreate} className="w-full md:w-auto" style={{
              background: 'var(--color-brand-primary)', color: 'var(--color-brand-accent)', border: 'none',
              borderRadius: '6px', padding: '10px 18px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
            }}>
              + New User
            </button>
          </div>
        )}
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

      {/* Create / Edit Form */}
      {showForm && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-border-subtle)',
          borderRadius: '8px', padding: '20px', marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>
            {editUser ? `Edit User — ${editUser.username}` : 'Create New User'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Email Address</label>
                <input style={inputStyle} type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={{
                  ...inputStyle,
                  background: editUser ? 'var(--color-bg-stripe)' : 'var(--color-bg-page)',
                  color: editUser ? 'var(--color-text-subdued)' : 'var(--color-text-heading)'
                }}
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  readOnly={!!editUser}
                  required />
                {editUser && (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-subdued)', marginTop: '3px' }}>
                    Username cannot be changed
                  </div>
                )}
              </div>
              {!editUser && (
                <div>
                  <label style={labelStyle}>Password</label>
                  <input style={inputStyle} type="password" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required />
                </div>
              )}
              <div>
                <label style={labelStyle}>Role</label>
                <select style={inputStyle} value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  disabled={!!editUser}>
                  <option value="ldc_staff">LDC Staff</option>
                  <option value="national_admin">National Admin (Read Only)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {form.role === 'ldc_staff' && (
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={labelStyle}>Assign LDC</label>
                  <select style={inputStyle} value={form.ldc_id}
                    onChange={e => setForm({ ...form, ldc_id: e.target.value })}
                    required>
                    <option value="">— Select LDC —</option>
                    {ldcs.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.ldc_id} — {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-2.5 mt-4">
              <button type="submit" className="w-full md:w-auto" style={{
                background: 'var(--color-success)', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '10px 24px', fontSize: '13px',
                fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
              }}>
                {editUser ? 'Save Changes' : 'Create User'}
              </button>
              <button type="button" onClick={cancelForm} className="w-full md:w-auto" style={{
                background: 'transparent', color: 'var(--color-text-subdued)',
                border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
                padding: '10px 24px', fontSize: '13px',
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Form */}
      {showPwForm && (
        <div style={{
          background: 'var(--color-bg-card)', border: '1px solid var(--color-brand-accent)',
          borderRadius: '8px', padding: '20px', marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>
            Reset Password — {showPwForm.full_name}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-subdued)', marginBottom: '14px' }}>
            Enter a new password for this user.
          </p>
          <div>
            <label style={labelStyle}>New Password</label>
            <input style={{ ...inputStyle, marginBottom: '12px' }} type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-2.5">
            <button onClick={() => handleResetPassword(showPwForm.id)} className="w-full md:w-auto" style={{
              background: 'var(--color-brand-accent)', color: 'var(--color-text-heading)', border: 'none',
              borderRadius: '6px', padding: '10px 20px', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap'
            }}>
              Reset Password
            </button>
            <button onClick={cancelForm} className="w-full md:w-auto" style={{
              background: 'transparent', color: 'var(--color-text-subdued)',
              border: '1px solid var(--color-border-subtle)', borderRadius: '6px',
              padding: '10px 16px', fontSize: '13px',
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '16px' }}>
        <input 
          type="text"
          placeholder="Search users by name, email, username, or LDC code..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, width: '100%', maxWidth: '400px' }}
        />
      </div>

      {/* Users Table */}
      <div className="rsp-card-wrap">
        <div className="rsp-table-wrap">
          <table className="rsp-card-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-stripe)' }}>
                {['Full Name', 'Email', 'Username', 'Role', 'LDC', 'Status', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left',
                    fontSize: '10px', fontWeight: '700',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: 'var(--color-text-heading)', borderBottom: '1px solid var(--color-border-subtle)',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{
                  borderBottom: '1px solid var(--color-divider)',
                  background: u.is_active ? 'transparent' : 'rgba(155,35,53,0.02)',
                  transition: 'background 0.2s'
                }}>
                  <td data-label="Name" style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--color-text-heading)' }}>{u.full_name}</td>
                  <td data-label="Email" style={{ padding: '12px 14px', color: 'var(--color-text-subdued)', fontSize: '12px' }}>{u.email || '—'}</td>
                  <td data-label="Username" style={{ padding: '12px 14px', color: 'var(--color-text-subdued)' }}>{u.username}</td>
                  <td data-label="Role" style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: u.role === 'super_admin' ? 'var(--color-brand-primary)'
                        : u.role === 'national_admin' ? 'var(--color-special)' : 'var(--color-tint-info)',
                      color: u.role === 'super_admin' ? 'var(--color-brand-accent)'
                        : u.role === 'national_admin' ? '#fff' : 'var(--color-info)',
                      padding: '2px 8px', borderRadius: '10px',
                      fontSize: '10px', fontWeight: '700', textTransform: 'uppercase'
                    }}>
                      {u.role === 'super_admin' ? 'Super Admin'
                        : u.role === 'national_admin' ? 'National' : 'LDC Staff'}
                    </span>
                  </td>
                  <td data-label="LDC" style={{ padding: '12px 14px', color: 'var(--color-text-heading)', fontWeight: '500' }}>
                    {u.ldc_code || '—'}
                  </td>
                  <td data-label="Status" style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: u.is_active ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
                      color: u.is_active ? 'var(--color-success)' : 'var(--color-danger)',
                      padding: '2px 8px', borderRadius: '10px',
                      fontSize: '10px', fontWeight: '700'
                    }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td data-label="Last Login" style={{ padding: '12px 14px', color: 'var(--color-text-subdued)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td data-label="Actions" style={{ padding: '12px 14px' }}>
                    {!readOnly && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                        <button onClick={() => openEdit(u)} style={{
                          background: 'var(--color-tint-info)', color: 'var(--color-info)', border: 'none',
                          borderRadius: '4px', padding: '4px 10px', fontSize: '11px',
                          fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                        }}>Edit</button>

                        <button onClick={() => { setShowPwForm(u); setShowForm(false); setError(''); setSuccess(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          style={{
                            background: 'var(--color-tint-warning)', color: 'var(--color-warning)', border: 'none',
                            borderRadius: '4px', padding: '4px 10px', fontSize: '11px',
                            fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit'
                          }}>Reset PW</button>

                        {u.id !== currentUser?.id && (
                          <button onClick={() => toggleActive(u)}
                            style={{
                              background: u.is_active ? 'var(--color-tint-danger)' : 'var(--color-tint-success)',
                              color: u.is_active ? 'var(--color-danger)' : 'var(--color-success)',
                              border: 'none', borderRadius: '4px', padding: '4px 10px',
                              fontSize: '11px', fontWeight: '700',
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}>
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}

                        {u.id !== currentUser?.id && (
                          <button onClick={() => handleDeleteUser(u)}
                            style={{
                              background: 'rgba(155,35,53,0.1)', color: 'var(--color-danger)',
                              border: 'none', borderRadius: '4px', padding: '4px 10px',
                              fontSize: '11px', fontWeight: '700',
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}>
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-subdued)' }}>
            {searchQuery ? `No users match "${searchQuery}"` : 'No users found. Create your first LDC staff account.'}
          </div>
        )}
      </div>
    </div>
  );
}