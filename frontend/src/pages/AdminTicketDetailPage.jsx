import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import {
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  PriorityBadge,
  SectionCard,
  Spinner,
  StatusBadge,
} from '../components/UI.jsx';
import { TicketComments, TicketDetails, TicketHistory, TicketSummary } from '../components/TicketParts.jsx';
import { titleCase } from '../utils/format.js';

const TRANSITIONS = {
  SUBMITTED: ['ASSIGNED', 'IN_PROGRESS', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'RESOLVED', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['IN_PROGRESS'],
  REJECTED: ['ASSIGNED', 'IN_PROGRESS'],
};

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const basePath = user?.role === 'MAIN_ADMIN' ? '/main-admin' : '/admin';

  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [assignForm, setAssignForm] = useState({ adminId: '', note: '' });
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '' });
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [ticketData, historyData, commentData, adminData] = await Promise.all([
        api.admin.ticket(id),
        api.tickets.history(id),
        api.tickets.comments(id),
        api.admin.admins(),
      ]);
      setTicket(ticketData);
      setHistory(historyData);
      setComments(commentData);
      setAdmins(adminData);
      setAssignForm({
        adminId: ticketData.assignedAdmin?.id ? String(ticketData.assignedAdmin.id) : '',
        note: '',
      });
      setStatusForm({ status: '', remarks: '' });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const nextStatuses = useMemo(
    () => (ticket ? TRANSITIONS[ticket.status] || [] : []),
    [ticket],
  );

  const handleAssign = async (event) => {
    event.preventDefault();
    if (!assignForm.adminId) {
      toast.warning('Select an administrator to assign this ticket.');
      return;
    }
    setBusy('assign');
    try {
      await api.admin.assign(id, {
        adminId: Number(assignForm.adminId),
        note: assignForm.note.trim() || undefined,
      });
      toast.success('Ticket assigned successfully.');
      await load();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setBusy('');
    }
  };

  const handleStatus = async (event) => {
    event.preventDefault();
    if (!statusForm.status) {
      toast.warning('Select the new status.');
      return;
    }
    setBusy('status');
    try {
      await api.admin.updateStatus(id, {
        status: statusForm.status,
        remarks: statusForm.remarks.trim() || undefined,
      });
      toast.success(`Ticket updated to ${titleCase(statusForm.status)}.`);
      await load();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setBusy('');
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) {
      toast.warning('Write a comment before posting.');
      return;
    }
    setBusy('comment');
    try {
      await api.admin.addComment(id, { message: commentText.trim() });
      setCommentText('');
      toast.success('Comment posted to the ticket.');
      await load();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setBusy('');
    }
  };

  if (loading) {
    return (
      <div className="center-panel">
        <Spinner size={28} label="Loading ticket management view…" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page-stack">
        <Link to={`${basePath}/tickets`} className="back-link">
          <Icon name="chevronLeft" size={16} /> Back to ticket queue
        </Link>
        <ErrorBanner message={error || 'Ticket not found.'} onRetry={load} />
        <EmptyState
          icon="search"
          title="Ticket unavailable"
          message="The ticket may have been removed, or the API could not be reached."
          action={
            <Link to={`${basePath}/tickets`} className="btn btn-outline">
              Return to ticket queue
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Link to={`${basePath}/tickets`} className="back-link">
        <Icon name="chevronLeft" size={16} /> Back to ticket queue
      </Link>

      <PageHeader
        eyebrow={ticket.ticketNumber}
        title={ticket.title}
        subtitle={`${ticket.student?.fullName} · ${ticket.student?.email}`}
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

          <SectionCard title="Status history" subtitle="Audit trail for every status change.">
            <TicketHistory history={history} />
          </SectionCard>

          <SectionCard title="Conversation" subtitle="Comments are visible to the student and support team.">
            <TicketComments comments={comments} />
            <form className="comment-form" onSubmit={handleComment}>
              <Field label="Add a comment">
                <textarea
                  rows={3}
                  maxLength={2000}
                  placeholder="Post an update for the student…"
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                />
              </Field>
              <div className="align-right">
                <button type="submit" className="btn btn-primary btn-sm" disabled={busy === 'comment'}>
                  <Icon name="mail" size={15} /> {busy === 'comment' ? 'Posting…' : 'Post comment'}
                </button>
              </div>
            </form>
          </SectionCard>
        </div>

        <aside className="detail-side">
          <SectionCard title="Ticket summary">
            <TicketSummary ticket={ticket} history={history} />
          </SectionCard>

          <SectionCard title="Assign administrator" subtitle="Only active administrators can be assigned.">
            <form className="form-stack" onSubmit={handleAssign}>
              <Field label="Administrator" required>
                <select
                  value={assignForm.adminId}
                  onChange={(event) => setAssignForm((current) => ({ ...current, adminId: event.target.value }))}
                >
                  <option value="">Select an administrator</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.fullName} {admin.role === 'MAIN_ADMIN' ? '(Main Admin)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assignment note" hint="Optional note for the administrator.">
                <input
                  type="text"
                  maxLength={255}
                  placeholder="Example: Please inspect the HDMI cable"
                  value={assignForm.note}
                  onChange={(event) => setAssignForm((current) => ({ ...current, note: event.target.value }))}
                />
              </Field>
              <button type="submit" className="btn btn-primary btn-block" disabled={busy === 'assign'}>
                <Icon name="users" size={16} /> {busy === 'assign' ? 'Assigning…' : 'Assign ticket'}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Update status" subtitle="Only valid workflow transitions are offered.">
            {nextStatuses.length === 0 ? (
              <p className="muted-text">No further status transitions are available for this ticket.</p>
            ) : (
              <form className="form-stack" onSubmit={handleStatus}>
                <Field label="New status" required>
                  <select
                    value={statusForm.status}
                    onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}
                  >
                    <option value="">Select the next status</option>
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {titleCase(status)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Administrator remarks" hint="These remarks are visible to the student.">
                  <textarea
                    rows={3}
                    maxLength={2000}
                    placeholder="Explain the update or resolution…"
                    value={statusForm.remarks}
                    onChange={(event) => setStatusForm((current) => ({ ...current, remarks: event.target.value }))}
                  />
                </Field>
                <button type="submit" className="btn btn-primary btn-block" disabled={busy === 'status'}>
                  <Icon name="checkCircle" size={16} /> {busy === 'status' ? 'Updating…' : 'Update ticket status'}
                </button>
              </form>
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
