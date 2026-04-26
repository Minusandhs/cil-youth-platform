import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function UserDropdown({ label, actions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative hidden md:block" ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pr-4 border-r border-header-border text-text-on-dark cursor-pointer bg-transparent outline-none transition-colors"
        style={{fontFamily: 'inherit', borderTop: 'none', borderBottom: 'none', borderLeft: 'none', padding: 0}}
      >
        <div className="bg-header-tabs-bg p-1.5 rounded-full text-brand-accent-lt flex items-center justify-center">
          <User size={14} />
        </div>
        <span className="text-xs font-semibold whitespace-nowrap hover:text-white transition-colors">
          {label}
        </span>
        <div className="opacity-70 ml-1 hover:text-white transition-colors">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-2 top-full mt-3 w-48 bg-bg-card rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-border-subtle py-1 z-50 overflow-hidden">
          <ThemeDropdownItem />
          {actions.length > 0 && <div className="h-px bg-border-subtle my-1" />}
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setIsOpen(false);
                  action.onClick();
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors border-none bg-transparent outline-none ${
                  action.danger 
                    ? 'text-danger hover:bg-tint-danger' 
                    : 'text-text-heading hover:bg-bg-stripe'
                }`}
                style={{fontFamily: 'inherit', textAlign: 'left'}}
              >
                {Icon && <Icon size={16} className={action.danger ? 'text-danger' : 'text-text-subdued'} />}
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ThemeDropdownItem() {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === 'dark';

  return (
    <button
      onClick={(e) => {
        // Prevent closing dropdown if desired, or let it close. 
        // We'll just stop propagation so it doesn't close immediately,
        // or actually maybe we WANT it to not close so they see it switch.
        e.stopPropagation();
        toggle();
      }}
      className="w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors border-none bg-transparent outline-none text-text-heading hover:bg-bg-stripe"
      style={{fontFamily: 'inherit', textAlign: 'left'}}
    >
      <div className="flex items-center gap-3">
        {isDark ? <Moon size={16} className="text-text-subdued" /> : <Sun size={16} className="text-text-subdued" />}
        <span className="font-medium">Dark Mode</span>
      </div>
      {/* Toggle Switch Visual */}
      <div style={{
        width: '32px', height: '18px', borderRadius: '10px',
        background: isDark ? 'var(--color-brand-primary)' : 'var(--color-border-subtle)',
        position: 'relative', transition: 'background 0.2s'
      }}>
        <div style={{
          width: '14px', height: '14px', borderRadius: '50%',
          background: '#fff', position: 'absolute', top: '2px',
          left: isDark ? '16px' : '2px', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </div>
    </button>
  );
}
