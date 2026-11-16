import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from './Icons.jsx';
import { initials, roleLabel } from '../utils/format.js';

const NAVIGATION = {
  STUDENT: [
    { section: 'Workspace' },
    { to: '/student', label: 'Dashboard', icon: 'home', end: true },
    { to: '/student/submit', label: 'New complaint', icon: 'plus' },
    { to: '/student/tickets', label: 'My complaints', icon: 'ticket' },
    { section: 'Account' },
    { to: '/student/profile', label: 'My profile', icon: 'user' },
  ],
  ADMIN: [
    { section: 'Workspace' },
    { to: '/admin', label: 'Dashboard', icon: 'home', end: true },
    { to: '/admin/tickets', label: 'Ticket management', icon: 'ticket' },
    { section: 'Account' },
    { to: '/admin/profile', label: 'My profile', icon: 'user' },
  ],
  MAIN_ADMIN: [
    { section: 'Administration' },
    { to: '/main-admin', label: 'Main dashboard', icon: 'home', end: true },
    { to: '/main-admin/tickets', label: 'All tickets', icon: 'ticket' },
    { to: '/main-admin/users', label: 'User management', icon: 'users' },
    { to: '/main-admin/categories', label: 'Categories', icon: 'tag' },
    { to: '/main-admin/reports', label: 'Reports', icon: 'chart' },
    { section: 'Account' },
    { to: '/main-admin/profile', label: 'My profile', icon: 'user' },
  ],
};

const PAGE_TITLES = [
  [/^\/student$/, 'Student dashboard'],
  [/^\/student\/submit$/, 'Submit a complaint'],
  [/^\/student\/tickets\/[^/]+$/, 'Ticket details'],
  [/^\/student\/tickets$/, 'My complaints'],
  [/^\/student\/profile$/, 'My profile'],
  [/^\/admin$/, 'Administrator dashboard'],
  [/^\/admin\/tickets\/[^/]+$/, 'Ticket details'],
  [/^\/admin\/tickets$/, 'Ticket management'],
  [/^\/admin\/profile$/, 'My profile'],
  [/^\/main-admin$/, 'Main administrator dashboard'],
  [/^\/main-admin\/tickets\/[^/]+$/, 'Ticket details'],
  [/^\/main-admin\/tickets$/, 'Ticket management'],
  [/^\/main-admin\/users$/, 'User management'],
  [/^\/main-admin\/categories$/, 'Complaint categories'],
  [/^\/main-admin\/reports$/, 'Campus support reports'],
  [/^\/main-admin\/profile$/, 'My profile'],
];

function pageTitle(pathname) {
  const match = PAGE_TITLES.find(([pattern]) => pattern.test(pathname));
  return match ? match[1] : 'CampusCare';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.title = `${pageTitle(location.pathname)} | CampusCare`;
  }, [location.pathname]);

  const navItems = NAVIGATION[user?.role] || NAVIGATION.STUDENT;
  const title = pageTitle(location.pathname);

  const handleLogout = () => {
    logout();
    toast.info('You have been signed out.');
    navigate('/');
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Icon name="headset" size={23} />
          </div>
          <div>
            <div className="brand-name">CampusCare</div>
            <div className="brand-subtitle">Smart Help Desk</div>
          </div>
          <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item, index) =>
            item.section ? (
              <div key={`section-${index}`} className="nav-section-label">
                {item.section}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon name={item.icon} size={18} />
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-portal">
            <Icon name="shield" size={16} />
            <span>{roleLabel(user?.role)} portal</span>
          </div>
          <p>Centurion University of Technology and Management</p>
          <span className="version-tag">CampusCare v1.0</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button
            type="button"
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Icon name="menu" size={21} />
          </button>

          <div className="topbar-heading">
            <span className="topbar-eyebrow">{roleLabel(user?.role)} workspace</span>
            <h1>{title}</h1>
          </div>

          <div className="topbar-actions">
            <span className="secure-pill">
              <Icon name="shield" size={14} /> Secure session
            </span>
            <div className="user-chip">
              <div className="avatar">{initials(user?.fullName)}</div>
              <div className="user-meta">
                <strong>{user?.fullName}</strong>
                <span>{roleLabel(user?.role)}</span>
              </div>
            </div>
            <button type="button" className="icon-button" onClick={handleLogout} title="Sign out" aria-label="Sign out">
              <Icon name="logout" size={19} />
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} CampusCare · Centurion University</span>
          <span>Smart Campus Help Desk Management System</span>
        </footer>
      </div>
    </div>
  );
}
