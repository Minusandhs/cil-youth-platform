import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [ldcs, setLdcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    username:'', password:'', full_name:'', role:'ldc_staff', ldc_id:''
  });

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

  async function handleCreate(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/api/auth/users', form);
      setSuccess('User created successfully');
      setShowForm(false);
      setForm({ username:'', password:'', full_name:'', role:'ldc_staff', ldc_id:'' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    }
  }

  async function toggleActive(user) {
    try {
      await api.put(`/api/auth/users/${user.id}`, {
        full_name: user.full_name,
        is_active: !user.is_active,
        ldc_id: user.ldc_id
      });
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
        <button onClick={() => setShowForm(!showForm)} style={{
          background:'#1a1610', color:'#c49a3c', border:'none',
          borderRadius:'6px', padding:'10px 18px', fontSize:'13px',
          fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
        }}>
          {showForm ? '✕ Cancel' : '+ New User'}
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

      {showForm && (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <h3 style={{fontSize:'14px', fontWeight:'700', marginBottom:'16px'}}>
            Create New User
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px'
            }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} value={form.full_name}
                  onChange={e => setForm({...form, full_name:e.target.value})}
                  placeholder="e.g. Kasun Perera" required />
              </div>
              <div>
                <label style={labelStyle}>Username</label>
                <input style={inputStyle} value={form.username}
                  onChange={e => setForm({...form, username:e.target.value})}
                  placeholder="e.g. lk0401staff" required />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input style={inputStyle} type="password" value={form.password}
                  onChange={e => setForm({...form, password:e.target.value})}
                  placeholder="Min 6 characters" required />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select style={inputStyle} value={form.role}
                  onChange={e => setForm({...form, role:e.target.value})}>
                  <option value="ldc_staff">LDC Staff</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {form.role === 'ldc_staff' && (
                <div style={{gridColumn:'1/-1'}}>
                  <label style={labelStyle}>Assign LDC</label>
                  <select style={inputStyle} value={form.ldc_id}
                    onChange={e => setForm({...form, ldc_id:e.target.value})} required>
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
            <button type="submit" style={{
              marginTop:'16px', background:'#2d6a4f', color:'#fff',
              border:'none', borderRadius:'6px', padding:'10px 24px',
              fontSize:'13px', fontWeight:'700', cursor:'pointer',
              fontFamily:'inherit'
            }}>
              Create User
            </button>
          </form>
        </div>
      )}

      <div style={{
        background:'#fffef9', border:'1px solid #d4c9b0',
        borderRadius:'8px', overflow:'hidden'
      }}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#f0ece2'}}>
              {['Full Name','Username','Role','LDC','Status','Last Login','Action'].map(h => (
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
              <tr key={u.id} style={{borderBottom:'1px solid #e8e0d0'}}>
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
                  {u.role !== 'super_admin' && (
                    <button onClick={() => toggleActive(u)} style={{
                      background:'transparent', border:'1px solid #d4c9b0',
                      borderRadius:'4px', padding:'4px 10px',
                      fontSize:'11px', cursor:'pointer', fontFamily:'inherit',
                      color: u.is_active ? '#9b2335' : '#2d6a4f'
                    }}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
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