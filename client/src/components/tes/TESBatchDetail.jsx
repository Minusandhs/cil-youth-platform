import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { exportToCsv } from '../../lib/csvExport';
import TESApplicationForm from './TESApplicationForm';
import TESApplicationDetail from './TESApplicationDetail';
import TESBursementPlan from './TESBursementPlan';

export default function TESBatchDetail({ batch, onBack, onBatchUpdate, isAdmin, readOnly = false }) {
  const [applications,    setApplications   ] = useState([]);
  const [loading,         setLoading        ] = useState(true);
  const [showForm,        setShowForm       ] = useState(false);
  const [selApp,          setSelApp         ] = useState(null);
  const [error,           setError          ] = useState('');
  const [success,         setSuccess        ] = useState('');
  const [exporting,       setExporting      ] = useState(false);
  const [monitoringEdits,  setMonitoringEdits ] = useState({});
  const [savingId,         setSavingId        ] = useState(null);
  const [savedId,          setSavedId         ] = useState(null);
  const [disbursementApp,  setDisbursementApp ] = useState(null);
  const [batchStatus,      setBatchStatus     ] = useState(batch.status);
  const [statusChanging,   setStatusChanging  ] = useState(false);
  const [editingStatus,    setEditingStatus   ] = useState(false);
  const [pendingStatus,    setPendingStatus   ] = useState(batch.status);

  useEffect(() => { loadApplications(); }, []);

  async function loadApplications() {
    try {
      const res = await api.get(`/api/tes/batches/${batch.id}/applications`);
      setApplications(res.data);
      const seed = {};
      for (const app of res.data) {
        seed[app.id] = { monitoring_status: app.monitoring_status || 'not_started' };
      }
      setMonitoringEdits(seed);
    } catch {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function saveMonitoring(appId) {
    setSavingId(appId);
    setError('');
    try {
      const edit = monitoringEdits[appId];
      await api.patch(`/api/tes/applications/${appId}/monitoring`, {
        monitoring_status: edit.monitoring_status,
      });
      setSavedId(appId);
      setTimeout(() => setSavedId(id => id === appId ? null : id), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save monitoring data');
    } finally {
      setSavingId(null);
    }
  }

  async function handleStatusChange() {
    setStatusChanging(true);
    setError('');
    try {
      const res = await api.put(`/api/tes/batches/${batch.id}`, {
        ...batch,
        status: pendingStatus,
        funded_date: pendingStatus === 'funded'
          ? new Date().toISOString().split('T')[0]
          : batch.funded_date,
      });
      setBatchStatus(pendingStatus);
      setEditingStatus(false);
      if (onBatchUpdate) onBatchUpdate(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
      setPendingStatus(batchStatus);
    } finally {
      setStatusChanging(false);
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

        'Long Term Plan'          : a.long_term_plan || '',
        'Career Aspiration'       : a.career_aspiration || '',
        'Aspired Industry'        : a.aspired_industry || '',
        'Holland Code'            : [a.holland_primary, a.holland_secondary, a.holland_tertiary].filter(Boolean).join('') || '',
        'Career Choice 1'         : a.career_choice_1 || '',
        'Career Choice 2'         : a.career_choice_2 || '',
        'Career Choice 3'         : a.career_choice_3 || '',
        'Interested to Apply'     : a.interested_to_apply ? 'Yes' : 'No',
        'Preferred Industry'      : a.interest_industry || '',
        'Job Interest Notes'      : a.interest_notes || '',
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

      const datePart = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
      exportToCsv(`TES_${batch.batch_name}_${datePart}.csv`, rows);
      setSuccess('CSV file exported successfully');
    } catch (err) {
      setError('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  function statusBadge(status) {
    const map = {
      pending     : { bg:'var(--color-bg-stripe)', color:'var(--color-text-subdued)', label:'Pending'     },
      approved    : { bg:'var(--color-tint-success)', color:'var(--color-success)', label:'Approved'    },
      rejected    : { bg:'var(--color-tint-danger)', color:'var(--color-danger)', label:'Rejected'    },
      resubmitted : { bg:'var(--color-tint-info)', color:'var(--color-info)', label:'Resubmitted' },
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

  const STATUS_MAP = {
    open      : { bg:'var(--color-tint-success)', color:'var(--color-success)', label:'Open'      },
    closed    : { bg:'var(--color-bg-stripe)', color:'var(--color-text-subdued)', label:'Closed'    },
    funded    : { bg:'var(--color-tint-warning)', color:'var(--color-warning)', label:'Funded'    },
    completed : { bg:'var(--color-brand-primary)', color:'var(--color-brand-accent)', label:'Completed' },
    rejected  : { bg:'var(--color-tint-danger)', color:'var(--color-danger)', label:'Rejected'  },
  };

  function batchStatusBadge(status) {
    const s = STATUS_MAP[status] || STATUS_MAP.closed;
    return (
      <span style={{
        background:s.bg, color:s.color,
        padding:'3px 10px', borderRadius:'10px',
        fontSize:'11px', fontWeight:'700'
      }}>{s.label}</span>
    );
  }

  const isOpen = batchStatus === 'open';
  const deadlinePassed = new Date(batch.application_end_date) < new Date();
  const isMonitoringView = ['funded', 'completed'].includes(batchStatus);

  const totalDisbursed = applications
    .filter(a => a.approval_status === 'approved')
    .reduce((sum, a) => sum + (parseFloat(a.disbursed_amount) || 0), 0);

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
        readOnly={readOnly}
        onBack={() => { setSelApp(null); loadApplications(); }}
        onUpdate={loadApplications}
      />
    );
  }

  // Show disbursement plan
  if (disbursementApp) {
    return (
      <TESBursementPlan
        application={disbursementApp}
        batch={batch}
        readOnly={readOnly}
        onBack={() => setDisbursementApp(null)}
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
          background:'transparent', border:'1px solid var(--color-border-subtle)',
          color:'var(--color-text-subdued)', padding:'6px 14px', borderRadius:'5px',
          fontSize:'12px', cursor:'pointer', fontFamily:'inherit'
        }}>← Back</button>
        <div style={{flex:1}}>
          <h2 style={{fontSize:'18px', fontWeight:'700', marginBottom:'4px'}}>
            {batch.batch_name}
          </h2>
          <div style={{
            fontSize:'12px', color:'var(--color-text-subdued)',
            display:'flex', gap:'16px', flexWrap:'wrap', alignItems:'center'
          }}>
            <span>Deadline: {new Date(batch.application_end_date)
              .toLocaleDateString('en-GB')}</span>
            <span style={{fontWeight:'700', color:'var(--color-brand-accent)'}}>
              {applications.length} Applications
            </span>
          </div>
          {/* Status row */}
          <div style={{
            marginTop:'8px', display:'flex', alignItems:'center',
            gap:'8px', flexWrap:'wrap'
          }}>
            <span style={{
              fontSize:'10px', fontWeight:'700', textTransform:'uppercase',
              letterSpacing:'0.4px', color:'var(--color-text-muted)'
            }}>Status</span>
            {isAdmin && !readOnly ? (
              editingStatus ? (
                <>
                  <select
                    value={pendingStatus}
                    onChange={e => setPendingStatus(e.target.value)}
                    disabled={statusChanging}
                    style={{
                      padding:'4px 10px', fontSize:'11px', fontWeight:'700',
                      fontFamily:'inherit', borderRadius:'10px', outline:'none',
                      border:`1px solid ${STATUS_MAP[pendingStatus]?.color || 'var(--color-text-subdued)'}`,
                      background: STATUS_MAP[pendingStatus]?.bg || 'var(--color-bg-stripe)',
                      color: STATUS_MAP[pendingStatus]?.color || 'var(--color-text-subdued)',
                      cursor: statusChanging ? 'not-allowed' : 'pointer',
                      opacity: statusChanging ? 0.7 : 1,
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="funded">Funded</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button onClick={handleStatusChange} disabled={statusChanging} style={{
                    background:'var(--color-success)', color:'#fff', border:'none',
                    borderRadius:'5px', padding:'4px 12px', fontSize:'11px',
                    fontWeight:'700', cursor: statusChanging ? 'not-allowed' : 'pointer',
                    fontFamily:'inherit', opacity: statusChanging ? 0.7 : 1
                  }}>{statusChanging ? '...' : 'Save'}</button>
                  <button onClick={() => { setEditingStatus(false); setPendingStatus(batchStatus); }} style={{
                    background:'transparent', color:'var(--color-text-subdued)',
                    border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
                    padding:'4px 10px', fontSize:'11px', cursor:'pointer', fontFamily:'inherit'
                  }}>Cancel</button>
                </>
              ) : (
                <>
                  {batchStatusBadge(batchStatus)}
                  <button onClick={() => setEditingStatus(true)} style={{
                    background:'transparent', color:'var(--color-text-subdued)',
                    border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
                    padding:'3px 10px', fontSize:'11px', cursor:'pointer', fontFamily:'inherit'
                  }}>Edit</button>
                </>
              )
            ) : (
              batchStatusBadge(batchStatus)
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          {/* Export Button */}
          <button onClick={handleExport} disabled={exporting} className="w-full md:w-auto" style={{
            background:'var(--color-info)', color:'#fff', border:'none',
            borderRadius:'6px', padding:'8px 16px', fontSize:'12px',
            fontWeight:'600', cursor: exporting ? 'not-allowed' : 'pointer',
            fontFamily:'inherit'
          }}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          {/* Add Application — LDC only, batch open, deadline not passed */}
          {!isAdmin && isOpen && !deadlinePassed && (
            <button onClick={() => setShowForm(true)} className="w-full md:w-auto" style={{
              background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
              borderRadius:'6px', padding:'8px 16px', fontSize:'12px',
              fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
            }}>+ Add Application</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          background:'var(--color-tint-danger)', border:'1px solid var(--color-danger)',
          borderRadius:'6px', padding:'10px 14px',
          color:'var(--color-danger)', fontSize:'13px', marginBottom:'16px'
        }}>{error}</div>
      )}
      {success && (
        <div style={{
          background:'var(--color-tint-success)', border:'1px solid var(--color-success)',
          borderRadius:'6px', padding:'10px 14px',
          color:'var(--color-success)', fontSize:'13px', marginBottom:'16px'
        }}>{success}</div>
      )}

      {/* Batch Notes */}
      {batch.update_notes && (
        <div style={{
          background:'var(--color-tint-warning)', border:'1px solid var(--color-warning)',
          borderRadius:'6px', padding:'10px 14px',
          fontSize:'12px', color:'var(--color-warning)', marginBottom:'16px'
        }}>
          {batch.update_notes}
        </div>
      )}

      {/* Deadline warning */}
      {!isAdmin && isOpen && deadlinePassed && (
        <div style={{
          background:'var(--color-tint-danger)', border:'1px solid var(--color-danger)',
          borderRadius:'6px', padding:'10px 14px',
          fontSize:'12px', color:'var(--color-danger)', marginBottom:'16px'
        }}>
          The application deadline has passed. No new applications can be submitted.
        </div>
      )}

      {loading ? (
        <div style={{padding:'32px', color:'var(--color-text-subdued)'}}>Loading applications...</div>
      ) : applications.length === 0 ? (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'40px', textAlign:'center'
        }}>
          <div style={{fontSize:'36px', marginBottom:'10px'}}>📄</div>
          <div style={{fontSize:'15px', fontWeight:'700', marginBottom:'6px'}}>
            No Applications Yet
          </div>
          {!isAdmin && isOpen && !deadlinePassed && (
            <button onClick={() => setShowForm(true)} style={{
              background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
              borderRadius:'6px', padding:'10px 20px', fontSize:'13px',
              fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
              marginTop:'12px'
            }}>+ Add First Application</button>
          )}
        </div>
      ) : (
        <div className="rsp-card-wrap">
          <table className={`rsp-card-table rsp-tes-table${isMonitoringView ? ' rsp-tes-monitoring' : ''}`} style={{
            width:'100%', borderCollapse:'collapse', fontSize:'13px'
          }}>
            <thead>
              <tr style={{background:'var(--color-bg-stripe)'}}>
                {[
                  { label:'Participant' }, { label:'LDC' },
                  { label:'Institution' }, { label:'Course' },
                  { label:'Status' },     { label:'Amount (LKR)', center:true },
                  ...(isMonitoringView
                    ? [{ label:'Monitoring Status', center:true }, { label:'Disbursed (LKR)', center:true }]
                    : []),
                  { label:'Action' },
                ].map(h => (
                  <th key={h.label} style={{
                    padding:'10px 14px',
                    textAlign: h.center ? 'center' : 'left',
                    fontSize:'10.5px', fontWeight:'700',
                    textTransform:'uppercase', letterSpacing:'0.4px',
                    color:'var(--color-text-heading)', borderBottom:'1px solid var(--color-border-subtle)'
                  }}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map(app => (
                <tr key={app.id} style={{borderBottom:'1px solid var(--color-divider)'}}
                  onMouseEnter={e => e.currentTarget.style.background='var(--color-bg-page)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td data-label="Participant" style={{padding:'10px 14px'}}>
                    <div style={{fontWeight:'600'}}>{app.full_name}</div>
                    <div style={{fontSize:'11px', color:'var(--color-text-muted)'}}>
                      {app.pid}
                    </div>
                    <div className="rsp-pcard-sub">
                      {[app.institution_name, app.course_name].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td data-label="LDC" style={{
                    padding:'10px 14px', color:'var(--color-text-subdued)', fontSize:'12px'
                  }}>
                    {app.ldc_code}
                  </td>
                  <td data-label="Institution" style={{
                    padding:'10px 14px', color:'var(--color-text-subdued)', fontSize:'12px'
                  }}>
                    {app.institution_name || '—'}
                  </td>
                  <td data-label="Course" style={{
                    padding:'10px 14px', color:'var(--color-text-subdued)', fontSize:'12px'
                  }}>
                    {app.course_name || '—'}
                  </td>
                  <td data-label="Status" style={{padding:'10px 14px'}}>
                    {statusBadge(app.approval_status)}
                  </td>
                  <td data-label="Amount" style={{
                    padding:'10px 14px', fontWeight:'600', textAlign:'center', verticalAlign:'middle',
                    color: app.amount_approved ? 'var(--color-success)' : 'var(--color-text-muted)'
                  }}>
                    {app.amount_approved
                      ? `LKR ${parseFloat(app.amount_approved).toLocaleString()}`
                      : '—'}
                  </td>
                  {isMonitoringView && (
                    <>
                      <td data-label="Monitoring Status" style={{
                        padding:'10px 14px', textAlign:'center', verticalAlign:'middle'
                      }}>
                        {app.approval_status === 'approved' ? (
                          <select
                            value={monitoringEdits[app.id]?.monitoring_status || 'not_started'}
                            onChange={e => setMonitoringEdits(prev => ({
                              ...prev,
                              [app.id]: { ...prev[app.id], monitoring_status: e.target.value }
                            }))}
                            disabled={readOnly}
                            style={{
                              padding:'5px 8px', fontSize:'11px', fontFamily:'inherit',
                              border:'1px solid var(--color-border-subtle)',
                              borderRadius:'4px', background:'var(--color-bg-page)',
                              color:'var(--color-text-heading)', outline:'none',
                              cursor: readOnly ? 'default' : 'pointer'
                            }}
                          >
                            <option value="not_started">Not Started</option>
                            <option value="continuing">Continuing</option>
                            <option value="stopped">Stopped</option>
                            <option value="temporarily_stopped">Temporarily Stopped</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <span style={{color:'var(--color-text-muted)', fontSize:'11px'}}>—</span>
                        )}
                      </td>
                      <td data-label="Disbursed (LKR)" style={{
                        padding:'10px 14px', textAlign:'center', verticalAlign:'middle',
                        fontWeight:'600',
                        color: app.disbursed_amount ? 'var(--color-success)' : 'var(--color-text-muted)'
                      }}>
                        {app.approval_status === 'approved'
                          ? (app.disbursed_amount
                              ? `LKR ${parseFloat(app.disbursed_amount).toLocaleString()}`
                              : '—')
                          : <span style={{color:'var(--color-text-muted)', fontSize:'11px'}}>—</span>
                        }
                      </td>
                    </>
                  )}
                  <td data-label="Action" style={{padding:'10px 14px', verticalAlign:'middle'}}>
                    <div style={{
                      display:'flex', flexDirection:'column',
                      gap:'5px', minWidth:'70px'
                    }}>
                      <button onClick={() => setSelApp(app)} style={{
                        background:'var(--color-bg-stripe)', color:'var(--color-text-heading)',
                        border:'1px solid var(--color-border-subtle)',
                        borderRadius:'4px', padding:'6px 12px', fontSize:'11px',
                        fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
                        width:'100%'
                      }}>View</button>
                      {isMonitoringView && app.approval_status === 'approved' && (
                        <button onClick={() => setDisbursementApp(app)} style={{
                          background:'var(--color-tint-info)', color:'var(--color-info)',
                          border:'1px solid var(--color-info)',
                          borderRadius:'4px', padding:'6px 12px', fontSize:'11px',
                          fontWeight:'700', cursor:'pointer', fontFamily:'inherit',
                          width:'100%'
                        }}>Plan</button>
                      )}
                      {isMonitoringView && !readOnly && app.approval_status === 'approved' && (
                        <button
                          onClick={() => saveMonitoring(app.id)}
                          disabled={savingId === app.id}
                          style={{
                            background: savedId === app.id
                              ? 'var(--color-success)' : 'var(--color-brand-primary)',
                            color: savedId === app.id
                              ? '#fff' : 'var(--color-brand-accent)',
                            border:'none', borderRadius:'4px',
                            padding:'6px 12px', fontSize:'11px',
                            fontWeight:'700', cursor: savingId === app.id ? 'not-allowed' : 'pointer',
                            fontFamily:'inherit',
                            opacity: savingId === app.id ? 0.7 : 1,
                            width:'100%'
                          }}
                        >
                          {savingId === app.id ? '...' : savedId === app.id ? 'Saved ✓' : 'Save'}
                        </button>
                      )}
                      {!isAdmin && isOpen && app.approval_status === 'pending' && (
                        <button onClick={() => handleRemove(app)} style={{
                          background:'var(--color-tint-danger)', color:'var(--color-danger)', border:'none',
                          borderRadius:'4px', padding:'6px 12px', fontSize:'11px',
                          fontWeight:'600', cursor:'pointer', fontFamily:'inherit',
                          width:'100%'
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

      {/* Total Distributed summary */}
      {isMonitoringView && applications.length > 0 && (
        <div style={{
          display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap',
          background:'var(--color-bg-card)',
          border:'1px solid var(--color-border-subtle)',
          borderRadius:'6px', padding:'12px 20px', marginTop:'12px'
        }}>
          <span style={{
            fontSize:'11px', fontWeight:'700', textTransform:'uppercase',
            letterSpacing:'0.5px', color:'var(--color-text-heading)'
          }}>Total Disbursed</span>
          <span style={{
            fontSize:'16px', fontWeight:'700',
            color: totalDisbursed > 0 ? 'var(--color-success)' : 'var(--color-text-muted)'
          }}>
            {totalDisbursed > 0
              ? `LKR ${totalDisbursed.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`
              : '—'
            }
          </span>
        </div>
      )}
    </div>
  );
}