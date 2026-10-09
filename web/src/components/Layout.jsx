import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';
import { ToastHost } from './Toast';

const COLLAPSE_KEY = 'proshu.sidebar-collapsed';

function titleFor(pathname) {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/projects/')) return 'Project details';
  if (pathname.startsWith('/projects')) return 'Projects';
  if (pathname.startsWith('/tasks')) return 'My tasks';
  return 'PROSHU';
}

export function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  // Navigating from the mobile drawer must leave the drawer behind.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Sidebar
        collapsed={collapsed}
        open={drawerOpen}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        onNavigate={() => setDrawerOpen(false)}
      />

      {drawerOpen ? (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <div className={`main ${collapsed ? 'main--collapsed' : ''}`}>
        <header className="topbar">
          <button
            type="button"
            className="topbar__icon-button topbar__menu-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          {/* Location chrome, not the page heading: each page owns its own h1. */}
          <span className="topbar__title">{titleFor(location.pathname)}</span>
          <UserMenu />
        </header>

        <main className="content" id="main-content">
          <Outlet />
        </main>
      </div>

      <ToastHost />
    </div>
  );
}
