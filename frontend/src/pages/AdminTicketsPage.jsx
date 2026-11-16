import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
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
const EMPTY_FILTERS = {
  search: '',
  status: '',
  categoryId: '',
  priority: '',
  assignedAdminId: '',
  from: '',
  to: '',
};

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const basePath = user?.role === 'MAIN_ADMIN' ? '/main-admin' : '/admin';

  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0, page: 0 });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.admin.categories(), api.admin.admins()])
      .then(([categoryData, adminData]) => {
        setCategories(categoryData);
        setAdmins(adminData);
      })
      .catch(() => {
        // Filters still work with text/status options; ignore list errors here.
      });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.admin.tickets({ ...applied, page, size: 10 });
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

  const exportCsv = async () => {
    setExporting(true);
    try {
      await api.admin.exportTickets(applied);
      toast.success('Ticket report exported successfully.');
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Ticket management"
        title="Campus complaint queue"
        subtitle="Search, filter, assign and update every ticket in the help desk."
        actions={
          <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={exporting}>
            <Icon name="download" size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />

      <SectionCard className="filter-card" bodyClassName="filter-body">
        <form className="filter-form filter-form-grid" onSubmit={applyFilters}>
          <div className="filter-search">
            <Icon name="search" size={17} />
            <input
              type="search"
              name="search"
              placeholder="Search ticket, student or title…"
              value={filters.search}
              onChange={update}
            />
          </div>
          <select name="status" value={filters.status} onChange={update} aria-label="Status">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select name="categoryId" value={filters.categoryId} onChange={update} aria-label="Category">
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select name="priority" value={filters.priority} onChange={update} aria-label="Priority">
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <select name="assignedAdminId" value={filters.assignedAdminId} onChange={update} aria-label="Assigned administrator">
            <option value="">All administrators</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.fullName}
              </option>
            ))}
          </select>
          <label className="date-filter">
            <span>From</span>
            <input type="date" name="from" value={filters.from} onChange={update} />
          </label>
          <label className="date-filter">
            <span>To</span>
            <input type="date" name="to" value={filters.to} onChange={update} />
          </label>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              <Icon name="filter" size={15} /> Apply
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
              Reset
            </button>
          </div>
        </form>
      </SectionCard>

      <ErrorBanner message={error} onRetry={load} />

      <SectionCard bodyClassName="flush">
        {loading ? (
          <div className="center-panel">
            <Spinner size={26} label="Loading ticket queue…" />
          </div>
        ) : data.content.length === 0 ? (
          <EmptyState
            icon="search"
            title="No tickets match your filters"
            message="Adjust the filters or reset them to see all campus complaints."
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
                    <th>Student</th>
                    <th>Complaint</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned to</th>
                    <th>Submitted</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((ticket) => (
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
                        <span className="table-subtitle">{ticket.location}</span>
                      </td>
                      <td>{ticket.category?.name}</td>
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td>{ticket.assignedAdmin?.fullName || <span className="muted-text">Unassigned</span>}</td>
                      <td className="nowrap">{formatDateTime(ticket.createdAt)}</td>
                      <td className="align-right">
                        <Link to={`${basePath}/tickets/${ticket.id}`} className="btn btn-ghost btn-xs">
                          Manage <Icon name="chevronRight" size={14} />
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
