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

export default function AdminDashboard() {
  const { user } = useAuth();
  const basePath = user?.role === 'MAIN_ADMIN' ? '/main-admin' : '/admin';

  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, tickets] = await Promise.all([
        api.admin.dashboard(),
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

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Administrator dashboard"
        title={`Welcome, ${user?.fullName?.split(' ')[0] || 'Administrator'}`}
        subtitle="Monitor the ticket queue, identify urgent complaints and keep resolutions moving."
        actions={
          <button type="button" className="btn btn-outline" onClick={load}>
            <Icon name="refresh" size={16} /> Refresh data
          </button>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      {loading && !stats ? (
        <div className="center-panel">
          <Spinner size={28} label="Loading help desk statistics…" />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Total tickets" value={stats?.total ?? 0} icon="ticket" tone="navy" hint="All complaints in the system" />
            <StatCard label="Awaiting assignment" value={stats?.submitted ?? 0} icon="clock" tone="amber" hint="Newly submitted complaints" />
            <StatCard label="In progress" value={stats?.inProgress ?? 0} icon="refresh" tone="blue" hint="Being handled by staff" />
            <StatCard label="Resolved" value={stats?.resolved ?? 0} icon="checkCircle" tone="green" hint="Awaiting student confirmation" />
          </div>

          <div className="dashboard-grid">
            <SectionCard
              title="Recent ticket activity"
              subtitle="The latest complaints submitted by students."
              className="span-2"
              bodyClassName="flush"
              actions={
                <Link to={`${basePath}/tickets`} className="btn btn-ghost btn-sm">
                  Manage all tickets <Icon name="arrowRight" size={15} />
                </Link>
              }
            >
              {recent.length === 0 ? (
                <EmptyState
                  icon="ticket"
                  title="No tickets yet"
                  message="Student complaints will appear here as soon as they are submitted."
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
                            <Link to={`${basePath}/tickets/${ticket.id}`} className="ticket-number">
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
                            <Link to={`${basePath}/tickets/${ticket.id}`} className="btn btn-ghost btn-xs">
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

              <SectionCard title="Priority attention">
                <div className="attention-list">
                  <div>
                    <span className="attention-icon tone-amber"><Icon name="clock" size={18} /></span>
                    <div>
                      <strong>{stats?.unassigned ?? 0} unassigned</strong>
                      <small>New tickets waiting for an administrator</small>
                    </div>
                  </div>
                  <div>
                    <span className="attention-icon tone-red"><Icon name="alert" size={18} /></span>
                    <div>
                      <strong>{stats?.urgent ?? 0} urgent</strong>
                      <small>Complaints marked with urgent priority</small>
                    </div>
                  </div>
                  <div>
                    <span className="attention-icon tone-green"><Icon name="users" size={18} /></span>
                    <div>
                      <strong>{stats?.totalStudents ?? 0} students</strong>
                      <small>Registered student accounts</small>
                    </div>
                  </div>
                </div>
                <Link to={`${basePath}/tickets`} className="btn btn-primary btn-block">
                  Open ticket queue <Icon name="arrowRight" size={16} />
                </Link>
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
