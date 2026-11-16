import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  SectionCard,
  Spinner,
  StatCard,
} from '../components/UI.jsx';
import { formatDate, formatDateTime, titleCase } from '../utils/format.js';

const EMPTY_RANGE = { from: '', to: '' };

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function quickRange(kind) {
  const now = new Date();
  if (kind === 'all') return { ...EMPTY_RANGE };
  if (kind === 'month') {
    return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDate(now) };
  }
  if (kind === '30') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { from: isoDate(start), to: isoDate(now) };
  }
  if (kind === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: isoDate(now) };
  }
  return { ...EMPTY_RANGE };
}

const TONES = ['navy', 'blue', 'amber', 'green', 'slate', 'red'];

export default function ReportsPage() {
  const { toast } = useToast();

  const [filters, setFilters] = useState(EMPTY_RANGE);
  const [applied, setApplied] = useState(EMPTY_RANGE);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.mainAdmin.reports(applied);
      setReport(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    if (filters.from && filters.to && filters.from > filters.to) {
      toast.warning('The start date cannot be after the end date.');
      return;
    }
    setApplied({ ...filters });
  };

  const applyPreset = (kind) => {
    const range = quickRange(kind);
    setFilters(range);
    setApplied(range);
  };

  const reset = () => {
    setFilters(EMPTY_RANGE);
    setApplied(EMPTY_RANGE);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await api.mainAdmin.exportReport(applied);
      toast.success('Confidential report exported successfully.');
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setExporting(false);
    }
  };

  const byStatus = useMemo(() => Object.entries(report?.byStatus || {}), [report]);
  const byPriority = useMemo(() => Object.entries(report?.byPriority || {}), [report]);
  const byCategory = useMemo(
    () =>
      Object.entries(report?.byCategory || {})
        .filter(([, value]) => value > 0)
        .sort((a, b) => b[1] - a[1]),
    [report],
  );

  const statusMax = Math.max(1, ...byStatus.map(([, value]) => value));
  const priorityMax = Math.max(1, ...byPriority.map(([, value]) => value));
  const categoryMax = Math.max(1, ...byCategory.map(([, value]) => value));

  const total = report?.totalTickets ?? 0;
  const resolved = (report?.byStatus?.RESOLVED ?? 0) + (report?.byStatus?.CLOSED ?? 0);
  const incomplete = Math.max(0, total - resolved);
  const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 100);
  const topCategory = byCategory[0];

  const periodLabel = report
    ? report.from || report.to
      ? `${report.from ? formatDate(report.from) : 'Beginning'} — ${report.to ? formatDate(report.to) : 'Today'}`
      : 'All time'
    : '—';

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Confidential reporting"
        title="Campus support reports"
        subtitle="Analyse complaint volumes, category trends and administrator performance. Reports are restricted to the Main Administrator."
        actions={
          <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={exporting || loading}>
            <Icon name="download" size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />

      <SectionCard className="filter-card" bodyClassName="filter-body">
        <form className="filter-form filter-form-report" onSubmit={applyFilters}>
          <label className="date-filter">
            <span>From date</span>
            <input type="date" name="from" value={filters.from} onChange={update} max={filters.to || undefined} />
          </label>
          <label className="date-filter">
            <span>To date</span>
            <input type="date" name="to" value={filters.to} onChange={update} min={filters.from || undefined} />
          </label>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              <Icon name="filter" size={15} /> Generate report
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>
              Clear
            </button>
          </div>
          <div className="preset-row">
            <button type="button" className="chip-button" onClick={() => applyPreset('month')}>
              This month
            </button>
            <button type="button" className="chip-button" onClick={() => applyPreset('30')}>
              Last 30 days
            </button>
            <button type="button" className="chip-button" onClick={() => applyPreset('year')}>
              This year
            </button>
            <button type="button" className="chip-button" onClick={() => applyPreset('all')}>
              All time
            </button>
          </div>
        </form>
      </SectionCard>

      <ErrorBanner message={error} onRetry={load} />

      {loading && !report ? (
        <div className="center-panel">
          <Spinner size={28} label="Generating report…" />
        </div>
      ) : !report ? (
        <EmptyState icon="chart" title="Report unavailable" message="Generate the report again or check the API connection." />
      ) : (
        <>
          <div className="report-meta-bar">
            <div>
              <span className="eyebrow">Reporting period</span>
              <strong>{periodLabel}</strong>
            </div>
            <div>
              <span className="eyebrow">Generated</span>
              <strong>{formatDateTime(report.generatedAt)}</strong>
            </div>
            <span className="badge badge-neutral">
              <Icon name="lock" size={13} /> Confidential
            </span>
          </div>

          <div className="stats-grid">
            <StatCard
              label="Tickets in period"
              value={total}
              icon="ticket"
              tone="navy"
              hint="Complaints submitted in the selected range"
            />
            <StatCard
              label="Resolved or closed"
              value={resolved}
              icon="checkCircle"
              tone="green"
              hint={`${resolutionRate}% resolution rate`}
            />
            <StatCard
              label="Still open"
              value={incomplete}
              icon="clock"
              tone="amber"
              hint="Submitted, assigned or in progress"
            />
            <StatCard
              label="Top category"
              value={topCategory ? topCategory[0] : '—'}
              icon="tag"
              tone="blue"
              hint={topCategory ? `${topCategory[1]} ticket${topCategory[1] === 1 ? '' : 's'}` : 'No tickets in period'}
            />
          </div>

          <div className="dashboard-grid">
            <SectionCard
              title="Tickets by status"
              subtitle="Workflow distribution for the selected period."
              className="span-2"
            >
              <div className="bar-list bar-list-wide">
                {byStatus.map(([status, value], index) => (
                  <div key={status} className="bar-row">
                    <div className="bar-meta">
                      <span>{titleCase(status)}</span>
                      <strong>{value}</strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill tone-${TONES[index % TONES.length]}`}
                        style={{ width: `${Math.round((value / statusMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Tickets by priority" subtitle="Urgency mix across all complaints.">
              <div className="bar-list">
                {byPriority.map(([priority, value]) => (
                  <div key={priority} className="bar-row">
                    <div className="bar-meta">
                      <span>{titleCase(priority)}</span>
                      <strong>{value}</strong>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill priority-fill priority-${priority.toLowerCase()}`}
                        style={{ width: `${Math.round((value / priorityMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Tickets by category"
            subtitle="Categories with at least one complaint in the selected period."
            bodyClassName="flush"
          >
            {byCategory.length === 0 ? (
              <EmptyState
                icon="tag"
                title="No categorised tickets in this period"
                message="Adjust the reporting dates to include more complaints."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Tickets</th>
                      <th>Share of period</th>
                      <th>Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCategory.map(([name, value]) => (
                      <tr key={name}>
                        <td>
                          <div className="table-title">{name}</div>
                        </td>
                        <td className="tabular">{value}</td>
                        <td className="tabular">
                          {total === 0 ? 0 : Math.round((value / total) * 100)}%
                        </td>
                        <td>
                          <div className="inline-bar">
                            <div
                              className="inline-bar-fill"
                              style={{ width: `${Math.round((value / categoryMax) * 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Administrator performance"
            subtitle="Assignment workload and completed resolutions for administrator accounts."
            bodyClassName="flush"
          >
            {report.adminPerformance.length === 0 ? (
              <EmptyState
                icon="users"
                title="No administrator accounts"
                message="Create administrator accounts to start tracking resolution performance."
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Administrator</th>
                      <th>Total assignments</th>
                      <th>Resolved or closed</th>
                      <th>Active assignments</th>
                      <th>Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.adminPerformance.map((entry) => {
                      const completion =
                        entry.assigned === 0 ? 0 : Math.round((entry.resolved / entry.assigned) * 100);
                      return (
                        <tr key={entry.adminId}>
                          <td>
                            <div className="table-title">{entry.adminName}</div>
                            <span className="table-subtitle">Administrator</span>
                          </td>
                          <td className="tabular">{entry.assigned}</td>
                          <td className="tabular">{entry.resolved}</td>
                          <td className="tabular">{entry.activeAssignments}</td>
                          <td>
                            <div className="completion-cell">
                              <div className="inline-bar">
                                <div className="inline-bar-fill" style={{ width: `${completion}%` }} />
                              </div>
                              <span className="tabular">{completion}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          <div className="info-note note-warning">
            <Icon name="shield" size={17} />
            <div>
              <strong>Confidential report.</strong> This report contains operational performance data. Export
              CSV files are generated by the Java backend and are not stored on the web server.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
