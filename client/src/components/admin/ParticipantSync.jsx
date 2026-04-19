import { useState } from 'react';
import api from '../../lib/api';

export default function ParticipantSync({ readOnly = false }) {
  const [file,      setFile     ] = useState(null);
  const [preview,   setPreview  ] = useState([]);
  const [stats,     setStats    ] = useState(null);
  const [batchLabel, setBatchLabel] = useState('');
  const [loading,   setLoading  ] = useState(false);
  const [result,    setResult   ] = useState(null);
  const [error,     setError    ] = useState('');

  function parseDate(d) {
    if (!d) return null;
    const p = String(d).trim().split('/');
    if (p.length === 3) {
      return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
    }
    return d;
  }

  function handleFile(selectedFile) {
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const headers = lines[0].split(',').map(h =>
          h.trim().replace(/^"|"$/g, '')
        );

        const rows = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj  = {};
          headers.forEach((h, i) => obj[h] = vals[i] || '');
          return obj;
        }).filter(r => r['Local Participant ID']);

        const mapped = rows.map(r => ({
          participant_id    : r['Local Participant ID'],
          ldc_id            : r['Participant LDC ID'],
          full_name         : r['Account Name'],
          date_of_birth     : parseDate(r['Person Account: Birthdate']),
          gender            : r['Gender'],
          planned_completion: parseDate(r['Planned Completion Date'])
        }));

        // Stats
        const ldcs   = [...new Set(mapped.map(r => r.ldc_id))];
        const female = mapped.filter(r => r.gender === 'Female').length;
        setStats({
          total : mapped.length,
          ldcs  : ldcs.length,
          female,
          male  : mapped.length - female
        });
        setPreview(mapped.slice(0, 5));

        // Auto set batch label
        const today = new Date().toLocaleDateString('en-GB', {
          month:'short', year:'numeric'
        });
        setBatchLabel(`Sync ${today}`);

      } catch (err) {
        setError('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsText(selectedFile);
  }

  async function handleSync() {
    if (!file || !preview.length) return;
    setLoading(true);
    setError('');

    try {
      // Re-parse full file
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const headers = lines[0].split(',').map(h =>
        h.trim().replace(/^"|"$/g, '')
      );
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const obj  = {};
        headers.forEach((h, i) => obj[h] = vals[i] || '');
        return obj;
      }).filter(r => r['Local Participant ID']);

      const participants = rows.map(r => ({
        participant_id    : r['Local Participant ID'],
        ldc_id            : r['Participant LDC ID'],
        full_name         : r['Account Name'],
        date_of_birth     : parseDate(r['Person Account: Birthdate']),
        gender            : r['Gender'],
        planned_completion: parseDate(r['Planned Completion Date'])
      }));

      const res = await api.post('/api/participants/sync', {
        participants,
        batch_label: batchLabel
      });

      setResult(res.data);
      setFile(null);
      setPreview([]);
      setStats(null);

    } catch (err) {
      setError(err.response?.data?.error || 'Sync failed');
    } finally {
      setLoading(false);
    }
  }

  if (readOnly) {
    return (
      <div>
        <h2 style={{fontSize:'20px', fontWeight:'700', marginBottom:'6px'}}>
          Participant Sync
        </h2>
        <div style={{
          background:'#f0ece2', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'24px', color:'#6b5e4a', fontSize:'13px'
        }}>
          Participant sync is not available for National Admin accounts.
          Contact a Super Admin to perform a sync.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{fontSize:'20px', fontWeight:'700', marginBottom:'6px'}}>
        Participant Sync
      </h2>
      <p style={{color:'#6b5e4a', fontSize:'13px', marginBottom:'24px'}}>
        Upload Salesforce participant export to sync the database.
        New participants will be added, existing ones updated.
      </p>

      {error && (
        <div style={{
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          color:'#9b2335', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}

      {/* Success Result */}
      {result && (
        <div style={{
          background:'#d8ede4', border:'1px solid #2d6a4f',
          borderRadius:'8px', padding:'20px', marginBottom:'24px'
        }}>
          <div style={{fontSize:'15px', fontWeight:'700', color:'#2d6a4f', marginBottom:'12px'}}>
            Sync Completed Successfully!
          </div>
          <div style={{display:'flex', gap:'16px', flexWrap:'wrap'}}>
            {[
              { label:'Total Processed', value: result.total,    color:'#1a4068' },
              { label:'New Added',       value: result.inserted, color:'#2d6a4f' },
              { label:'Updated',         value: result.updated,  color:'#c49a3c' },
              { label:'Deactivated',     value: result.exited,   color:'#7a4f1a' },
              { label:'Errors',          value: result.errors,   color:'#9b2335' },
            ].map(s => (
              <div key={s.label} style={{
                background:'#fff', borderRadius:'6px',
                padding:'12px 20px', textAlign:'center', minWidth:'100px'
              }}>
                <div style={{fontSize:'24px', fontWeight:'700', color: s.color}}>
                  {s.value}
                </div>
                <div style={{fontSize:'11px', color:'#6b5e4a', marginTop:'3px'}}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload */}
      <div style={{
        background:'#fffef9', border:'1px solid #d4c9b0',
        borderRadius:'8px', padding:'20px', marginBottom:'20px'
      }}>
        <div style={{fontSize:'14px', fontWeight:'700', marginBottom:'4px'}}>
          Step 1 — Upload Salesforce Export
        </div>
        <div style={{fontSize:'12px', color:'#6b5e4a', marginBottom:'14px'}}>
          Export participants from Salesforce as CSV with the required columns.
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => document.getElementById('syncFile').click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border:'2px dashed #d4c9b0', borderRadius:'6px',
            padding:'32px', textAlign:'center', cursor:'pointer',
            background:'#faf8f3', transition:'all 0.2s'
          }}
        >
          <div style={{fontSize:'28px', marginBottom:'8px', opacity:0.5}}>📂</div>
          <div style={{fontSize:'13px', color:'#6b5e4a'}}>
            {file ? `✓ ${file.name}` : 'Click to browse or drag & drop CSV file'}
          </div>
          <div style={{fontSize:'11px', color:'#a09080', marginTop:'4px'}}>
            Supports .csv only
          </div>
        </div>
        <input type="file" id="syncFile" accept=".csv" aria-label="Upload CSV file"
          style={{display:'none'}}
          onChange={e => handleFile(e.target.files[0])} />

        {/* Required Columns */}
        <div style={{
          marginTop:'14px', background:'#dce9f5',
          border:'1px solid rgba(26,64,104,0.25)',
          borderRadius:'6px', padding:'14px'
        }}>
          <div style={{
            fontSize:'11px', fontWeight:'700', color:'#1a4068',
            textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'8px'
          }}>
            Required Column Names
          </div>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}>
            <thead>
              <tr>
                {['Column Name','Example'].map(h => (
                  <th key={h} style={{
                    padding:'5px 8px', textAlign:'left',
                    background:'rgba(26,64,104,0.1)',
                    color:'#1a4068', fontWeight:'700',
                    border:'1px solid rgba(26,64,104,0.2)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Participant LDC ID',        'LK0101'],
                ['Local Participant ID',       'LK010100069'],
                ['Account Name',              'Kasun Perera'],
                ['Person Account: Birthdate', '29/8/2006'],
                ['Gender',                    'Male / Female'],
                ['Planned Completion Date',   '29/8/2028'],
              ].map(([col, ex]) => (
                <tr key={col}>
                  <td style={{padding:'5px 8px', border:'1px solid rgba(26,64,104,0.15)', color:'#1a4068', fontWeight:'600'}}>{col}</td>
                  <td style={{padding:'5px 8px', border:'1px solid rgba(26,64,104,0.15)', color:'#1a4068'}}>{ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview */}
      {stats && (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'20px', marginBottom:'20px'
        }}>
          <div style={{fontSize:'14px', fontWeight:'700', marginBottom:'14px'}}>
            Step 2 — Preview & Confirm
          </div>

          {/* Stats */}
          <div style={{display:'flex', gap:'12px', marginBottom:'16px', flexWrap:'wrap'}}>
            {[
              { label:'Total',  value: stats.total,  color:'#1a4068' },
              { label:'LDCs',   value: stats.ldcs,   color:'#c49a3c' },
              { label:'Female', value: stats.female, color:'#9b2335' },
              { label:'Male',   value: stats.male,   color:'#2d6a4f' },
            ].map(s => (
              <div key={s.label} style={{
                background:'#f0ece2', borderRadius:'6px',
                padding:'10px 16px', textAlign:'center', minWidth:'80px'
              }}>
                <div style={{fontSize:'22px', fontWeight:'700', color: s.color}}>
                  {s.value}
                </div>
                <div style={{fontSize:'10px', color:'#6b5e4a', textTransform:'uppercase'}}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Preview Table */}
          <div style={{
            border:'1px solid #d4c9b0', borderRadius:'6px',
            overflow:'hidden', overflowX:'auto', marginBottom:'16px'
          }}>
            <table className="rsp-card-table" style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}>
              <thead>
                <tr style={{background:'#f0ece2'}}>
                  {['LDC ID','Participant ID','Name','DOB','Gender'].map(h => (
                    <th key={h} style={{
                      padding:'7px 10px', textAlign:'left',
                      fontWeight:'700', fontSize:'10px',
                      textTransform:'uppercase', letterSpacing:'0.4px',
                      borderBottom:'1px solid #d4c9b0', color:'#3d3528'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((p, i) => (
                  <tr key={i} style={{borderBottom:'1px solid #e8e0d0'}}>
                    <td data-label="LDC" style={{padding:'6px 10px', color:'#c49a3c', fontWeight:'700'}}>{p.ldc_id}</td>
                    <td data-label="P.ID" style={{padding:'6px 10px', color:'#6b5e4a'}}>{p.participant_id}</td>
                    <td data-label="Name" style={{padding:'6px 10px', fontWeight:'600'}}>{p.full_name}</td>
                    <td data-label="DOB" style={{padding:'6px 10px', color:'#6b5e4a'}}>{p.date_of_birth || '—'}</td>
                    <td data-label="Gender" style={{padding:'6px 10px', color:'#6b5e4a'}}>{p.gender}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{padding:'6px 10px', fontSize:'11px', color:'#a09080'}}>
              Showing first 5 of {stats.total} records
            </div>
          </div>

          {/* Batch Label */}
          <div style={{marginBottom:'16px', maxWidth:'300px'}}>
            <label style={{
              display:'block', fontSize:'11px', fontWeight:'700',
              color:'#3d3528', textTransform:'uppercase',
              letterSpacing:'0.3px', marginBottom:'5px'
            }}>Batch Label</label>
            <input
              value={batchLabel}
              onChange={e => setBatchLabel(e.target.value)}
              style={{
                width:'100%', padding:'9px 11px',
                border:'1px solid #d4c9b0', borderRadius:'5px',
                fontSize:'13px', color:'#1a1610',
                background:'#faf8f3', outline:'none', fontFamily:'inherit'
              }}
            />
          </div>

          {/* Sync Button */}
          <button onClick={handleSync} disabled={loading} style={{
            background: loading ? '#a09080' : '#2d6a4f',
            color:'#fff', border:'none', borderRadius:'6px',
            padding:'12px 28px', fontSize:'14px', fontWeight:'700',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily:'inherit'
          }}>
            {loading ? 'Syncing...' : `Sync ${stats.total} Participants`}
          </button>
        </div>
      )}
    </div>
  );
}