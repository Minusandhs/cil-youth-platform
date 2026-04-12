import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function UserManagement() {
  const [users,    setUsers   ] = useState([]);
  const [ldcs,     setLdcs    ] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showPwForm, setShowPwForm] = useState(null);
  const [error,    setError   ] = useState('');
  const [success,  setSuccess ] = useState('');
  const [form, setForm] = useState({
    username:'', password:'', full_name:'', role:'ldc_staff', ldc_id:''
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
    setForm({ username:'', password:'', full_name:'', role:'ldc_staff', ldc_id:'' });
    setShowForm(true);
    setError(''); setSuccess('');
  }

  function openEdit(user) {
    setEditUser(user);
    setForm({
      username : user.username,
      full_name: user.full_name,
      role     : user.role,
      ldc_id   : user.ldc_id || '',
      password : ''
    });
    setShowForm(true);
    setError(''); setSuccess('');
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
          is_active: editUser.is_active,
          ldc_id   : form.ldc_id || null
        });
        setSuccess('User updated successfully');
      } else {
        await api.post('/api/auth/users', form);
        setSuccess('User created successfully');
      }
      setShowForm(false);
      setEditUser(null);
      setForm({ username:'', password:'', full_name:'', role:'ldc_staff', ldc_id:'' });
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
        ldc_id   : user.ldc_id
      });
      setSuccess(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`);
      loadData();
    } catch {
      setError('Failed to update user');
    }
  }

  const labelStyle = {
    display:'block', fontSize:'11px', fontWeight:'700',
    color:'#3d3528', letterSpacing:'0.3px',
    textTransform:'uppercase', marginBottom:'5px'
  };

  const inputStyle = {
    width:'100%', padding:'9px 11px',
    border:'1px solid #d4c9b0', borderRadius:'5px',
    fontSize:'13px', color:'#1a1610',
    background:'#faf8f3', outline:'none', fontFamily:'inherit'
  };

  if (loading) return (
    <div style={{padding:'32px', color:'#6b5e4a'}}>Loading...</div>
  );

  return (
    <div>
      <div style={{
        display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'20px'
      }}>
        <div>
          <h2 style={{fontSize:'20px', fontWeight:'700'}}>User Management</h2>
          <p style={{color:'#6b5e4a', fontSize:'13px', marginTop:'2px'}}>
            Create and manage LDC staff accounts
          </p>
        </div>
        <button onClick={openCreate} style={{
          background:'#1a1610', color:'#c49a3c', border:'none',
          borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
          fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
        }}>
          + New User
        </button>
      </div>

      {error && (
        <div style={{
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          color:'#9b2335', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background:'#d8ede4', border:'1px solid #2d6a4f',
          borderRadius:'6px', padding:'10px 14px',
          color:'#2d6a4f', fontSize:'13px', marginBottom:'16px'
        }}>{success}</div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            {editUser ? `Edit User — ${editUser.username}` : 'Create New User'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'}}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} value={form.full_name}
                  onChange={e => setForm({...form, full_name:e.target.value})}
                  placeholder="e.g. Kasun Perera" required />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={{
                  ...inputStyle,
                  background: editUser ? '#f0ece2' : '#faf8f3',
                  color: editUser ? '#a09080' : '#1a1610'
                }}
                value={form.username}
                onChange={e => setForm({...form, username:e.target.value})}
                placeholder="e.g. lk0101staff"
                readOnly={!!editUser}
                required />
                {editUser && (
                  <div style={{fontSize:'11px', color:'#a09080', marginTop:'3px'}}>
                    Username cannot be changed
                  </div>
                )}
              </div>
              {!editUser && (
                <div>
                  <label style={labelStyle}>Password</label>
                  <input style={inputStyle} type="password" value={form.password}
                    onChange={e => setForm({...form, password:e.target.value})}
                    placeholder="Min 6 characters" required />
                </div>
              )}
              <div>
                <label style={labelStyle}>Role</label>
                <select style={inputStyle} value={form.role}
                  onChange={e => setForm({...form, role:e.target.value})}
                  disabled={!!editUser}>
                  <option value="ldc_staff">LDC Staff</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {form.role === 'ldc_staff' && (
                <div style={{gridColumn:'1/-1'}}>
                  <label style={labelStyle}>Assign LDC</label>
                  <select style={inputStyle} value={form.ldc_id}
                    onChange={e => setForm({...form, ldc_id:e.target.value})}
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
            <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
              <button type="submit" style={{
                background:'#2d6a4f', color:'#fff', border:'none',
                borderRadius:'6px', padding:'10px 24px', fontSize:'13px',
                fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
              }}>
                {editUser ? 'Save Changes' : 'Create User'}
              </button>
              <button type="button" onClick={cancelForm} style={{
                background:'transparent', color:'#6b5e4a',
                border:'1px solid #d4c9b0', borderRadius:'6px',
                padding:'10px 24px', fontSize:'13px',
                cursor:'pointer', fontFamily:'inherit'
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
          background:'#fffef9', border:'1px solid #c49a3c',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'4px'}}>
            Reset Password — {showPwForm.full_name}
          </h3>
          <p style={{fontSize:'12px', color:'#6b5e4a', marginBottom:'14px'}}>
            Enter a new password for this user.
          </p>
          <div style={{display:'flex', gap:'10px', alignItems:'flex-end'}}>
            <div style={{flex:1}}>
              <label style={labelStyle}>New Password</label>
              <input style={inputStyle} type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min 6 characters" />
            </div>
            <button onClick={() => handleResetPassword(showPwForm.id)} style={{
              background:'#c49a3c', color:'#1a1610', border:'none',
              borderRadius:'6px', padding:'10px 20px', fontSize:'13px',
              fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
              whiteSpace:'nowrap'
            }}>
              Reset Password
            </button>
            <button onClick={cancelForm} style={{
              background:'transparent', color:'#6b5e4a',
              border:'1px solid #d4c9b0', borderRadius:'6px',
              padding:'10px 16px', fontSize:'13px',
              cursor:'pointer', fontFamily:'inherit'
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{
        background:'#fffef9', border:'1px solid #d4c9b0',
        borderRadius:'8px', overflow:'hidden'
      }}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#f0ece2'}}>
              {['Full Name','Username','Role','LDC','Status','Last Login','Actions'].map(h => (
                <th key={h} style={{
                  padding:'10px 14px', textAlign:'left',
                  fontSize:'10.5px', fontWeight:'700',
                  textTransform:'uppercase', letterSpacing:'0.4px',
                  color:'#3d3528', borderBottom:'1px solid #d4c9b0'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{
                borderBottom:'1px solid #e8e0d0',
                opacity: u.is_active ? 1 : 0.6
              }}>
                <td style={{padding:'10px 14px', fontWeight:'600'}}>{u.full_name}</td>
                <td style={{padding:'10px 14px', color:'#6b5e4a'}}>{u.username}</td>
                <td style={{padding:'10px 14px'}}>
                  <span style={{
                    background: u.role === 'super_admin' ? '#1a1610' : '#dce9f5',
                    color: u.role === 'super_admin' ? '#c49a3c' : '#1a4068',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {u.role === 'super_admin' ? 'Super Admin' : 'LDC Staff'}
                  </span>
                </td>
                <td style={{padding:'10px 14px', color:'#6b5e4a'}}>
                  {u.ldc_code || '—'}
                </td>
                <td style={{padding:'10px 14px'}}>
                  <span style={{
                    background: u.is_active ? '#d8ede4' : '#f5e0e3',
                    color: u.is_active ? '#2d6a4f' : '#9b2335',
                    padding:'2px 8px', borderRadius:'10px',
                    fontSize:'10px', fontWeight:'700'
                  }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{padding:'10px 14px', color:'#6b5e4a', fontSize:'12px'}}>
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td style={{padding:'10px 14px'}}>
                  <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                    {/* Edit */}
                    <button onClick={() => openEdit(u)} style={{
                      background:'#dce9f5', color:'#1a4068', border:'none',
                      borderRadius:'4px', padding:'4px 10px', fontSize:'11px',
                      fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                    }}>Edit</button>
                    {/* Reset Password */}
                    {u.role !== 'super_admin' && (
                      <button onClick={() => { setShowPwForm(u); setShowForm(false); }} style={{
                        background:'#f5edd8', color:'#b85c00', border:'none',
                        borderRadius:'4px', padding:'4px 10px', fontSize:'11px',
                        fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                      }}>Reset PW</button>
                    )}
                    {/* Activate / Deactivate */}
                    {u.role !== 'super_admin' && (
                      <button onClick={() => toggleActive(u)} style={{
                        background: u.is_active ? '#f5e0e3' : '#d8ede4',
                        color: u.is_active ? '#9b2335' : '#2d6a4f',
                        border:'none', borderRadius:'4px', padding:'4px 10px',
                        fontSize:'11px', fontWeight:'600',
                        cursor:'pointer', fontFamily:'inherit'
                      }}>
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{padding:'32px', textAlign:'center', color:'#6b5e4a'}}>
            No users found. Create your first LDC staff account.
          </div>
        )}
      </div>
    </div>
  );
}