import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { Icon } from '../components/Icons.jsx';
import { EmptyState, ErrorBanner, PageHeader, SectionCard, Spinner, StatusBadge, PriorityBadge } from '../components/UI.jsx';
import { TicketComments, TicketDetails, TicketHistory, TicketSummary } from '../components/TicketParts.jsx';

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ticketData, historyData, commentData] = await Promise.all([
        api.tickets.get(id),
        api.tickets.history(id),
        api.tickets.comments(id),
      ]);
      setTicket(ticketData);
      setHistory(historyData);
      setComments(commentData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="center-panel">
        <Spinner size={28} label="Loading ticket details…" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page-stack">
        <Link to="/student/tickets" className="back-link">
          <Icon name="chevronLeft" size={16} /> Back to my complaints
        </Link>
        <ErrorBanner message={error || 'Ticket not found.'} onRetry={load} />
        <EmptyState
          icon="search"
          title="Ticket unavailable"
          message="The ticket may not exist, or you may not have permission to view it."
          action={
            <Link to="/student/tickets" className="btn btn-outline">
              Go to my complaints
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Link to="/student/tickets" className="back-link">
        <Icon name="chevronLeft" size={16} /> Back to my complaints
      </Link>

      <PageHeader
        eyebrow={ticket.ticketNumber}
        title={ticket.title}
        subtitle={`${ticket.category?.name} · ${ticket.location}`}
        actions={
          <div className="header-badges">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        }
      />

      <div className="detail-grid">
        <div className="detail-main">
          <SectionCard title="Complaint information">
            <TicketDetails ticket={ticket} />
          </SectionCard>

          <SectionCard
            title="Status history"
            subtitle="Every important status change is recorded automatically."
          >
            <TicketHistory history={history} />
          </SectionCard>

          <SectionCard
            title="Comments from campus support"
            subtitle="Read updates posted by the administrators handling your ticket."
          >
            <TicketComments comments={comments} />
          </SectionCard>
        </div>

        <aside className="detail-side">
          <SectionCard title="Ticket summary">
            <TicketSummary ticket={ticket} history={history} />
          </SectionCard>

          <div className="help-card help-card-compact">
            <div className="help-card-icon">
              <Icon name="headset" size={22} />
            </div>
            <h3>Need help?</h3>
            <p>
              Keep your ticket number <strong>{ticket.ticketNumber}</strong> ready when contacting the campus
              support desk about this complaint.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
