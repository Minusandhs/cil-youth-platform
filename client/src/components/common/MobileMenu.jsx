import { useEffect } from 'react';
import { X, User } from 'lucide-react';

/**
 * A modern, industry-standard mobile drawer menu.
 *
 * @param {boolean} isOpen - Whether the menu is open
 * @param {function} onClose - Function to close the menu
 * @param {object} user - Current user object
 * @param {Array} tabs - Navigation tabs [{ id, label, icon: LucideIcon }]
 * @param {string} activeTab - Currently active tab ID
 * @param {function} onTabChange - Function to handle tab changes
 * @param {Array} userActions - Account actions [{ label, onClick, icon: LucideIcon, danger: boolean }]
 */
export default function MobileMenu({
  isOpen,
  onClose,
  user,
  tabs = [],
  activeTab,
  onTabChange,
  userActions = []
}) {
  // Lock body scroll and handle ESC key while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(26, 22, 16, 0.5)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          animation: 'cilBackdropIn 0.25s ease',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'relative',
        width: '80%',
        maxWidth: '300px',
        height: '100%',
        background: 'var(--color-brand-primary)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'cilMobileSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* User Header Section */}
        <div style={{
          padding: '24px 20px',
          background: 'var(--color-header-bg-deep)',
          borderBottom: '1px solid var(--color-header-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'var(--color-brand-accent)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-brand-primary)', fontWeight: '700', fontSize: '18px'
            }}>
              {user?.full_name?.charAt(0) || <User size={22} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                color: 'var(--color-brand-accent-lt)',
                fontSize: '15px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {user?.full_name || 'User'}
              </div>
              <div style={{
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '2px'
              }}>
                {user?.role?.replace(/_/g, ' ') || 'Guest'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--color-header-active-bg)',
              border: 'none',
              color: 'var(--color-brand-accent-lt)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Navigation Section */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{
            padding: '0 20px 8px',
            fontSize: '10px',
            fontWeight: '700',
            color: 'var(--color-text-nav-muted)',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            Navigation
          </div>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: 'calc(100% - 16px)',
                  margin: '0 8px',
                  textAlign: 'left',
                  padding: '11px 12px 11px 14px',
                  background: isActive ? 'rgba(196,154,60,0.12)' : 'transparent',
                  borderRadius: '8px',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--color-brand-accent)' : '3px solid transparent',
                  color: isActive ? 'var(--color-brand-accent)' : 'var(--color-text-muted)',
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                }}
              >
                {Icon && (
                  <div style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                )}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Account Actions Section */}
        <div style={{
          padding: '16px 0 24px',
          borderTop: '1px solid var(--color-header-border)',
          background: 'var(--color-header-bg-deep)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{
            padding: '0 20px 8px',
            fontSize: '10px',
            fontWeight: '700',
            color: 'var(--color-text-nav-muted)',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            Account
          </div>
          {userActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => { action.onClick(); onClose(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: 'calc(100% - 16px)',
                  margin: '0 8px',
                  textAlign: 'left',
                  padding: '11px 14px',
                  background: 'transparent',
                  borderRadius: '8px',
                  border: 'none',
                  color: action.danger ? 'var(--color-danger-lt)' : 'var(--color-text-muted)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-header-active-bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {Icon && (
                  <div style={{ flexShrink: 0, opacity: 0.7 }}>
                    <Icon size={18} />
                  </div>
                )}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes cilMobileSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes cilBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
