import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { Icon } from '../components/Icons.jsx';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  Pagination,
  PriorityBadge,
  SectionCard,
  Spinner,
  StatusBadge,
} from '../components/UI.jsx';
import { formatDateTime } from '../utils/format.js';

const STATUS_OPTIONS = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const EMPTY_FILTERS = { status: '', categoryId: '', priority: '', search: '' };

export default function MyTicketsPage() {
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.categories
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.tickets.myTickets({ ...applied, page, size: 8 });
      setData(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(0);
    setApplied({ ...filters });
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="My complaints"
        title="Complaint history"
        subtitle="Search, filter and open any complaint to see its complete status history."
        actions={
          <Link to="/student/submit" className="btn btn-primary">
            <Icon name="plus" size={17} /> New complaint
          </Link>
        }
      />

      <SectionCard className="filter-card" bodyClassName="filter-body">
        <form className="filter-form" onSubmit={applyFilters}>
          <div className="filter-search">
            <Icon name="search" size={17} />
            <input
              type="search"
              name="search"
              placeholder="Search ticket number or title…"
              value={filters.search}
              onChange={update}
            />
          </div>
          <select name="status" value={filters.status} onChange={update} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select name="categoryId" value={filters.categoryId} onChange={update} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="priority" value={filters.priority} onChange={update} aria-label="Filter by priority">
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary btn-sm">
            <Icon name="filter" size={15} /> Apply
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
            Reset
          </button>
        </form>
      </SectionCard>

      <ErrorBanner message={error} onRetry={load} />

      <SectionCard bodyClassName="flush">
        {loading ? (
          <div className="center-panel">
            <Spinner size={26} label="Loading complaints…" />
          </div>
        ) : data.content.length === 0 ? (
          <EmptyState
            icon="search"
            title="No complaints match your filters"
            message="Try a different search term, or reset the filters to see all your complaints."
            action={
              <button type="button" className="btn btn-outline" onClick={reset}>
                Reset filters
              </button>
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Complaint</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>
                        <Link to={`/student/tickets/${ticket.id}`} className="ticket-number">
                          {ticket.ticketNumber}
                        </Link>
                      </td>
                      <td>
                        <div className="table-title">{ticket.title}</div>
                        <span className="table-subtitle">{ticket.location}</span>
                      </td>
                      <td>{ticket.category?.name}</td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="nowrap">{formatDateTime(ticket.createdAt)}</td>
                      <td className="align-right">
                        <Link to={`/student/tickets/${ticket.id}`} className="btn btn-ghost btn-xs">
                          View <Icon name="chevronRight" size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={setPage}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
