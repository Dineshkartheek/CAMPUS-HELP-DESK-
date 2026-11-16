import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import {
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  SectionCard,
  Spinner,
} from '../components/UI.jsx';
import { applyFieldErrors } from '../utils/format.js';

const EMPTY_FORM = { name: '', description: '', active: true };

export default function MainAdminCategoriesPage() {
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.mainAdmin.categories();
      setCategories(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description || '').toLowerCase().includes(term),
    );
  }, [categories, search]);

  const stats = useMemo(
    () => ({
      total: categories.length,
      active: categories.filter((category) => category.active).length,
      inactive: categories.filter((category) => !category.active).length,
    }),
    [categories],
  );

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
  };

  const startEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || '',
      active: category.active,
    });
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined, general: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Category name is required.';
    else if (form.name.trim().length > 80) next.name = 'Category name must be 80 characters or fewer.';
    if (form.description.trim().length > 255) next.description = 'Description must be 255 characters or fewer.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      active: form.active,
    };
    try {
      if (editing) {
        await api.mainAdmin.updateCategory(editing.id, payload);
        toast.success(`Category “${payload.name}” updated.`);
      } else {
        await api.mainAdmin.createCategory(payload);
        toast.success(`Category “${payload.name}” created.`);
      }
      startCreate();
      await load();
    } catch (requestError) {
      applyFieldErrors(requestError, setFieldErrors);
      setFieldErrors((current) => ({ ...current, general: requestError.message }));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (category) => {
    if (category.active) {
      const confirmed = window.confirm(
        `Deactivate “${category.name}”? Students will no longer be able to select it for new complaints. Existing tickets keep their category.`,
      );
      if (!confirmed) return;
    }
    setUpdatingId(category.id);
    try {
      await api.mainAdmin.updateCategory(category.id, {
        name: category.name,
        description: category.description || undefined,
        active: !category.active,
      });
      toast.success(`Category “${category.name}” ${category.active ? 'deactivated' : 'activated'}.`);
      if (editing?.id === category.id) {
        setEditing({ ...editing, active: !category.active });
        setForm((current) => ({ ...current, active: !category.active }));
      }
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
        eyebrow="Complaint categories"
        title="Category management"
        subtitle="Control the categories students see when submitting a complaint. Existing tickets are never changed."
        actions={
          <button type="button" className="btn btn-outline" onClick={load}>
            <Icon name="refresh" size={16} /> Refresh
          </button>
        }
      />

      <div className="mini-stats">
        <div>
          <span>Total categories</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div>
          <span>Inactive</span>
          <strong>{stats.inactive}</strong>
        </div>
      </div>

      <ErrorBanner message={error} onRetry={load} />

      <div className="form-layout">
        <SectionCard
          title={editing ? 'Edit category' : 'Add a new category'}
          subtitle={
            editing
              ? 'Changes apply immediately to new complaints.'
              : 'New categories become available to students straight away.'
          }
        >
          {fieldErrors.general && (
            <div className="form-alert" role="alert">
              <Icon name="alert" size={18} />
              <span>{fieldErrors.general}</span>
            </div>
          )}
          <form className="form-stack" onSubmit={save} noValidate>
            <Field label="Category name" error={fieldErrors.name} required>
              <input
                type="text"
                name="name"
                maxLength={80}
                placeholder="e.g. Laboratory Equipment"
                value={form.name}
                onChange={updateForm}
              />
            </Field>
            <Field
              label="Description"
              error={fieldErrors.description}
              hint="Optional. Helps administrators route complaints correctly."
            >
              <textarea
                name="description"
                rows={3}
                maxLength={255}
                placeholder="Short description of the issues covered by this category"
                value={form.description}
                onChange={updateForm}
              />
            </Field>
            <label className="toggle-field">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={updateForm}
              />
              <span>
                <strong>Active category</strong>
                <small>Active categories are selectable on the student complaint form.</small>
              </span>
            </label>
            <div className="form-actions">
              {editing && (
                <button type="button" className="btn btn-ghost" onClick={startCreate}>
                  Cancel edit
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Icon name={editing ? 'checkCircle' : 'plus'} size={16} />
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="side-stack">
          <SectionCard title="Category guidelines">
            <ul className="check-list">
              <li>
                <Icon name="checkCircle" size={17} /> Use short, clear names students will recognise.
              </li>
              <li>
                <Icon name="checkCircle" size={17} /> Deactivate rather than delete when a category is no
                longer needed.
              </li>
              <li>
                <Icon name="checkCircle" size={17} /> Existing tickets always keep their original category.
              </li>
              <li>
                <Icon name="checkCircle" size={17} /> Keep at least one active category for each campus
                service area.
              </li>
            </ul>
          </SectionCard>
          <div className="info-note note-info">
            <Icon name="info" size={17} />
            <div>
              Categories are stored in the <code>categories</code> table and referenced by tickets through a
              foreign key.
            </div>
          </div>
        </div>
      </div>

      <SectionCard
        title="Configured categories"
        subtitle={`${filtered.length} categor${filtered.length === 1 ? 'y' : 'ies'} shown`}
        bodyClassName="flush"
        actions={
          <div className="filter-search filter-search-inline">
            <Icon name="search" size={17} />
            <input
              type="search"
              placeholder="Search categories…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        }
      >
        {loading ? (
          <div className="center-panel">
            <Spinner size={26} label="Loading categories…" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="tag"
            title={search ? 'No categories match your search' : 'No categories configured'}
            message={
              search
                ? 'Try a different search term or clear the search box.'
                : 'Create the first complaint category using the form above.'
            }
            action={
              search ? (
                <button type="button" className="btn btn-outline" onClick={() => setSearch('')}>
                  Clear search
                </button>
              ) : null
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((category) => (
                  <tr key={category.id} className={editing?.id === category.id ? 'row-selected' : undefined}>
                    <td>
                      <div className="table-title">{category.name}</div>
                      <span className="table-subtitle">ID {category.id}</span>
                    </td>
                    <td>{category.description || <span className="muted-text">No description</span>}</td>
                    <td>
                      <span className={`badge ${category.active ? 'status-resolved' : 'status-rejected'}`}>
                        {category.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="table-actions">
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => startEdit(category)}>
                          <Icon name="edit" size={14} /> Edit
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${category.active ? 'btn-danger-ghost' : 'btn-outline'}`}
                          onClick={() => toggleActive(category)}
                          disabled={updatingId === category.id}
                        >
                          {updatingId === category.id
                            ? 'Updating…'
                            : category.active
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
