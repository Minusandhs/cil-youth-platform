import { useState } from 'react';
import api from '../../lib/api';

export default function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm_password) {
      return setError('New passwords do not match');
    }
    if (form.new_password.length < 6) {
      return setError('New password must be at least 6 characters');
    }
    setSaving(true);
    try {
      await api.put('/auth/me/password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
    }}>
      <div style={{
        background:'#fff', borderRadius:'10px', padding:'32px',
        width:'100%', maxWidth:'400px', boxShadow:'0 8px 32px rgba(0,0,0,0.18)'
      }}>
        <h3 style={{margin:'0 0 20px', fontSize:'16px', fontWeight:'700', color:'#1a1610'}}>
          Change Password
        </h3>

        {success ? (
          <div style={{color:'#2e7d32', background:'#e8f5e9', padding:'12px', borderRadius:'6px', textAlign:'center'}}>
            Password updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {['current_password','new_password','confirm_password'].map((field, i) => (
              <div key={field} style={{marginBottom:'14px'}}>
                <label style={{display:'block', fontSize:'12px', fontWeight:'600', color:'#5a4a3a', marginBottom:'5px'}}>
                  {field === 'current_password' ? 'Current Password' :
                   field === 'new_password'     ? 'New Password' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={form[field]}
                  onChange={e => setForm(f => ({...f, [field]: e.target.value}))}
                  required
                  style={{
                    width:'100%', padding:'8px 12px', fontSize:'13px',
                    border:'1px solid #d4c4a0', borderRadius:'6px',
                    fontFamily:'inherit', boxSizing:'border-box'
                  }}
                />
              </div>
            ))}

            {error && (
              <div style={{color:'#c62828', background:'#ffebee', padding:'10px', borderRadius:'6px', fontSize:'12px', marginBottom:'14px'}}>
                {error}
              </div>
            )}

            <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'20px'}}>
              <button type="button" onClick={onClose} style={{
                background:'transparent', border:'1px solid #d4c4a0',
                color:'#5a4a3a', padding:'8px 18px', borderRadius:'6px',
                fontSize:'13px', cursor:'pointer', fontFamily:'inherit'
              }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                background:'#c49a3c', border:'none', color:'#1a1610',
                padding:'8px 18px', borderRadius:'6px',
                fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
              }}>{saving ? 'Saving...' : 'Update Password'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
