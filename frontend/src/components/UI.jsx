import { Icon } from './Icons.jsx';
import { titleCase } from '../utils/format.js';

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon = 'ticket', tone = 'navy' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">
        <Icon name={icon} size={22} />
      </div>
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? '—'}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const value = (status || '').toLowerCase();
  return <span className={`badge status-${value}`}>{titleCase(status)}</span>;
}

export function PriorityBadge({ priority }) {
  const value = (priority || '').toLowerCase();
  return <span className={`badge priority-${value}`}>{titleCase(priority)}</span>;
}

export function RoleBadge({ role }) {
  const value = (role || '').toLowerCase();
  return <span className={`badge role-${value}`}>{titleCase(role)}</span>;
}

export function Spinner({ size = 20, label }) {
  return (
    <span className="spinner-wrap" role="status" aria-label={label || 'Loading'}>
      <span className="spinner" style={{ width: size, height: size }} />
      {label && <span className="spinner-label">{label}</span>}
    </span>
  );
}

export function LoadingScreen({ label = 'Loading your workspace…' }) {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <Icon name="headset" size={30} />
      </div>
      <Spinner size={26} />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ icon = 'ticket', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={30} />
      </div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}

export function Pagination({ page, totalPages, totalElements, onPageChange }) {
  if (totalElements === 0) return null;
  return (
    <div className="pagination">
      <span className="pagination-info">
        Page {page + 1} of {Math.max(totalPages, 1)} · {totalElements} record{totalElements === 1 ? '' : 's'}
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
        >
          <Icon name="chevronLeft" size={16} /> Previous
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page + 1 >= totalPages}
        >
          Next <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  );
}

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <label className={`form-field ${error ? 'has-error' : ''} ${className}`.trim()}>
      {label && (
        <span className="field-label">
          {label}
          {required && <span className="required">*</span>}
        </span>
      )}
      {children}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function SectionCard({ title, subtitle, actions, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className={`card-body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <Icon name="alert" size={18} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={15} /> Retry
        </button>
      )}
    </div>
  );
}

export function InfoNote({ children, tone = 'info', icon = 'info' }) {
  return (
    <div className={`info-note note-${tone}`}>
      <Icon name={icon} size={17} />
      <div>{children}</div>
    </div>
  );
}
