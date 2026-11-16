import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../components/Icons.jsx';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  PriorityBadge,
  SectionCard,
  Spinner,
  StatCard,
  StatusBadge,
} from '../components/UI.jsx';
import { formatDateTime } from '../utils/format.js';

export default function MainAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, tickets] = await Promise.all([
        api.mainAdmin.dashboard(),
        api.admin.tickets({ page: 0, size: 6 }),
      ]);
      setStats(dashboard);
      setRecent(tickets.content || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const distribution = [
    { label: 'Submitted', value: stats?.submitted ?? 0, tone: 'navy' },
    { label: 'Assigned', value: stats?.assigned ?? 0, tone: 'blue' },
    { label: 'In progress', value: stats?.inProgress ?? 0, tone: 'amber' },
    { label: 'Resolved', value: stats?.resolved ?? 0, tone: 'green' },
    { label: 'Closed', value: stats?.closed ?? 0, tone: 'slate' },
    { label: 'Rejected', value: stats?.rejected ?? 0, tone: 'red' },
  ];
  const maxCount = Math.max(1, ...distribution.map((item) => item.value));

  const modules = [
    {
      to: '/main-admin/users',
      icon: 'users',
      title: 'User management',
      text: 'Create administrators, search accounts and control access.',
      meta: `${stats?.totalStudents ?? 0} students · ${stats?.totalAdmins ?? 0} administrators`,
    },
    {
      to: '/main-admin/categories',
      icon: 'tag',
      title: 'Complaint categories',
      text: 'Add, edit and retire the categories students can choose.',
      meta: `${stats?.totalCategories ?? 0} configured categories`,
    },
    {
      to: '/main-admin/reports',
      icon: 'chart',
      title: 'Reports & export',
      text: 'Review ticket trends, administrator performance and CSV reports.',
      meta: 'Confidential · Main Admin only',
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Main Administrator"
        title={`Institution overview`}
        subtitle={`Signed in as ${user?.fullName || 'Main Administrator'} · full control of users, categories and reporting.`}
        actions={
          <button type="button" className="btn btn-outline" onClick={load}>
            <Icon name="refresh" size={16} /> Refresh data
          </button>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      {loading && !stats ? (
        <div className="center-panel">
          <Spinner size={28} label="Loading institution overview…" />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total tickets"
              value={stats?.total ?? 0}
              icon="ticket"
              tone="navy"
              hint="Every complaint in the help desk"
            />
            <StatCard
              label="Registered students"
              value={stats?.totalStudents ?? 0}
              icon="user"
              tone="blue"
              hint="Active and inactive student accounts"
            />
            <StatCard
              label="Administrators"
              value={stats?.totalAdmins ?? 0}
              icon="users"
              tone="green"
              hint="Support staff accounts"
            />
            <StatCard
              label="Categories"
              value={stats?.totalCategories ?? 0}
              icon="tag"
              tone="amber"
              hint="Complaint categories configured"
            />
          </div>

          <div className="dashboard-grid">
            <SectionCard
              title="Latest campus activity"
              subtitle="The six most recent complaints raised by students."
              className="span-2"
              bodyClassName="flush"
              actions={
                <Link to="/main-admin/tickets" className="btn btn-ghost btn-sm">
                  Open ticket queue <Icon name="arrowRight" size={15} />
                </Link>
              }
            >
              {recent.length === 0 ? (
                <EmptyState
                  icon="ticket"
                  title="No tickets yet"
                  message="Student complaints will appear here once they are submitted."
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Student</th>
                        <th>Complaint</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>
                            <Link to={`/main-admin/tickets/${ticket.id}`} className="ticket-number">
                              {ticket.ticketNumber}
                            </Link>
                          </td>
                          <td>
                            <div className="table-title">{ticket.student?.fullName}</div>
                            <span className="table-subtitle">{ticket.student?.email}</span>
                          </td>
                          <td>
                            <div className="table-title">{ticket.title}</div>
                            <span className="table-subtitle">{ticket.category?.name}</span>
                          </td>
                          <td>
                            <PriorityBadge priority={ticket.priority} />
                          </td>
                          <td>
                            <StatusBadge status={ticket.status} />
                          </td>
                          <td className="nowrap">{formatDateTime(ticket.createdAt)}</td>
                          <td className="align-right">
                            <Link to={`/main-admin/tickets/${ticket.id}`} className="btn btn-ghost btn-xs">
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <div className="side-stack">
              <SectionCard title="Ticket distribution">
                <div className="bar-list">
                  {distribution.map((item) => (
                    <div key={item.label} className="bar-row">
                      <div className="bar-meta">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <div className="bar-track">
                        <div
                          className={`bar-fill tone-${item.tone}`}
                          style={{ width: `${Math.round((item.value / maxCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Attention required">
                <div className="attention-list">
                  <div>
                    <span className="attention-icon tone-amber">
                      <Icon name="clock" size={18} />
                    </span>
                    <div>
                      <strong>{stats?.unassigned ?? 0} unassigned</strong>
                      <small>Tickets waiting for an administrator</small>
                    </div>
                  </div>
                  <div>
                    <span className="attention-icon tone-red">
                      <Icon name="alert" size={18} />
                    </span>
                    <div>
                      <strong>{stats?.urgent ?? 0} urgent</strong>
                      <small>Complaints marked urgent priority</small>
                    </div>
                  </div>
                  <div>
                    <span className="attention-icon tone-green">
                      <Icon name="checkCircle" size={18} />
                    </span>
                    <div>
                      <strong>{stats?.resolved ?? 0} resolved</strong>
                      <small>Completed resolutions on record</small>
                    </div>
                  </div>
                </div>
                <Link to="/main-admin/reports" className="btn btn-primary btn-block">
                  View confidential reports <Icon name="arrowRight" size={16} />
                </Link>
              </SectionCard>
            </div>
          </div>

          <SectionCard
            title="Administration modules"
            subtitle="Main Administrator tools for running the campus help desk."
          >
            <div className="module-grid">
              {modules.map((module) => (
                <Link key={module.to} to={module.to} className="module-card">
                  <span className="module-icon">
                    <Icon name={module.icon} size={22} />
                  </span>
                  <div>
                    <strong>{module.title}</strong>
                    <p>{module.text}</p>
                    <small>{module.meta}</small>
                  </div>
                  <Icon name="chevronRight" size={17} />
                </Link>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
