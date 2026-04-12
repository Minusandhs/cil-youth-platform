import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError   ] = useState('');
  const [loading,  setLoading ] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/ldc');
      }
    } catch (err) {
      setError('Invalid username or password');
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
            Youth Development Platform
          </h1>
          <p style={{
            color:'#6b5e4a',
            fontSize:'13px',
            marginTop:'6px'
          }}>
            Compassion International Lanka
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
            Sign In
          </h2>

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

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
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
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your username"
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

            {/* Password */}
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
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
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

            {/* Submit Button */}
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

          </form>
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
