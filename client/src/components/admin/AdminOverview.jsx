import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0, ldcs: 0, participants: 0, tes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get('/api/auth/stats');
        setStats(res.data);
      } catch {
        // Stats not available yet
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Total Users',    value: stats.users,        color: '#c49a3c' },
    { label: 'LDC Centres',    value: stats.ldcs,         color: '#2d6a4f' },
    { label: 'Participants',   value: stats.participants,  color: '#1a4068' },
    { label: 'TES Applications', value: stats.tes,        color: '#9b2335' },
  ];

  return (
    <div>
      <h2 style={{fontSize:'20px', fontWeight:'700', marginBottom:'6px'}}>
        Dashboard Overview
      </h2>
      <p style={{color:'#6b5e4a', fontSize:'13px', marginBottom:'24px'}}>
        Welcome back. Here is a summary of the platform.
      </p>

      {/* Stats Grid */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',
        gap:'16px',
        marginBottom:'32px'
      }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background:'#fffef9',
            border:'1px solid #d4c9b0',
            borderRadius:'8px',
            padding:'20px',
            boxShadow:'0 2px 8px rgba(26,22,16,0.06)'
          }}>
            <div style={{
              fontSize:'32px',
              fontWeight:'700',
              color: card.color,
              lineHeight:1
            }}>
              {loading ? '...' : card.value}
            </div>
            <div style={{
              fontSize:'12px',
              color:'#6b5e4a',
              marginTop:'6px',
              fontWeight:'600',
              textTransform:'uppercase',
              letterSpacing:'0.4px'
            }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        background:'#fffef9',
        border:'1px solid #d4c9b0',
        borderRadius:'8px',
        padding:'20px'
      }}>
        <h3 style={{
          fontSize:'14px',
          fontWeight:'700',
          marginBottom:'14px'
        }}>
          Quick Actions
        </h3>
        <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
          {[
            { label:'+ Add LDC User',       color:'#1a1610', text:'#c49a3c' },
            { label:'+ Add LDC Centre',     color:'#2d6a4f', text:'#fff'    },
            { label:'↑ Upload Participants', color:'#1a4068', text:'#fff'   },
          ].map(btn => (
            <button key={btn.label} style={{
              background: btn.color,
              color: btn.text,
              border:'none',
              borderRadius:'6px',
              padding:'10px 18px',
              fontSize:'13px',
              fontWeight:'600',
              cursor:'pointer',
              fontFamily:'inherit'
            }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
