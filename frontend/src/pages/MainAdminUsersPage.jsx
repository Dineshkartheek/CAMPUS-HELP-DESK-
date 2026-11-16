import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import {
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  RoleBadge,
  SectionCard,
  Spinner,
} from '../components/UI.jsx';
import { applyFieldErrors, formatDateTime, roleLabel } from '../utils/format.js';

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Students' },
  { value: 'ADMIN', label: 'Administrators' },
  { value: 'MAIN_ADMIN', label: 'Main Administrators' },
];

const EMPTY_FORM = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'ADMIN',
  department: '',
};

export default function MainAdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: '', search: '' });
  const [applied, setApplied] = useState({ role: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.mainAdmin.users(applied);
      setUsers(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      students: users.filter((entry) => entry.role === 'STUDENT').length,
      admins: users.filter((entry) => entry.role === 'ADMIN').length,
      mainAdmins: users.filter((entry) => entry.role === 'MAIN_ADMIN').length,
      inactive: users.filter((entry) => !entry.active).length,
    }),
    [users],
  );

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setApplied({ ...filters });
  };

  const resetFilters = () => {
    setFilters({ role: '', search: '' });
    setApplied({ role: '', search: '' });
  };

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: undefined, general: undefined }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (form.password.length > 72) next.password = 'Password must be 72 characters or fewer.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    if (!form.role) next.role = 'Select the account role.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const createAdmin = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setCreating(true);
    try {
      await api.mainAdmin.createAdmin({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        department: form.department.trim() || undefined,
      });
      toast.success(`${roleLabel(form.role)} account created successfully.`);
      resetForm();
      setShowCreate(false);
      setFilters((current) => ({ ...current, role: form.role }));
      setApplied((current) => ({ ...current, role: form.role }));
      await load();
    } catch (requestError) {
      applyFieldErrors(requestError, setFieldErrors);
      setFieldErrors((current) => ({ ...current, general: requestError.message }));
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (entry) => {
    const nextActive = !entry.active;
    if (!nextActive) {
      const confirmed = window.confirm(
        `Deactivate ${entry.fullName}? Their existing data is kept, but they will not be able to sign in.`,
      );
      if (!confirmed) return;
    }
    setUpdatingId(entry.id);
    try {
      await api.mainAdmin.updateUserStatus(entry.id, nextActive);
      toast.success(`${entry.fullName} is now ${nextActive ? 'active' : 'deactivated'}.`);
      await load();
    } catch (requestError) {
      toast.error(requestError.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="User management"
        title="Campus accounts"
        subtitle="Search every account, create administrator accounts and control sign-in access."
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowCreate((value) => !value);
            }}
          >
            <Icon name={showCreate ? 'close' : 'plus'} size={16} />
            {showCreate ? 'Close form' : 'Create administrator'}
          </button>
        }
      />

      {showCreate && (
        <SectionCard
          title="Create administrator account"
          subtitle="Administrator and Main Administrator accounts can only be provisioned here. Students register publicly."
        >
          {fieldErrors.general && (
            <div className="form-alert" role="alert">
              <Icon name="alert" size={18} />
              <span>{fieldErrors.general}</span>
            </div>
          )}
          <form className="form-stack" onSubmit={createAdmin} noValidate>
            <div className="form-grid">
              <Field label="Full name" error={fieldErrors.fullName} required>
                <input
                  type="text"
                  name="fullName"
                  maxLength={120}
                  placeholder="Administrator full name"
                  value={form.fullName}
                  onChange={updateForm}
                />
              </Field>
              <Field label="Department" error={fieldErrors.department} hint="Optional, for example Facilities.">
                <input
                  type="text"
                  name="department"
                  maxLength={120}
                  placeholder="Facilities / IT Support"
                  value={form.department}
                  onChange={updateForm}
                />
              </Field>
            </div>

            <div className="form-grid">
              <Field label="Email address" error={fieldErrors.email} required>
                <input
                  type="email"
                  name="email"
                  autoComplete="off"
                  maxLength={180}
                  placeholder="administrator@campus.edu"
                  value={form.email}
                  onChange={updateForm}
                />
              </Field>
              <Field label="Account role" error={fieldErrors.role} required>
                <select name="role" value={form.role} onChange={updateForm}>
                  <option value="ADMIN">Administrator</option>
                  <option value="MAIN_ADMIN">Main Administrator</option>
                </select>
              </Field>
            </div>

            <div className="form-grid">
              <Field
                label="Temporary password"
                error={fieldErrors.password}
                hint="At least 8 characters. Share it securely with the administrator."
                required
              >
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  maxLength={72}
                  placeholder="Enter a strong password"
                  value={form.password}
                  onChange={updateForm}
                />
              </Field>
              <Field label="Confirm password" error={fieldErrors.confirmPassword} required>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  maxLength={72}
                  placeholder="Repeat the password"
                  value={form.confirmPassword}
                  onChange={updateForm}
                />
              </Field>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  resetForm();
                  setShowCreate(false);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                <Icon name="shield" size={16} /> {creating ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard className="filter-card" bodyClassName="filter-body">
        <form className="filter-form filter-form-users" onSubmit={applyFilters}>
          <div className="filter-search">
            <Icon name="search" size={17} />
            <input
              type="search"
              name="search"
              placeholder="Search by name or email…"
              value={filters.search}
              onChange={updateFilter}
            />
          </div>
          <select name="role" value={filters.role} onChange={updateFilter} aria-label="Filter by role">
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="filter-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              <Icon name="filter" size={15} /> Apply
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="mini-stats">
        <div>
          <span>Accounts shown</span>
          <strong>{users.length}</strong>
        </div>
        <div>
          <span>Students</span>
          <strong>{counts.students}</strong>
        </div>
        <div>
          <span>Administrators</span>
          <strong>{counts.admins}</strong>
        </div>
        <div>
          <span>Main Administrators</span>
          <strong>{counts.mainAdmins}</strong>
        </div>
        <div>
          <span>Deactivated</span>
          <strong>{counts.inactive}</strong>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      <SectionCard bodyClassName="flush">
        {loading ? (
          <div className="center-panel">
            <Spinner size={26} label="Loading campus accounts…" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon="users"
            title="No accounts match your filters"
            message="Try another search term or role, or reset the filters."
            action={
              <button type="button" className="btn btn-outline" onClick={resetFilters}>
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th className="align-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => {
                  const isSelf = entry.id === currentUser?.id;
                  return (
                    <tr key={entry.id}>
                      <td>
                        <div className="table-title">
                          {entry.fullName} {isSelf && <span className="badge badge-neutral">You</span>}
                        </div>
                      </td>
                      <td>{entry.email}</td>
                      <td>
                        <RoleBadge role={entry.role} />
                      </td>
                      <td>{entry.department || <span className="muted-text">Not specified</span>}</td>
                      <td className="nowrap">{formatDateTime(entry.createdAt)}</td>
                      <td>
                        <span className={`badge ${entry.active ? 'status-resolved' : 'status-rejected'}`}>
                          {entry.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="align-right">
                        <button
                          type="button"
                          className={`btn btn-xs ${entry.active ? 'btn-danger-ghost' : 'btn-outline'}`}
                          onClick={() => toggleStatus(entry)}
                          disabled={updatingId === entry.id || (isSelf && entry.active)}
                          title={isSelf ? 'You cannot deactivate your own account' : undefined}
                        >
                          {updatingId === entry.id
                            ? 'Updating…'
                            : entry.active
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="info-note note-info">
        <Icon name="shield" size={17} />
        <div>
          Deactivating an account blocks sign-in immediately but keeps the account and its ticket history.
          At least one active Main Administrator must always remain in the system.
        </div>
      </div>
    </div>
  );
}
