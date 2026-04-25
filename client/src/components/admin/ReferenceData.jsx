import { useState } from 'react';
import SubjectManagement      from './SubjectManagement';
import GradeManagement        from './GradeManagement';
import SchoolGradeManagement  from './SchoolGradeManagement';
import CertTypeManagement     from './CertTypeManagement';

const SUB_TABS = [
  { id: 'subjects',      label: 'Subjects'        },
  { id: 'examgrades',    label: 'Exam Grades'     },
  { id: 'schoolgrades',  label: 'School Grades'   },
  { id: 'certtypes',     label: 'Cert Types'      },
];

export default function ReferenceData({ readOnly = false }) {
  const [active, setActive] = useState('subjects');

  return (
    <div>
      {/* Sub-tab bar — scrollable on mobile */}
      <div style={{
        display: 'flex', gap: '4px',
        borderBottom: '2px solid var(--color-divider)',
        marginBottom: '24px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {SUB_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: active === t.id
                ? '2px solid var(--color-brand-accent)' : '2px solid transparent',
              marginBottom: '-2px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: active === t.id ? '700' : '500',
              color: active === t.id ? 'var(--color-brand-accent)' : 'var(--color-text-subdued)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === 'subjects'     && <SubjectManagement     readOnly={readOnly} />}
      {active === 'examgrades'   && <GradeManagement       readOnly={readOnly} />}
      {active === 'schoolgrades' && <SchoolGradeManagement readOnly={readOnly} />}
      {active === 'certtypes'    && <CertTypeManagement    readOnly={readOnly} />}
    </div>
  );
}
