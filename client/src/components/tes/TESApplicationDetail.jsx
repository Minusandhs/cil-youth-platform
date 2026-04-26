import { useState, useEffect } from 'react';
import api from '../../lib/api';
import TESApplicationForm from './TESApplicationForm';

export default function TESApplicationDetail({
  application, batch, isAdmin, readOnly = false, onBack, onUpdate
}) {
  const [editing,        setEditing       ] = useState(false);
  const [savingOfficial, setSavingOfficial] = useState(false);
  const [error,          setError         ] = useState('');
  const [success,        setSuccess       ] = useState('');
  const [tesHistory, setTesHistory] = useState({ history:[], total_received:0 });
        useEffect(() => { loadTESHistory(); }, []);
        async function loadTESHistory() {
          try {
            const res = await api.get(`/api/tes/history/${application.participant_id}`);
            setTesHistory(res.data);
          } catch {
            // silently fail — not critical
          }
        }
  const [official, setOfficial] = useState({
    approval_status: application.approval_status || 'pending',
    admin_notes    : application.admin_notes     || '',
  });

  async function saveOfficialWithStatus(newStatus) {
    setSavingOfficial(true); setError(''); setSuccess('');
    try {
      await api.put(`/api/tes/applications/${application.id}/official`, {
        approval_status: newStatus,
        admin_notes    : official.admin_notes,
      });
      setOfficial({ ...official, approval_status: newStatus });
      setSuccess(`Application marked as ${newStatus}`);
      onUpdate();
    } catch {
      setError('Failed to save decision');
    } finally {
      setSavingOfficial(false);
    }
  }

  function statusBadge(status) {
    const map = {
      pending     : { bg:'var(--color-bg-stripe)', color:'var(--color-text-subdued)', label:'Pending'      },
      approved    : { bg:'var(--color-tint-success)', color:'var(--color-success)', label:'Approved'     },
      rejected    : { bg:'var(--color-tint-danger)', color:'var(--color-danger)', label:'Rejected'     },
      resubmitted : { bg:'var(--color-tint-info)', color:'var(--color-info)', label:'Resubmitted'  },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        background:s.bg, color:s.color,
        padding:'3px 12px', borderRadius:'10px',
        fontSize:'12px', fontWeight:'700'
      }}>{s.label}</span>
    );
  }

  function InfoRow({ label, value }) {
    if (!value) return null;
    return (
      <div style={{marginBottom:'10px'}}>
        <div style={{
          fontSize:'10px', fontWeight:'700', color:'var(--color-text-muted)',
          textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'2px'
        }}>{label}</div>
        <div style={{
          fontSize:'13px', color:'var(--color-text-heading)', lineHeight:'1.6'
        }}>{value}</div>
      </div>
    );
  }

  const sectionStyle = {
    background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
    borderRadius:'8px', padding:'20px', marginBottom:'16px'
  };
  const secTitle = {
    fontSize:'11px', fontWeight:'700', color:'var(--color-text-subdued)',
    textTransform:'uppercase', letterSpacing:'0.6px',
    marginBottom:'14px', paddingBottom:'8px',
    borderBottom:'1px solid var(--color-divider)'
  };
  const inputStyle = {
    width:'100%', padding:'9px 11px',
    border:'1px solid var(--color-border-subtle)', borderRadius:'5px',
    fontSize:'13px', color:'var(--color-text-heading)',
    background:'var(--color-bg-page)', outline:'none', fontFamily:'inherit'
  };
  const labelStyle = {
    display:'block', fontSize:'11px', fontWeight:'700',
    color:'var(--color-text-heading)', letterSpacing:'0.3px',
    textTransform:'uppercase', marginBottom:'5px'
  };

  if (editing) {
    return (
      <TESApplicationForm
        batch={batch}
        existingApp={application}
        onBack={() => setEditing(false)}
        onSuccess={() => { setEditing(false); onUpdate(); onBack(); }}
      />
    );
  }

  const canEdit = !isAdmin && (
    application.approval_status === 'rejected' ||
    (batch.status === 'open' &&
    ['pending', 'resubmitted'].includes(application.approval_status) &&
    new Date(batch.application_end_date) >= new Date())
  );

  const totalCost = (parseFloat(application.fee_tuition) || 0) +
                    (parseFloat(application.fee_materials) || 0);
  const familyCont = parseFloat(application.family_contribution) || 0;
  const reqAmount  = parseFloat(application.requested_amount) || 0;

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
          <div style={{
            display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap'
          }}>
            <h2 style={{fontSize:'18px', fontWeight:'700'}}>
              {application.full_name}
            </h2>
            {statusBadge(application.approval_status)}
          </div>
          <div style={{fontSize:'12px', color:'var(--color-text-subdued)', marginTop:'2px'}}>
            {application.pid} · {application.ldc_code}
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setEditing(true)} style={{
            background:'var(--color-brand-primary)', color:'var(--color-brand-accent)', border:'none',
            borderRadius:'6px', padding:'8px 16px', fontSize:'12px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>Edit Application</button>
        )}
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

      {/* Previous TES Support — only show if has history */}
{tesHistory.history.filter(h => h.status !== 'reverted').length > 0 && (
  <div style={{
    background:'var(--color-brand-primary)', borderRadius:'8px',
    padding:'16px 20px', marginBottom:'16px',
    display:'flex', alignItems:'center',
    justifyContent:'space-between', flexWrap:'wrap', gap:'12px'
  }}>
    <div>
      <div style={{
        fontSize:'11px', color:'var(--color-text-muted)',
        textTransform:'uppercase', letterSpacing:'0.5px',
        marginBottom:'4px'
      }}>
        Previously Received TES Support
      </div>
      <div style={{fontSize:'12px', color:'var(--color-brand-accent-lt)'}}>
        {tesHistory.history.filter(h => h.status !== 'reverted').length} previous intervention{tesHistory.history.filter(h => h.status !== 'reverted').length !== 1 ? 's' : ''}
      </div>
      <div style={{
        display:'flex', gap:'8px', marginTop:'6px', flexWrap:'wrap'
      }}>
        {tesHistory.history
          .filter(h => h.status !== 'reverted')
          .map(h => (
            <span key={h.id} style={{
              background:'var(--color-brand-primary)', color:'var(--color-brand-accent)',
              padding:'2px 8px', borderRadius:'6px',
              fontSize:'11px', fontWeight:'600'
            }}>
              {h.batch_name}{h.course_name ? ` — ${h.course_name}` : ''}
            </span>
          ))
        }
      </div>
    </div>
    <div style={{textAlign:'right'}}>
      <div style={{
        fontSize:'10px', color:'var(--color-text-muted)',
        textTransform:'uppercase', letterSpacing:'0.5px',
        marginBottom:'4px'
      }}>
        Total Received
      </div>
      <div style={{
        fontSize:'22px', fontWeight:'700', color:'var(--color-brand-accent)'
      }}>
        LKR {parseFloat(tesHistory.total_received).toLocaleString('en-LK', {
          minimumFractionDigits:2, maximumFractionDigits:2
        })}
      </div>
    </div>
  </div>
)}

      {/* Personal */}
      <div style={sectionStyle}>
        <div style={secTitle}>Personal Information</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoRow label="Full Name"    value={application.full_name} />
          <InfoRow label="Participant ID" value={application.pid} />
          <InfoRow label="Gender"       value={application.gender} />
          <InfoRow label="Date of Birth"
            value={application.date_of_birth
              ? new Date(application.date_of_birth).toLocaleDateString('en-GB')
              : null} />
          <InfoRow label="Contact"      value={application.contact_number} />
          <InfoRow label="Email"        value={application.email} />
          <InfoRow label="NIC"          value={application.nic_number} />
          <InfoRow label="Guardian"     value={application.guardian_name} />
        </div>
      </div>

      {/* Institution */}
      <div style={sectionStyle}>
        <div style={secTitle}>Institution & Course</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Institution"     value={application.institution_name} />
          <InfoRow label="Type"            value={application.institution_type} />
          <InfoRow label="Course"          value={application.course_name} />
          <InfoRow label="Registration No" value={application.registration_number} />
          <InfoRow label="Duration"
            value={application.course_duration
              ? `${application.course_duration} years` : null} />
          <InfoRow label="Current Year"
            value={application.course_year
              ? `Year ${application.course_year}` : null} />
          <InfoRow label="Start Date"
            value={application.course_start_date
              ? new Date(application.course_start_date)
                  .toLocaleDateString('en-GB') : null} />
          <InfoRow label="End Date"
            value={application.course_end_date
              ? new Date(application.course_end_date)
                  .toLocaleDateString('en-GB') : null} />
        </div>
      </div>

      {/* Financial */}
      {(application.fee_tuition || application.fee_materials ||
        application.financial_justification) && (
        <div style={sectionStyle}>
          <div style={secTitle}>Financial Information</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
            {[
              { label:'Tuition Fee',         value: application.fee_tuition        },
              { label:'Materials/Books/Exam', value: application.fee_materials      },
              { label:'Family Contribution',  value: application.family_contribution},
              { label:'Requested Amount',     value: application.requested_amount,
                highlight: true },
            ].map(f => f.value ? (
              <div key={f.label} style={{
                background: f.highlight ? 'var(--color-tint-success)' : 'var(--color-bg-stripe)',
                borderRadius:'6px', padding:'10px 14px', textAlign:'center'
              }}>
                <div style={{
                  fontSize:'16px', fontWeight:'700',
                  color: f.highlight ? 'var(--color-success)' : 'var(--color-brand-primary)'
                }}>
                  LKR {parseFloat(f.value).toLocaleString('en-LK', {
                    minimumFractionDigits:2
                  })}
                </div>
                <div style={{
                  fontSize:'10px', color:'var(--color-text-subdued)',
                  textTransform:'uppercase', letterSpacing:'0.3px',
                  marginTop:'3px'
                }}>{f.label}</div>
              </div>
            ) : null)}
          </div>
          <InfoRow label="Financial Justification"
            value={application.financial_justification} />
        </div>
      )}

      {/* Community */}
      {application.community_contribution && (
        <div style={sectionStyle}>
          <div style={secTitle}>Community Contribution</div>
          <InfoRow label="Plan" value={application.community_contribution} />
        </div>
      )}

      {/* Documents */}
      <div style={sectionStyle}>
        <div style={secTitle}>Documents Checklist</div>
        <div style={{display:'grid', gap:'6px'}}>
          {[
            { key:'doc_application_form', label:'Application Form'           },
            { key:'doc_certificates',     label:'Certificates (OL/AL/Other)' },
            { key:'doc_admission_letter', label:'Admission Letter'           },
            { key:'doc_income_proof',     label:'Income Proof'               },
            { key:'doc_nic',              label:'NIC Copy'                   },
            { key:'doc_recommendation',   label:'Recommendation Letter'      },
          ].map(doc => (
            <div key={doc.key} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'8px 12px',
              background: application[doc.key] ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
              border:`1px solid ${application[doc.key] ? 'var(--color-success)' : 'var(--color-danger)'}`,
              borderRadius:'5px', fontSize:'13px'
            }}>
              <span style={{
                color: application[doc.key] ? 'var(--color-success)' : 'var(--color-danger)'
              }}>
                {application[doc.key] ? '✓' : '✕'}
              </span>
              <span style={{fontWeight:'600'}}>{doc.label}</span>
            </div>
          ))}
        </div>
        <div style={{
          marginTop:'12px', padding:'12px 16px',
          background: application.commitment_confirmed ? 'var(--color-tint-success)' : 'var(--color-tint-danger)',
          border:`1px solid ${application.commitment_confirmed ? 'var(--color-success)' : 'var(--color-danger)'}`,
          borderRadius:'6px', fontSize:'13px', fontWeight:'600',
          color: application.commitment_confirmed ? 'var(--color-success)' : 'var(--color-danger)'
        }}>
          {application.commitment_confirmed ? '✓' : '✕'} Participant Commitment Confirmed
        </div>
      </div>

      {/* Official Use — LDC sees amount + notes, Admin sees status */}
      {!isAdmin && (
        <div style={{
          ...sectionStyle,
          border:'1px solid var(--color-brand-accent)', background:'var(--color-bg-highlight)'
        }}>
          <div style={secTitle}>For Official Use Only</div>
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'
          }}>
            <InfoRow label="Amount Approved (LKR)"
              value={application.amount_approved
                ? `LKR ${parseFloat(application.amount_approved)
                    .toLocaleString('en-LK', {minimumFractionDigits:2})}`
                : null} />
            <InfoRow label="Official Notes" value={application.official_notes} />
          </div>
        </div>
      )}

      {/* Participant Profile Quick Links (admin only) */}
      {isAdmin && (
        <div style={{
          background:'var(--color-bg-card)', border:'1px solid var(--color-border-subtle)',
          borderRadius:'8px', padding:'16px 20px', marginBottom:'16px'
        }}>
          <div style={{
            fontSize:'11px', fontWeight:'700', color:'var(--color-text-subdued)',
            textTransform:'uppercase', letterSpacing:'0.6px',
            marginBottom:'12px'
          }}>
            Participant Records
          </div>
          <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
            {[
              { label:'Academic Records ↗', tab:'academic' },
              { label:'Certifications ↗',  tab:'certs'    },
              { label:'Development Plan ↗', tab:'development'  },
            ].map(link => (
              <a
                key={link.tab}
                href={`/participant/${application.participant_id}?from=admin&tab=${link.tab}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background:'var(--color-tint-info)', color:'var(--color-info)',
                  border:'none', borderRadius:'5px',
                  padding:'7px 14px', fontSize:'12px',
                  fontWeight:'600', textDecoration:'none',
                  display:'inline-block'
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Admin Decision */}
      {isAdmin && (
        <div style={{
          ...sectionStyle,
          border:'2px solid var(--color-brand-primary)', background:'var(--color-brand-primary)'
        }}>
          <div style={{
            fontSize:'11px', fontWeight:'700', color:'var(--color-brand-accent)',
            textTransform:'uppercase', letterSpacing:'0.6px',
            marginBottom:'14px', paddingBottom:'8px',
            borderBottom:'1px solid var(--color-header-border)'
          }}>
            Admin Decision
          </div>

          {/* Show LDC's official use info */}
          {(application.amount_approved || application.official_notes) && (
            <div style={{
              background:'var(--color-brand-primary)', borderRadius:'6px',
              padding:'12px 16px', marginBottom:'16px'
            }}>
              <div style={{
                fontSize:'10px', color:'var(--color-text-muted)',
                textTransform:'uppercase', marginBottom:'8px'
              }}>
                LDC Submitted
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'
              }}>
                {application.amount_approved && (
                  <div>
                    <div style={{fontSize:'10px', color:'var(--color-text-muted)'}}>
                      Amount Requested
                    </div>
                    <div style={{
                      fontSize:'15px', fontWeight:'700', color:'var(--color-brand-accent)'
                    }}>
                      LKR {parseFloat(application.amount_approved)
                        .toLocaleString('en-LK', {minimumFractionDigits:2})}
                    </div>
                  </div>
                )}
                {application.official_notes && (
                  <div>
                    <div style={{fontSize:'10px', color:'var(--color-text-muted)'}}>
                      LDC Notes
                    </div>
                    <div style={{fontSize:'12px', color:'var(--color-brand-accent-lt)'}}>
                      {application.official_notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{marginTop:'20px'}}>
            <h3 style={{
              fontSize:'13px', fontWeight:'700', color:'var(--color-border-subtle)', 
              borderBottom:'1px solid var(--color-border-heavy)', paddingBottom:'8px', marginBottom:'14px'
            }}>
              Official Decision
            </h3>
            
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'10px', color:'var(--color-text-muted)', textTransform:'uppercase', marginBottom:'4px', letterSpacing:'0.5px'}}>
                Current Status
              </div>
              <div style={{display:'inline-block'}}>
                {statusBadge(official.approval_status)}
              </div>
            </div>

            {(!isAdmin || readOnly) ? (
              official.admin_notes && (
                <div style={{marginBottom:'16px'}}>
                  <div style={{fontSize:'10px', color:'var(--color-text-muted)', textTransform:'uppercase', marginBottom:'4px', letterSpacing:'0.5px'}}>
                    Admin Notes
                  </div>
                  <div style={{fontSize:'13px', color:'var(--color-brand-accent-lt)', lineHeight:'1.5', background:'var(--color-brand-primary)', padding:'10px', borderRadius:'6px', border:'1px solid var(--color-border-heavy)'}}>
                    {official.admin_notes}
                  </div>
                </div>
              )
            ) : (
              <div>
                <div style={{marginBottom:'16px'}}>
                  <label style={{display:'block', fontSize:'11px', fontWeight:'600', color:'var(--color-text-muted)', marginBottom:'6px', textTransform:'uppercase'}}>
                    Admin Notes (Required for Rejection)
                  </label>
                  <textarea style={{
                    width:'100%', boxSizing:'border-box', background:'var(--color-brand-primary)',
                    border:'1px solid var(--color-border-heavy)', color:'var(--color-tint-warning)', borderRadius:'6px',
                    padding:'10px 12px', fontSize:'13px', minHeight:'80px', resize:'vertical', fontFamily:'inherit'
                  }}
                  placeholder="Enter notes or rejection reason..."
                  value={official.admin_notes}
                  onChange={e => setOfficial({...official, admin_notes:e.target.value})} />
                </div>
                
                <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                  <button 
                    type="button" 
                    disabled={savingOfficial}
                    onClick={() => saveOfficialWithStatus('approved')}
                    style={{
                      background: savingOfficial ? 'var(--color-border-subtle)' : 'var(--color-success)',
                      color:'#fff', border:'none', borderRadius:'6px',
                      padding:'10px 20px', fontSize:'13px', fontWeight:'700',
                      cursor: savingOfficial ? 'not-allowed' : 'pointer', fontFamily:'inherit'
                    }}>
                    Approve
                  </button>
                  <button 
                    type="button" 
                    disabled={savingOfficial}
                    onClick={() => {
                      if (!official.admin_notes.trim()) {
                        alert('Please provide Admin Notes before rejecting so the LDC knows what to fix.');
                        return;
                      }
                      saveOfficialWithStatus('rejected');
                    }}
                    style={{
                      background: savingOfficial ? 'var(--color-border-subtle)' : 'var(--color-danger)',
                      color:'#fff', border:'none', borderRadius:'6px',
                      padding:'10px 20px', fontSize:'13px', fontWeight:'700',
                      cursor: savingOfficial ? 'not-allowed' : 'pointer', fontFamily:'inherit'
                    }}>
                    Reject
                  </button>
                  <button 
                    type="button" 
                    disabled={savingOfficial}
                    onClick={() => saveOfficialWithStatus('pending')}
                    style={{
                      background: 'transparent',
                      color:'var(--color-text-muted)', border:'1px solid var(--color-border-heavy)', borderRadius:'6px',
                      padding:'10px 20px', fontSize:'13px', fontWeight:'600',
                      cursor: savingOfficial ? 'not-allowed' : 'pointer', fontFamily:'inherit'
                    }}>
                    Set to Pending
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}