import { useState, useEffect } from 'react';
import api from '../../lib/api';
import TESApplicationForm from './TESApplicationForm';
import { useConstants } from '../../lib/useConstants';

export default function TESApplicationDetail({
  application, batch, isAdmin, readOnly = false, onBack, onUpdate
}) {
  const options = useConstants();
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
  const [isEditingOfficial, setIsEditingOfficial] = useState(false);
  const [official, setOfficial] = useState({
    approval_status: application.approval_status || 'pending',
    admin_notes    : application.admin_notes     || '',
  });

  async function saveOfficial(e) {
    e.preventDefault();
    setSavingOfficial(true); setError(''); setSuccess('');
    try {
      await api.put(`/api/tes/applications/${application.id}/official`, {
        approval_status: official.approval_status,
        admin_notes    : official.admin_notes,
      });
      setSuccess('Decision saved successfully');
      setIsEditingOfficial(false);
      onUpdate();
    } catch {
      setError('Failed to save decision');
    } finally {
      setSavingOfficial(false);
    }
  }

  function statusBadge(status) {
    const map = {
      pending     : { bg:'#f0ece2', color:'#6b5e4a', label:'Pending'      },
      approved    : { bg:'#d8ede4', color:'#2d6a4f', label:'Approved'     },
      rejected    : { bg:'#f5e0e3', color:'#9b2335', label:'Rejected'     },
      resubmitted : { bg:'#dce9f5', color:'#1a4068', label:'Resubmitted'  },
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
          fontSize:'10px', fontWeight:'700', color:'#a09080',
          textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'2px'
        }}>{label}</div>
        <div style={{
          fontSize:'13px', color:'#1a1610', lineHeight:'1.6'
        }}>{value}</div>
      </div>
    );
  }

  const sectionStyle = {
    background:'#fffef9', border:'1px solid #d4c9b0',
    borderRadius:'8px', padding:'20px', marginBottom:'16px'
  };
  const secTitle = {
    fontSize:'11px', fontWeight:'700', color:'#6b5e4a',
    textTransform:'uppercase', letterSpacing:'0.6px',
    marginBottom:'14px', paddingBottom:'8px',
    borderBottom:'1px solid #e8e0d0'
  };
  const inputStyle = {
    width:'100%', padding:'9px 11px',
    border:'1px solid #d4c9b0', borderRadius:'5px',
    fontSize:'13px', color:'#1a1610',
    background:'#faf8f3', outline:'none', fontFamily:'inherit'
  };
  const labelStyle = {
    display:'block', fontSize:'11px', fontWeight:'700',
    color:'#3d3528', letterSpacing:'0.3px',
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
          background:'transparent', border:'1px solid #d4c9b0',
          color:'#6b5e4a', padding:'6px 14px', borderRadius:'5px',
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
          <div style={{fontSize:'12px', color:'#6b5e4a', marginTop:'2px'}}>
            {application.pid} · {application.ldc_code}
          </div>
        </div>
        {canEdit && (
          <button onClick={() => setEditing(true)} style={{
            background:'#1a1610', color:'#c49a3c', border:'none',
            borderRadius:'6px', padding:'8px 16px', fontSize:'12px',
            fontWeight:'700', cursor:'pointer', fontFamily:'inherit'
          }}>Edit Application</button>
        )}
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

      {/* Previous TES Support — only show if has history */}
{tesHistory.history.filter(h => h.status !== 'reverted').length > 0 && (
  <div style={{
    background:'#1a1610', borderRadius:'8px',
    padding:'16px 20px', marginBottom:'16px',
    display:'flex', alignItems:'center',
    justifyContent:'space-between', flexWrap:'wrap', gap:'12px'
  }}>
    <div>
      <div style={{
        fontSize:'11px', color:'#a09080',
        textTransform:'uppercase', letterSpacing:'0.5px',
        marginBottom:'4px'
      }}>
        Previously Received TES Support
      </div>
      <div style={{fontSize:'12px', color:'#e8d4a0'}}>
        {tesHistory.history.filter(h => h.status !== 'reverted').length} previous intervention{tesHistory.history.filter(h => h.status !== 'reverted').length !== 1 ? 's' : ''}
      </div>
      <div style={{
        display:'flex', gap:'8px', marginTop:'6px', flexWrap:'wrap'
      }}>
        {tesHistory.history
          .filter(h => h.status !== 'reverted')
          .map(h => (
            <span key={h.id} style={{
              background:'#2e2a22', color:'#c49a3c',
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
        fontSize:'10px', color:'#a09080',
        textTransform:'uppercase', letterSpacing:'0.5px',
        marginBottom:'4px'
      }}>
        Total Received
      </div>
      <div style={{
        fontSize:'22px', fontWeight:'700', color:'#c49a3c'
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
        <div className="rsp-grid-3" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px'
        }}>
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

      {/* Language */}
      {(application.lang_english || application.lang_sinhala ||
        application.lang_tamil) && (
        <div style={sectionStyle}>
          <div style={secTitle}>Language Proficiency</div>

          {/* Desktop: matrix table */}
          <div className="rsp-hide-mobile">
          <div style={{overflowX:'auto'}}>
          <table style={{
            width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'360px'
          }}>
            <thead>
              <tr style={{background:'#f0ece2'}}>
                <th style={{
                  padding:'7px 12px', textAlign:'left',
                  fontSize:'10px', fontWeight:'700',
                  textTransform:'uppercase', color:'#3d3528',
                  borderBottom:'1px solid #d4c9b0', width:'100px'
                }}>Language</th>
                {options.langLevels.map(l => (
                  <th key={l.value} style={{
                    padding:'7px 12px', textAlign:'center',
                    fontSize:'10px', fontWeight:'700',
                    textTransform:'uppercase', color:'#3d3528',
                    borderBottom:'1px solid #d4c9b0'
                  }}>{l.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { key:'lang_english', label:'English' },
                { key:'lang_sinhala', label:'Sinhala' },
                { key:'lang_tamil',   label:'Tamil'   },
              ].map(lang => (
                <tr key={lang.key} style={{borderBottom:'1px solid #e8e0d0'}}>
                  <td style={{padding:'8px 12px', fontWeight:'600'}}>
                    {lang.label}
                  </td>
                  {options.langLevels.map(level => (
                    <td key={level.value} style={{
                      padding:'8px 12px', textAlign:'center'
                    }}>
                      {application[lang.key] === level.value ? (
                        <span style={{
                          background:'#c49a3c', color:'#fff',
                          padding:'2px 10px', borderRadius:'8px',
                          fontSize:'11px', fontWeight:'700'
                        }}>
                          {level.label}
                        </span>
                      ) : (
                        <span style={{color:'#e8e0d0', fontSize:'16px'}}>○</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>

          {/* Mobile: language + selected level as simple rows */}
          <div className="rsp-show-mobile-only">
            {[
              { key:'lang_english', label:'English' },
              { key:'lang_sinhala', label:'Sinhala' },
              { key:'lang_tamil',   label:'Tamil'   },
            ].filter(lang => application[lang.key]).map((lang, i, arr) => (
              <div key={lang.key} style={{
                display:'flex', alignItems:'center',
                justifyContent:'space-between',
                padding:'10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #f0ece2' : 'none'
              }}>
                <span style={{fontWeight:'600', fontSize:'13px'}}>{lang.label}</span>
                <span style={{
                  background:'#c49a3c', color:'#fff',
                  padding:'3px 12px', borderRadius:'8px',
                  fontSize:'11px', fontWeight:'700'
                }}>
                  {application[lang.key].charAt(0).toUpperCase() +
                   application[lang.key].slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institution */}
      <div style={sectionStyle}>
        <div style={secTitle}>Institution & Course</div>
        <div className="rsp-grid-2" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'
        }}>
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
          <div className="rsp-grid-4" style={{
            display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr',
            gap:'12px', marginBottom:'14px'
          }}>
            {[
              { label:'Tuition Fee',         value: application.fee_tuition        },
              { label:'Materials/Books/Exam', value: application.fee_materials      },
              { label:'Family Contribution',  value: application.family_contribution},
              { label:'Requested Amount',     value: application.requested_amount,
                highlight: true },
            ].map(f => f.value ? (
              <div key={f.label} style={{
                background: f.highlight ? '#d8ede4' : '#f0ece2',
                borderRadius:'6px', padding:'10px 14px', textAlign:'center'
              }}>
                <div style={{
                  fontSize:'16px', fontWeight:'700',
                  color: f.highlight ? '#2d6a4f' : '#1a1610'
                }}>
                  LKR {parseFloat(f.value).toLocaleString('en-LK', {
                    minimumFractionDigits:2
                  })}
                </div>
                <div style={{
                  fontSize:'10px', color:'#6b5e4a',
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
              background: application[doc.key] ? '#d8ede4' : '#f5e0e3',
              border:`1px solid ${application[doc.key] ? '#2d6a4f' : '#9b2335'}`,
              borderRadius:'5px', fontSize:'13px'
            }}>
              <span style={{
                color: application[doc.key] ? '#2d6a4f' : '#9b2335'
              }}>
                {application[doc.key] ? '✓' : '✕'}
              </span>
              <span style={{fontWeight:'600'}}>{doc.label}</span>
            </div>
          ))}
        </div>
        <div style={{
          marginTop:'12px', padding:'12px 16px',
          background: application.commitment_confirmed ? '#d8ede4' : '#f5e0e3',
          border:`1px solid ${application.commitment_confirmed ? '#2d6a4f' : '#9b2335'}`,
          borderRadius:'6px', fontSize:'13px', fontWeight:'600',
          color: application.commitment_confirmed ? '#2d6a4f' : '#9b2335'
        }}>
          {application.commitment_confirmed ? '✓' : '✕'} Participant Commitment Confirmed
        </div>
      </div>

      {/* Official Use — LDC sees amount + notes, Admin sees status */}
      {!isAdmin && (
        <div style={{
          ...sectionStyle,
          border:'1px solid #c49a3c', background:'#fdfaf0'
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
          background:'#fffef9', border:'1px solid #d4c9b0',
          borderRadius:'8px', padding:'16px 20px', marginBottom:'16px'
        }}>
          <div style={{
            fontSize:'11px', fontWeight:'700', color:'#6b5e4a',
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
                  background:'#dce9f5', color:'#1a4068',
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
          border:'2px solid #1a1610', background:'#1a1610'
        }}>
          <div style={{
            fontSize:'11px', fontWeight:'700', color:'#c49a3c',
            textTransform:'uppercase', letterSpacing:'0.6px',
            marginBottom:'14px', paddingBottom:'8px',
            borderBottom:'1px solid #3a3428'
          }}>
            Admin Decision
          </div>

          {/* Show LDC's official use info */}
          {(application.amount_approved || application.official_notes) && (
            <div style={{
              background:'#2e2a22', borderRadius:'6px',
              padding:'12px 16px', marginBottom:'16px'
            }}>
              <div style={{
                fontSize:'10px', color:'#a09080',
                textTransform:'uppercase', marginBottom:'8px'
              }}>
                LDC Submitted
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'
              }}>
                {application.amount_approved && (
                  <div>
                    <div style={{fontSize:'10px', color:'#a09080'}}>
                      Amount Requested
                    </div>
                    <div style={{
                      fontSize:'15px', fontWeight:'700', color:'#c49a3c'
                    }}>
                      LKR {parseFloat(application.amount_approved)
                        .toLocaleString('en-LK', {minimumFractionDigits:2})}
                    </div>
                  </div>
                )}
                {application.official_notes && (
                  <div>
                    <div style={{fontSize:'10px', color:'#a09080'}}>
                      LDC Notes
                    </div>
                    <div style={{fontSize:'12px', color:'#e8d4a0'}}>
                      {application.official_notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(!isEditingOfficial && (official.approval_status !== 'pending' || readOnly)) ? (
            <div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'16px'
              }}>
                <div>
                  <div style={{fontSize:'10px', color:'#a09080', textTransform:'uppercase', marginBottom:'4px', letterSpacing:'0.5px'}}>
                    Current Status
                  </div>
                  <div style={{display:'inline-block'}}>
                    {statusBadge(official.approval_status)}
                  </div>
                </div>
                {official.admin_notes && (
                  <div>
                    <div style={{fontSize:'10px', color:'#a09080', textTransform:'uppercase', marginBottom:'4px', letterSpacing:'0.5px'}}>
                      Admin Notes
                    </div>
                    <div style={{fontSize:'13px', color:'#e8d4a0', lineHeight:'1.5'}}>
                      {official.admin_notes}
                    </div>
                  </div>
                )}
              </div>
              
              {!readOnly && (
                <button 
                  onClick={() => setIsEditingOfficial(true)}
                  style={{
                    background:'transparent', color:'#c49a3c', 
                    border:'1px solid #4a4234', borderRadius:'6px',
                    padding:'6px 16px', fontSize:'12px', fontWeight:'600',
                    cursor:'pointer', fontFamily:'inherit'
                  }}
                >
                  Edit Decision
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={saveOfficial}>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:'14px', marginBottom:'14px'
              }}>
                <div>
                  <label style={{...labelStyle, color:'#a09080'}}>
                    Approval Status
                  </label>
                  <select style={{
                    ...inputStyle, background:'#2e2a22',
                    border:'1px solid #4a4234', color:'#f5edd8'
                  }}
                  value={official.approval_status}
                  onChange={e => setOfficial({
                    ...official, approval_status:e.target.value
                  })}>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label style={{...labelStyle, color:'#a09080'}}>
                    Admin Notes
                  </label>
                  <textarea style={{
                    ...inputStyle, background:'#2e2a22',
                    border:'1px solid #4a4234', color:'#f5edd8',
                    minHeight:'60px', resize:'vertical'
                  }}
                  placeholder="Enter rejection reason or internal comments..."
                  value={official.admin_notes}
                  onChange={e => setOfficial({
                    ...official, admin_notes:e.target.value
                  })} />
                </div>
              </div>
              <div style={{display:'flex', gap:'10px'}}>
                <button type="submit" disabled={savingOfficial} style={{
                  background: savingOfficial ? '#555' : '#c49a3c',
                  color:'#1a1610', border:'none', borderRadius:'6px',
                  padding:'10px 24px', fontSize:'13px', fontWeight:'700',
                  cursor: savingOfficial ? 'not-allowed' : 'pointer',
                  fontFamily:'inherit'
                }}>
                  {savingOfficial ? 'Saving...' : 'Save Decision'}
                </button>
                {isEditingOfficial && (
                  <button 
                    type="button"
                    onClick={() => setIsEditingOfficial(false)}
                    style={{
                      background:'transparent', color:'#a09080', 
                      border:'1px solid #4a4234', borderRadius:'6px',
                      padding:'10px 20px', fontSize:'13px', fontWeight:'600',
                      cursor:'pointer', fontFamily:'inherit'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}