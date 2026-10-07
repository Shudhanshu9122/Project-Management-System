import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, FolderKanban, LayoutDashboard, ListChecks } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My tasks', icon: ListChecks },
];

export function Sidebar({ collapsed, open, onToggleCollapse, onNavigate }) {
  const classes = ['sidebar'];
  if (collapsed) classes.push('sidebar--collapsed');
  if (open) classes.push('sidebar--open');

  return (
    <aside className={classes.join(' ')} aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2v6" />
            <path d="m5 9 7 3 7-3" />
            <path d="m5 15 7 3 7-3" />
            <path d="M5 9v6" />
            <path d="M19 9v6" />
            <path d="M12 8v10" />
          </svg>
        </span>
        {collapsed ? null : <span className="sidebar__wordmark">Northstar</span>}
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={19} aria-hidden="true" />
            {collapsed ? <span className="visually-hidden">{item.label}</span> : item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button type="button" className="sidebar__collapse" onClick={onToggleCollapse}>
          {collapsed ? (
            <ChevronsRight size={18} aria-hidden="true" />
          ) : (
            <ChevronsLeft size={18} aria-hidden="true" />
          )}
          {collapsed ? <span className="visually-hidden">Expand sidebar</span> : 'Collapse'}
        </button>
      </div>
    </aside>
  );
}
