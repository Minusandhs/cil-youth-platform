import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../lib/api';

export default function ForgotPassword() {
  const [email,    setEmail   ] = useState('');
  const [message,  setMessage ] = useState('');
  const [error,    setError   ] = useState('');
  const [loading,  setLoading ] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
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
            CIL · TES
          </div>
          <h1 style={{
            fontSize:'24px',
            fontWeight:'700',
            color:'var(--color-text-heading)',
            letterSpacing:'-0.3px'
          }}>
            Recovery
          </h1>
          <p style={{
            color:'var(--color-text-subdued)',
            fontSize:'13px',
            marginTop:'6px'
          }}>
            Forgot your password? No problem.
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
            Forgot Password
          </h2>

          {/* Success Message */}
          {message && (
            <div style={{
              background:'var(--color-tint-success)',
              border:'1px solid var(--color-success)',
              borderRadius:'6px',
              padding:'10px 14px',
              color:'var(--color-success)',
              fontSize:'13px',
              marginBottom:'16px'
            }}>
              {message}
            </div>
          )}

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

          {!message ? (
            <form onSubmit={handleSubmit}>
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
                  Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
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
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div style={{textAlign:'center', marginTop:'8px'}}>
              <p style={{fontSize:'13px', color:'var(--color-text-subdued)', marginBottom:'16px'}}>
                Please check your inbox (and spam folder) for instructions.
              </p>
            </div>
          )}

          <div style={{marginTop:'24px', textAlign:'center', borderTop:'1px solid var(--color-divider)', paddingTop:'16px'}}>
             <Link to="/login" style={{
               fontSize:'13px',
               color:'var(--color-danger)',
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
