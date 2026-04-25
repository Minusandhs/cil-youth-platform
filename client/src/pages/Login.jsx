import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError   ] = useState('');
  const [loading,  setLoading ] = useState(false);

  const { login, user } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const intendedFrom = location.state?.from?.pathname + (location.state?.from?.search || '');
  const from = intendedFrom === '/' ? null : (location.state?.from ? intendedFrom : null);

  // ── Redirect if already logged in ──────────────────────────────
  useEffect(() => {
    if (user) {
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'super_admin' || user.role === 'national_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/ldc', { replace: true });
      }
    }
  }, [user, navigate, from]);

  // ── Check for external errors ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'ldc_deactivated') {
      setError('Your LDC has been deactivated. Please contact the administrator.');
    }
  }, [location.search]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'super_admin' || user.role === 'national_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/ldc', { replace: true });
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data.error || 'Access denied');
      } else {
        setError('Invalid username or password');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'var(--color-bg-page)',
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
            background:'var(--color-brand-primary)',
            color:'var(--color-brand-accent-lt)',
            fontWeight:'700',
            fontSize:'11px',
            letterSpacing:'3px',
            padding:'6px 14px',
            borderRadius:'3px',
            marginBottom:'16px'
          }}>
            CIL
          </div>
          <h1 style={{
            fontSize:'24px',
            fontWeight:'700',
            color:'var(--color-text-heading)',
            letterSpacing:'-0.3px'
          }}>
            Youth Development Platform
          </h1>
          <p style={{
            color:'var(--color-text-subdued)',
            fontSize:'13px',
            marginTop:'6px'
          }}>
            Compassion International Lanka
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:'var(--color-bg-card)',
          border:'1px solid var(--color-border-subtle)',
          borderRadius:'12px',
          padding:'32px',
          boxShadow:'0 4px 24px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize:'17px',
            fontWeight:'700',
            marginBottom:'20px',
            color:'var(--color-text-heading)'
          }}>
            Sign In
          </h2>

          {/* Error Message */}
          {error && (
            <div style={{
              background:'var(--color-tint-danger)',
              border:'1px solid var(--color-danger)',
              borderRadius:'6px',
              padding:'10px 14px',
              color:'var(--color-danger)',
              fontSize:'13px',
              marginBottom:'16px'
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div style={{marginBottom:'16px'}}>
              <label style={{
                display:'block',
                fontSize:'11px',
                fontWeight:'700',
                color:'var(--color-text-heading)',
                letterSpacing:'0.3px',
                textTransform:'uppercase',
                marginBottom:'6px'
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{
                  width:'100%',
                  padding:'10px 12px',
                  border:'1px solid var(--color-border-subtle)',
                  borderRadius:'6px',
                  fontSize:'14px',
                  color:'var(--color-text-heading)',
                  background:'var(--color-bg-page)',
                  outline:'none',
                  fontFamily:'inherit'
                }}
              />
            </div>

            {/* Password */}
            <div style={{marginBottom:'24px'}}>
              <label style={{
                display:'block',
                fontSize:'11px',
                fontWeight:'700',
                color:'var(--color-text-heading)',
                letterSpacing:'0.3px',
                textTransform:'uppercase',
                marginBottom:'6px'
              }}>
                Password
              </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width:'100%',
                    padding:'10px 12px',
                    border:'1px solid var(--color-border-subtle)',
                    borderRadius:'6px',
                    fontSize:'14px',
                    color:'var(--color-text-heading)',
                    background:'var(--color-bg-page)',
                    outline:'none',
                    fontFamily:'inherit'
                  }}
                />
                <div style={{textAlign:'right', marginTop:'8px'}}>
                  <Link to="/forgot-password" style={{
                    fontSize:'12px',
                    color:'var(--color-danger)',
                    textDecoration:'none',
                    fontWeight:'600'
                  }}>
                    Forgot Password?
                  </Link>
                </div>
              </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width:'100%',
                padding:'12px',
                background: loading ? 'var(--color-border-subtle)' : 'var(--color-brand-primary)',
                color:'var(--color-brand-accent-lt)',
                border:'none',
                borderRadius:'6px',
                fontSize:'14px',
                fontWeight:'700',
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing:'0.3px',
                fontFamily:'inherit'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign:'center',
          color:'var(--color-text-muted)',
          fontSize:'11px',
          marginTop:'20px'
        }}>
          Compassion International Lanka · Youth Development Programme
        </p>

      </div>
    </div>
  );
}
