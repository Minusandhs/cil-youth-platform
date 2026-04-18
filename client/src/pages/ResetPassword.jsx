import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../lib/api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token,    setToken   ] = useState('');
  const [error,    setError   ] = useState('');
  const [success,  setSuccess ] = useState(false);
  const [loading,  setLoading ] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setError('Invalid or missing reset token.');
    } else {
      setToken(tokenParam);
    }
  }, [location.search]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', { token, new_password: password });
      setSuccess(true);
      // Auto-redirect after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'#faf8f3',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:'24px'
    }}>
      <div style={{width:'100%', maxWidth:'420px'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div style={{
            display:'inline-block',
            background:'#1a1610',
            color:'#c49a3c',
            fontWeight:'700',
            fontSize:'11px',
            letterSpacing:'3px',
            padding:'6px 14px',
            borderRadius:'3px',
            marginBottom:'16px'
          }}>
            CIL · TES
          </div>
          <h1 style={{
            fontSize:'24px',
            fontWeight:'700',
            color:'#1a1610',
            letterSpacing:'-0.3px'
          }}>
            Set New Password
          </h1>
          <p style={{
            color:'#6b5e4a',
            fontSize:'13px',
            marginTop:'6px'
          }}>
            Choose a strong, secure password.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:'#fffef9',
          border:'1px solid #d4c9b0',
          borderRadius:'12px',
          padding:'32px',
          boxShadow:'0 4px 24px rgba(26,22,16,0.08)'
        }}>
          <h2 style={{
            fontSize:'17px',
            fontWeight:'700',
            marginBottom:'20px',
            color:'#1a1610'
          }}>
            Reset Password
          </h2>

          {/* Success Message */}
          {success && (
            <div style={{
              background:'#e0f5e8',
              border:'1px solid #239b56',
              borderRadius:'6px',
              padding:'10px 14px',
              color:'#239b56',
              fontSize:'13px',
              marginBottom:'16px',
              textAlign:'center'
            }}>
              Password reset successfully!<br/>
              Redirecting to login in 3 seconds...
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background:'#f5e0e3',
              border:'1px solid #9b2335',
              borderRadius:'6px',
              padding:'10px 14px',
              color:'#9b2335',
              fontSize:'13px',
              marginBottom:'16px'
            }}>
              {error}
            </div>
          )}

          {!success && token && (
            <form onSubmit={handleSubmit}>
              <div style={{marginBottom:'16px'}}>
                <label style={{
                  display:'block',
                  fontSize:'11px',
                  fontWeight:'700',
                  color:'#3d3528',
                  letterSpacing:'0.3px',
                  textTransform:'uppercase',
                  marginBottom:'6px'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width:'100%',
                    padding:'10px 12px',
                    border:'1px solid #d4c9b0',
                    borderRadius:'6px',
                    fontSize:'14px',
                    color:'#1a1610',
                    background:'#faf8f3',
                    outline:'none',
                    fontFamily:'inherit'
                  }}
                />
              </div>

              <div style={{marginBottom:'24px'}}>
                <label style={{
                  display:'block',
                  fontSize:'11px',
                  fontWeight:'700',
                  color:'#3d3528',
                  letterSpacing:'0.3px',
                  textTransform:'uppercase',
                  marginBottom:'6px'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width:'100%',
                    padding:'10px 12px',
                    border:'1px solid #d4c9b0',
                    borderRadius:'6px',
                    fontSize:'14px',
                    color:'#1a1610',
                    background:'#faf8f3',
                    outline:'none',
                    fontFamily:'inherit'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width:'100%',
                  padding:'12px',
                  background: loading ? '#a09080' : '#1a1610',
                  color:'#c49a3c',
                  border:'none',
                  borderRadius:'6px',
                  fontSize:'14px',
                  fontWeight:'700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing:'0.3px',
                  fontFamily:'inherit'
                }}
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}

          {!success && !token && !error && (
            <div style={{textAlign:'center', marginTop:'8px'}}>
              <p style={{fontSize:'13px', color:'#6b5e4a'}}>
                Loading security token...
              </p>
            </div>
          )}

          <div style={{marginTop:'24px', textAlign:'center', borderTop:'1px solid #eee', paddingTop:'16px'}}>
             <Link to="/login" style={{
               fontSize:'13px',
               color:'#9b2335',
               textDecoration:'none',
               fontWeight:'600'
             }}>
               Back to Login
             </Link>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign:'center',
          color:'#a09080',
          fontSize:'11px',
          marginTop:'20px'
        }}>
          Compassion International Lanka · Youth Development Programme
        </p>

      </div>
    </div>
  );
}
