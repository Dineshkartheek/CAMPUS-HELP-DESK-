import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../components/Icons.jsx';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  SectionCard,
  Spinner,
  StatCard,
  StatusBadge,
  PriorityBadge,
} from '../components/UI.jsx';
import { formatDateTime } from '../utils/format.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, ticketsData] = await Promise.all([
        api.tickets.stats(),
        api.tickets.myTickets({ page: 0, size: 5 }),
      ]);
      setStats(statsData);
      setRecent(ticketsData.content || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Student dashboard"
        title={`${greeting()}, ${user?.fullName?.split(' ')[0] || 'Student'}`}
        subtitle="Track your campus complaints and raise a new issue whenever you need support."
        actions={
          <Link to="/student/submit" className="btn btn-primary">
            <Icon name="plus" size={17} /> New complaint
          </Link>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      {loading && !stats ? (
        <div className="center-panel">
          <Spinner size={28} label="Loading your dashboard…" />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Total complaints" value={stats?.total ?? 0} icon="ticket" tone="navy" hint="All tickets you submitted" />
            <StatCard label="Open complaints" value={stats?.open ?? 0} icon="clock" tone="amber" hint="Awaiting resolution" />
            <StatCard label="In progress" value={stats?.inProgress ?? 0} icon="refresh" tone="blue" hint="Currently being handled" />
            <StatCard label="Resolved" value={stats?.resolved ?? 0} icon="checkCircle" tone="green" hint="Successfully resolved" />
          </div>

          <div className="dashboard-grid">
            <SectionCard
              title="Recent complaints"
              subtitle="Your five most recently submitted tickets."
              actions={
                <Link to="/student/tickets" className="btn btn-ghost btn-sm">
                  View all <Icon name="arrowRight" size={15} />
                </Link>
              }
              className="span-2"
              bodyClassName="flush"
            >
              {recent.length === 0 ? (
                <EmptyState
                  icon="ticket"
                  title="No complaints yet"
                  message="When something on campus needs attention, submit a complaint and track it here."
                  action={
                    <Link to="/student/submit" className="btn btn-primary">
                      <Icon name="plus" size={16} /> Submit your first complaint
                    </Link>
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Title</th>
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
                            <Link to={`/student/tickets/${ticket.id}`} className="ticket-number">
                              {ticket.ticketNumber}
                            </Link>
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
                            <Link to={`/student/tickets/${ticket.id}`} className="btn btn-ghost btn-xs">
                              View
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
              <SectionCard title="Quick actions">
                <div className="quick-actions">
                  <Link to="/student/submit" className="quick-action">
                    <span className="quick-icon"><Icon name="plus" size={19} /></span>
                    <span>
                      <strong>Submit complaint</strong>
                      <small>Report a new campus issue</small>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                  <Link to="/student/tickets" className="quick-action">
                    <span className="quick-icon"><Icon name="search" size={19} /></span>
                    <span>
                      <strong>Track complaints</strong>
                      <small>Search and filter your tickets</small>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                  <Link to="/student/profile" className="quick-action">
                    <span className="quick-icon"><Icon name="user" size={19} /></span>
                    <span>
                      <strong>My profile</strong>
                      <small>View account information</small>
                    </span>
                    <Icon name="chevronRight" size={16} />
                  </Link>
                </div>
              </SectionCard>

              <div className="help-card">
                <div className="help-card-icon">
                  <Icon name="headset" size={24} />
                </div>
                <h3>How ticket tracking works</h3>
                <p>
                  Every complaint moves through Submitted, Assigned, In Progress, Resolved and Closed.
                  You can see each change with its date and administrator remarks.
                </p>
                <div className="mini-statuses">
                  <StatusBadge status="SUBMITTED" />
                  <StatusBadge status="ASSIGNED" />
                  <StatusBadge status="IN_PROGRESS" />
                  <StatusBadge status="RESOLVED" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
