import { NavLink, Link } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, FolderKanban, LayoutDashboard, ListChecks, Plus } from 'lucide-react';
import { api } from '../api/client';
import { useFetch } from '../hooks/useFetch';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/tasks', label: 'My tasks', icon: ListChecks },
];

const DESK_PROJECTS = 6;

export function Sidebar({ collapsed, open, onToggleCollapse, onNavigate }) {
  const projects = useFetch(
    (signal) => api.get(`/projects?limit=${DESK_PROJECTS}&sort=name`, { signal }),
    []
  );
  const tasks = useFetch((signal) => api.get('/tasks?limit=1', { signal }), []);

  const classes = ['sidebar'];
  if (collapsed) classes.push('sidebar--collapsed');
  if (open) classes.push('sidebar--open');

  const taskTotal = tasks.data ? tasks.data.meta.total : null;
  const projectList = projects.data ? projects.data.data : [];

  return (
    <aside className={classes.join(' ')} aria-label="Main navigation">
      <div className="sidebar__brand">
        <span className="sidebar__logo" aria-hidden="true">
          P
        </span>
        {collapsed ? null : <span className="sidebar__wordmark">Proshu</span>}
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
            <item.icon size={17} aria-hidden="true" />
            {collapsed ? <span className="visually-hidden">{item.label}</span> : item.label}
            {item.to === '/tasks' && taskTotal !== null ? (
              <span className="nav-link__count">{taskTotal}</span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {collapsed || projectList.length === 0 ? null : (
        <>
          <p className="sidebar__section-label">On the desk</p>
          <div className="sidebar__projects">
            {projectList.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="sidebar__project"
                onClick={onNavigate}
                title={project.name}
              >
                <span>{project.name}</span>
              </Link>
            ))}
            <Link to="/projects" className="sidebar__add" onClick={onNavigate}>
              <Plus size={14} aria-hidden="true" />
              New project
            </Link>
          </div>
        </>
      )}

      <div className="sidebar__footer">
        <button type="button" className="sidebar__collapse" onClick={onToggleCollapse}>
          {collapsed ? (
            <>
              <ChevronsRight size={16} aria-hidden="true" />
              <span className="visually-hidden">Expand sidebar</span>
            </>
          ) : (
            <>
              <ChevronsLeft size={16} aria-hidden="true" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
