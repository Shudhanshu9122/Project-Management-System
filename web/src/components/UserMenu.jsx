import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function initials(fullName) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Any click outside the panel closes it, which is what a menu should do.
  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="topbar__icon-button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        style={{ width: 'auto', gap: 8, padding: '0 10px', display: 'flex', alignItems: 'center' }}
      >
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--ink)',
            color: 'var(--ink-on-ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            fontWeight: 500,
            letterSpacing: '0.04em',
          }}
          aria-hidden="true"
        >
          {initials(user.fullName)}
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 258,
            padding: 8,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 40,
          }}
        >
          <div style={{ padding: '10px 12px' }}>
            <p style={{ fontWeight: 600 }}>{user.fullName}</p>
            <p className="muted" style={{ fontSize: 'var(--text-xs)', wordBreak: 'break-all' }}>
              {user.email}
            </p>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '6px 0' }} />

          <button
            type="button"
            role="menuitem"
            className="nav-link"
            onClick={() => {
              toggleTheme();
              setOpen(false);
            }}
          >
            {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>

          <button type="button" role="menuitem" className="nav-link" onClick={() => setOpen(false)}>
            <UserRound size={17} aria-hidden="true" />
            Signed in
          </button>

          <button
            type="button"
            role="menuitem"
            className="nav-link"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={17} aria-hidden="true" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
