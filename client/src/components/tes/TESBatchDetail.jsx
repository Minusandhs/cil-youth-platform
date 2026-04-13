import { useState, useEffect } from 'react';
import api from '../../lib/api';
import TESApplicationForm from './TESApplicationForm';
import TESApplicationDetail from './TESApplicationDetail';

export default function TESBatchDetail({ batch, onBack, isAdmin }) {
  const [applications, setApplications] = useState([]);
  const [loading,      setLoading      ] = useState(true);
  const [showForm,     setShowForm     ] = useState(false);
  const [selApp,       setSelApp       ] = useState(null);
  const [error,        setError        ] = useState('');
  const [success,      setSuccess      ] = useState('');
  const [exporting,    setExporting    ] = useState(false);

  useEffect(() => { loadApplications(); }, []);

  async function loadApplications() {
    try {
      const res = await api.get(`/api/tes/batches/${batch.id}/applications`);
      setApplications(res.data);
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(app) {
        const confirm = window.confirm(
            `Remove ${app.full_name} from this batch?\nThis cannot be undone.`
        );
        if (!confirm) return;
        try {
            await api.delete(`/api/tes/applications/${app.id}`);
            setSuccess('Application removed successfully');
            loadApplications();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove application');
        }
        }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await api.get(`/api/tes/batches/${batch.id}/export`);
      const data = res.data;

      // Build Excel using SheetJS
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

      const rows = data.map(a => ({
        'Participant ID'          : a.pid,
        'Full Name'               : a.full_name,
        'LDC'                     : a.ldc_code,
        'Date of Birth'           : a.date_of_birth
                                    ? new Date(a.date_of_birth).toLocaleDateString('en-GB')
                                    : '',
        'Gender'                  : a.gender,
        'Marital Status'          : a.marital_status || '',
        'No of Children'          : a.number_of_children || '',
        'Contact Number'          : a.contact_number || '',
        'Email'                   : a.email || '',
        'NIC'                     : a.nic_number || '',
        'Guardian Name'           : a.guardian_name || '',
        'English'                 : a.lang_english || '',
        'Sinhala'                 : a.lang_sinhala || '',
        'Tamil'                   : a.lang_tamil || '',
        'Institution'             : a.institution_name || '',
        'Institution Type'        : a.institution_type || '',
        'Course'                  : a.course_name || '',
        'Duration (Years)'        : a.course_duration || '',
        'Current Year'            : a.course_year || '',
        'Course Start'            : a.course_start_date
                                    ? new Date(a.course_start_date).toLocaleDateString('en-GB')
                                    : '',
        'Course End'              : a.course_end_date
                                    ? new Date(a.course_end_date).toLocaleDateString('en-GB')
                                    : '',
        'Registration No'         : a.registration_number || '',
        'Financial Justification' : a.financial_justification || '',
        'Community Contribution'  : a.community_contribution || '',
        'Current Status'          : a.current_status || '',
        'Family Income (LKR)'     : a.family_income || '',
        'No of Dependants'        : a.no_of_dependants || '',
        'Other Assistance'        : a.other_assistance || '',
        'Short Term Plan'         : a.short_term_plan || '',
        'Long Term Plan'          : a.long_term_plan || '',
        'Career Goal'             : a.career_goal || '',
        'OL Results'              : a.ol_text || '',
        'AL Results'              : a.al_text || '',
        'Certifications'          : a.certs_text || '',
        'Development Plan'        : a.dev_plan_text || '',
        'Doc: Application Form'   : a.doc_application_form ? 'Yes' : 'No',
        'Doc: Certificates'       : a.doc_certificates ? 'Yes' : 'No',
        'Doc: Admission Letter'   : a.doc_admission_letter ? 'Yes' : 'No',
        'Doc: Income Proof'       : a.doc_income_proof ? 'Yes' : 'No',
        'Doc: NIC'                : a.doc_nic ? 'Yes' : 'No',
        'Doc: Recommendation'     : a.doc_recommendation ? 'Yes' : 'No',
        'Commitment Confirmed'    : a.commitment_confirmed ? 'Yes' : 'No',
        'Amount Approved (LKR)'   : a.amount_approved || '',
        'Approval Status'         : a.approval_status || '',
        'Official Notes'          : a.official_notes || '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Applications');
      XLSX.writeFile(wb, `TES_${batch.batch_name}_${new Date().toLocaleDateString('en-GB').replace(/\//g,'-')}.xlsx`);
      setSuccess('Excel file exported successfully');
    } catch (err) {
      setError('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  function statusBadge(status) {
    const map = {
      pending     : { bg:'#f0ece2', color:'#6b5e4a', label:'Pending'     },
      approved    : { bg:'#d8ede4', color:'#2d6a4f', label:'Approved'    },
      rejected    : { bg:'#f5e0e3', color:'#9b2335', label:'Rejected'    },
      resubmitted : { bg:'#dce9f5', color:'#1a4068', label:'Resubmitted' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        background:s.bg, color:s.color,
        padding:'2px 8px', borderRadius:'8px',
        fontSize:'10px', fontWeight:'700'
      }}>{s.label}</span>
    );
  }

  function batchStatusBadge(status) {
    const map = {
      open      : { bg:'#d8ede4', color:'#2d6a4f', label:'Open'      },
      reviewing : { bg:'#f0ece2', color:'#6b5e4a', label:'Reviewing' },
      approved  : { bg:'#dce9f5', color:'#1a4068', label:'Approved'  },
      funded    : { bg:'#fdecd8', color:'#b85c00', label:'Funded'    },
      completed : { bg:'#1a1610', color:'#c49a3c', label:'Completed' },
      rejected  : { bg:'#f5e0e3', color:'#9b2335', label:'Rejected'  },
    };
    const s = map[status] || map.reviewing;
    return (
      <span style={{
        background:s.bg, color:s.color,
        padding:'3px 10px', borderRadius:'10px',
        fontSize:'11px', fontWeight:'700'
      }}>{s.label}</span>
    );
  }

  const isOpen = batch.status === 'open';
  const deadlinePassed = new Date(batch.application_end_date) < new Date();

  // Show application form
  if (showForm) {
    return (
      <TESApplicationForm
        batch={batch}
        onBack={() => { setShowForm(false); loadApplications(); }}
        onSuccess={() => { setShowForm(false); loadApplications(); }}
      />
    );
  }

  // Show application detail
  if (selApp) {
    return (
      <TESApplicationDetail
        application={selApp}
        batch={batch}
        isAdmin={isAdmin}
        onBack={() => { setSelApp(null); loadApplications(); }}
        onUpdate={loadApplications}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center',
        gap:'12px', marginBottom:'20px', flexWrap:'wrap'
      }}>
        <button onClick={onBack} style={{
          background:'transparent', border:'1px solid #d4c9b0',
          color:'#6b5e4a', padding:'6px 14px', borderRadius:'5px',
          fontSize:'12px', cursor:'pointer', fontFamily:'inherit'
        }}>← Back</button>
        <div style={{flex:1}}>
          <div style={{
            display:'flex', alignItems:'center',
            gap:'10px', flexWrap:'wrap'
          }}>
            <h2 style={{fontSize:'18px', fontWeight:'700'}}>
              {batch.batch_name}
            </h2>
            {batchStatusBadge(batch.status)}
          </div>
          <div style={{
            fontSize:'12px', color:'#6b5e4a',
            marginTop:'2px', display:'flex', gap:'16px'
          }}>
            <span>Deadline: {new Date(batch.application_end_date)
              .toLocaleDateString('en-GB')}</span>
            <span style={{fontWeight:'700', color:'#c49a3c'}}>
              {applications.length} Applications
            </span>
          </div>
        </div>

        <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
          {/* Export Button */}
          <button onClick={handleExport} disabled={exporting} style={{
            background:'#1a4068', color:'#fff', border:'none',
            borderRadius:'6px', padding:'8px 16px', fontSize:'12px',
            fontWeight:'600', cursor: exporting ? 'not-allowed' : 'pointer',
            fontFamily:'inherit'
          }}>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>

          {/* Add Application — LDC only, batch open, deadline not passed */}
          {!isAdmin && isOpen && !deadlinePassed && (
            <button onClick={() => setShowForm(true)} style={{
              background:'#1a1610', color:'#c49a3c', border:'none',
              borderRadius:'6px', padding:'8px 16px', fontSize:'12px',
              fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
            }}>+ Add Application</button>
          )}
        </div>
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

      {/* Batch Notes */}
      {batch.update_notes && (
        <div style={{
          background:'#fdecd8', border:'1px solid #b85c00',
          borderRadius:'6px', padding:'10px 14px',
          fontSize:'12px', color:'#b85c00', marginBottom:'16px'
        }}>
          {batch.update_notes}
        </div>
      )}

      {/* Deadline warning */}
      {!isAdmin && isOpen && deadlinePassed && (
        <div style={{
          background:'#f5e0e3', border:'1px solid #9b2335',
          borderRadius:'6px', padding:'10px 14px',
          fontSize:'12px', color:'#9b2335', marginBottom:'16px'
        }}>
          The application deadline has passed. No new applications can be submitted.
        </div>
      )}

      {loading ? (
        <div style={{padding:'32px', color:'#6b5e4a'}}>Loading applications...</div>
      ) : applications.length === 0 ? (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>📄</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No Applications Yet
          </div>
          {!isAdmin && isOpen && !deadlinePassed && (
            <button onClick={() => setShowForm(true)} style={{
              background:'#1a1610', color:'#c49a3c', border:'none',
              borderRadius:'6px', padding:'10px 20px', fontSize:'13px',
              fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
              marginTop:'12px'
            }}>+ Add First Application</button>
          )}
        </div>
      ) : (
        <div style={{
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', overflow:'hidden'
        }}>
          <table style={{
            width:'100%', borderCollapse:'collapse', fontSize:'13px'
          }}>
            <thead>
              <tr style={{background:'#f0ece2'}}>
                {[
                  'Participant', 'LDC', 'Institution',
                  'Course', 'Status', 'Amount (LKR)', 'Action'
                ].map(h => (
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
              {applications.map(app => (
                <tr key={app.id} style={{borderBottom:'1px solid #e8e0d0'}}
                  onMouseEnter={e => e.currentTarget.style.background='#faf8f3'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{padding:'10px 14px'}}>
                    <div style={{fontWeight:'600'}}>{app.full_name}</div>
                    <div style={{fontSize:'11px', color:'#a09080'}}>
                      {app.pid}
                    </div>
                  </td>
                  <td style={{
                    padding:'10px 14px', color:'#6b5e4a', fontSize:'12px'
                  }}>
                    {app.ldc_code}
                  </td>
                  <td style={{
                    padding:'10px 14px', color:'#6b5e4a', fontSize:'12px'
                  }}>
                    {app.institution_name || '—'}
                  </td>
                  <td style={{
                    padding:'10px 14px', color:'#6b5e4a', fontSize:'12px'
                  }}>
                    {app.course_name || '—'}
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    {statusBadge(app.approval_status)}
                  </td>
                  <td style={{
                    padding:'10px 14px', fontWeight:'600',
                    color: app.amount_approved ? '#2d6a4f' : '#a09080'
                  }}>
                    {app.amount_approved
                      ? `LKR ${parseFloat(app.amount_approved).toLocaleString()}`
                      : '—'}
                  </td>
                  <td style={{padding:'10px 14px'}}>
                    <div style={{display:'flex', gap:'6px'}}>
                        <button onClick={() => setSelApp(app)} style={{
                        background:'#1a1610', color:'#c49a3c', border:'none',
                        borderRadius:'4px', padding:'5px 12px', fontSize:'11px',
                        fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
                        }}>View</button>
                        {!isAdmin && isOpen &&
                        app.approval_status === 'pending' && (
                        <button onClick={() => handleRemove(app)} style={{
                            background:'#f5e0e3', color:'#9b2335', border:'none',
                            borderRadius:'4px', padding:'5px 10px', fontSize:'11px',
                            fontWeight:'600', cursor:'pointer', fontFamily:'inherit'
                        }}>Remove</button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}