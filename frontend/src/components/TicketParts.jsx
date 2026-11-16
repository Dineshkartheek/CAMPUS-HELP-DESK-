import { Icon } from './Icons.jsx';
import { EmptyState, PriorityBadge, RoleBadge, StatusBadge } from './UI.jsx';
import { formatDateTime, initials, titleCase } from '../utils/format.js';

const FLOW = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export function TicketDetails({ ticket }) {
  return (
    <div className="ticket-detail-body">
      <div className="ticket-description">
        <h3>Complaint description</h3>
        <p>{ticket.description}</p>
      </div>

      <div className="meta-grid">
        <div>
          <span>Category</span>
          <strong>{ticket.category?.name || '—'}</strong>
        </div>
        <div>
          <span>Campus location</span>
          <strong>{ticket.location}</strong>
        </div>
        <div>
          <span>Priority</span>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <div>
          <span>Submitted</span>
          <strong>{formatDateTime(ticket.createdAt)}</strong>
        </div>
        <div>
          <span>Last updated</span>
          <strong>{formatDateTime(ticket.updatedAt)}</strong>
        </div>
        <div>
          <span>Resolved</span>
          <strong>{ticket.resolvedAt ? formatDateTime(ticket.resolvedAt) : 'Not yet'}</strong>
        </div>
      </div>

      {ticket.adminRemarks && (
        <div className="remarks-box">
          <div className="remarks-head">
            <Icon name="info" size={17} /> Administrator remarks
          </div>
          <p>{ticket.adminRemarks}</p>
        </div>
      )}

      {(ticket.aiSuggestedCategory || ticket.aiSummary) && (
        <div className="ai-panel ai-panel-muted">
          <div className="ai-panel-header">
            <span className="ai-label">
              <Icon name="sparkles" size={16} /> AI suggestion stored with this ticket
            </span>
            <span className="badge badge-neutral">Reference only</span>
          </div>
          <div className="ai-grid">
            <div>
              <span>Suggested category</span>
              <strong>{ticket.aiSuggestedCategory || '—'}</strong>
            </div>
            <div>
              <span>Suggested priority</span>
              <strong>{titleCase(ticket.aiSuggestedPriority) || '—'}</strong>
            </div>
            <div>
              <span>Suggested department</span>
              <strong>{ticket.aiSuggestedDepartment || '—'}</strong>
            </div>
          </div>
          {ticket.aiSummary && <p className="ai-summary">“{ticket.aiSummary}”</p>}
        </div>
      )}
    </div>
  );
}

export function TicketSummary({ ticket, history = [] }) {
  const currentIndex = FLOW.indexOf(ticket.status);
  const rejected = ticket.status === 'REJECTED';

  const historyFor = (status) => history.find((entry) => entry.toStatus === status);

  return (
    <div className="summary-panel">
      <div className="summary-status">
        <span>Current status</span>
        <StatusBadge status={ticket.status} />
      </div>

      {rejected ? (
        <div className="rejected-note">
          <Icon name="alert" size={18} />
          <div>
            <strong>This complaint was rejected</strong>
            <p>Read the administrator remarks for the reason. You can contact campus support for clarification.</p>
          </div>
        </div>
      ) : (
        <ol className="status-flow">
          {FLOW.map((status, index) => {
            const entry = historyFor(status);
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
            return (
              <li key={status} className={`status-flow-item ${state}`}>
                <span className="status-flow-dot">
                  {state === 'done' ? <Icon name="check" size={12} /> : <span />}
                </span>
                <div>
                  <strong>{titleCase(status)}</strong>
                  <small>{entry ? formatDateTime(entry.changedAt) : index > currentIndex ? 'Pending' : ''}</small>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="summary-assignee">
        <span>Assigned administrator</span>
        {ticket.assignedAdmin ? (
          <div className="assignee-row">
            <div className="avatar avatar-sm">{initials(ticket.assignedAdmin.fullName)}</div>
            <div>
              <strong>{ticket.assignedAdmin.fullName}</strong>
              <small>{ticket.assignedAdmin.department || 'Campus support'}</small>
            </div>
          </div>
        ) : (
          <p className="muted-text">Not assigned yet. The support team will assign an administrator.</p>
        )}
      </div>

      <div className="summary-student">
        <span>Submitted by</span>
        <strong>{ticket.student?.fullName}</strong>
        <small>{ticket.student?.email}</small>
      </div>
    </div>
  );
}

export function TicketHistory({ history }) {
  if (!history?.length) {
    return <EmptyState icon="clock" title="No history yet" message="Status changes will appear here." />;
  }

  return (
    <ol className="history-list">
      {history.map((entry) => (
        <li key={entry.id} className="history-item">
          <span className="history-dot" />
          <div className="history-content">
            <div className="history-head">
              <div className="history-statuses">
                {entry.fromStatus && (
                  <>
                    <StatusBadge status={entry.fromStatus} />
                    <Icon name="arrowRight" size={14} />
                  </>
                )}
                <StatusBadge status={entry.toStatus} />
              </div>
              <time>{formatDateTime(entry.changedAt)}</time>
            </div>
            {entry.remarks && <p>{entry.remarks}</p>}
            <small>
              Changed by {entry.changedBy?.fullName || 'System'}
              {entry.changedBy?.role ? ` · ${titleCase(entry.changedBy.role)}` : ''}
            </small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TicketComments({ comments }) {
  if (!comments?.length) {
    return (
      <EmptyState
        icon="mail"
        title="No comments yet"
        message="Messages from the campus support team will appear here."
      />
    );
  }

  return (
    <div className="comments-list">
      {comments.map((comment) => (
        <article key={comment.id} className="comment">
          <div className="avatar avatar-sm">{initials(comment.author?.fullName)}</div>
          <div className="comment-body">
            <div className="comment-head">
              <strong>{comment.author?.fullName}</strong>
              <RoleBadge role={comment.author?.role} />
              <time>{formatDateTime(comment.createdAt)}</time>
            </div>
            <p>{comment.message}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
