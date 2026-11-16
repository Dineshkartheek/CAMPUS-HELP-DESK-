import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import { ErrorBanner, Field, InfoNote, PageHeader, SectionCard, Spinner } from '../components/UI.jsx';
import { applyFieldErrors, titleCase } from '../utils/format.js';

const LOCATIONS = [
  'Main Building',
  'Academic Block A',
  'Academic Block B',
  'Academic Block C',
  'Computer Lab 1',
  'Computer Lab 2',
  'Central Library',
  'Hostel Block',
  'Auditorium',
  'Sports Complex',
  'Canteen',
  'Other campus location',
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low — minor inconvenience' },
  { value: 'MEDIUM', label: 'Medium — normal attention' },
  { value: 'HIGH', label: 'High — affects classes or work' },
  { value: 'URGENT', label: 'Urgent — safety or major disruption' },
];

const EMPTY_FORM = {
  categoryId: '',
  title: '',
  description: '',
  location: '',
  customLocation: '',
  priority: 'MEDIUM',
};

export default function SubmitComplaintPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.categories
      .list()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch((error) => {
        if (!cancelled) setCategoryError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingCategories(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: undefined, general: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.categoryId) next.categoryId = 'Please select a complaint category.';
    if (!form.title.trim()) next.title = 'Complaint title is required.';
    else if (form.title.trim().length > 160) next.title = 'Title must be 160 characters or less.';
    if (!form.description.trim()) next.description = 'Please describe the issue.';
    else if (form.description.trim().length < 15) next.description = 'Please provide at least 15 characters.';
    if (!form.location) next.location = 'Please select a campus location.';
    if (form.location === 'Other campus location' && !form.customLocation.trim()) {
      next.customLocation = 'Please enter the location.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleAiSuggest = async () => {
    if (!form.title.trim() || form.description.trim().length < 15) {
      toast.warning('Add a title and a short description before requesting an AI suggestion.');
      return;
    }
    setAiLoading(true);
    try {
      const suggestion = await api.ai.suggest({
        title: form.title.trim(),
        description: form.description.trim(),
      });
      setAiSuggestion(suggestion);
      if (suggestion.available) {
        toast.info('AI suggestion received. Please review it before submitting.');
      } else {
        toast.warning(suggestion.note || 'AI suggestions are unavailable. You can still submit normally.');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const applySuggestion = () => {
    if (!aiSuggestion?.available) return;
    const matched = categories.find(
      (category) => category.name.toLowerCase() === aiSuggestion.category?.toLowerCase(),
    );
    setForm((current) => ({
      ...current,
      categoryId: matched ? String(matched.id) : current.categoryId,
      priority: aiSuggestion.priority || current.priority,
    }));
    setErrors((current) => ({ ...current, categoryId: undefined }));
    toast.success('AI suggestion applied. You can still change the category and priority.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const location =
        form.location === 'Other campus location' ? form.customLocation.trim() : form.location;

      const payload = {
        categoryId: Number(form.categoryId),
        title: form.title.trim(),
        description: form.description.trim(),
        location,
        priority: form.priority,
      };

      if (aiSuggestion?.available) {
        payload.aiSuggestedCategory = aiSuggestion.category;
        payload.aiSuggestedPriority = aiSuggestion.priority;
        payload.aiSummary = aiSuggestion.summary;
        payload.aiSuggestedDepartment = aiSuggestion.department;
      }

      const ticket = await api.tickets.create(payload);
      toast.success(`Complaint submitted successfully. Ticket ${ticket.ticketNumber}.`);
      navigate(`/student/tickets/${ticket.id}`, { replace: true });
    } catch (error) {
      applyFieldErrors(error, setErrors);
      setErrors((current) => ({ ...current, general: error.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="New complaint"
        title="Report a campus issue"
        subtitle="Provide clear details so the campus support team can resolve your issue quickly."
      />

      <ErrorBanner message={categoryError} onRetry={() => window.location.reload()} />

      <div className="form-layout">
        <SectionCard title="Complaint details" subtitle="Fields marked * are required.">
          {errors.general && (
            <div className="form-alert" role="alert">
              <Icon name="alert" size={18} />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="form-stack">
            <div className="form-grid">
              <Field label="Complaint category" error={errors.categoryId} required>
                {loadingCategories ? (
                  <div className="input-loading">
                    <Spinner size={16} /> Loading categories…
                  </div>
                ) : (
                  <select name="categoryId" value={form.categoryId} onChange={update}>
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Priority" error={errors.priority} required>
                <select name="priority" value={form.priority} onChange={update}>
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Complaint title" error={errors.title} required hint={`${form.title.length}/160 characters`}>
              <input
                type="text"
                name="title"
                maxLength={160}
                placeholder="Example: Projector not switching on in Room A-204"
                value={form.title}
                onChange={update}
              />
            </Field>

            <Field
              label="Description"
              error={errors.description}
              required
              hint={`${form.description.length}/5000 characters — include what happened and when.`}
            >
              <textarea
                name="description"
                rows={6}
                maxLength={5000}
                placeholder="Describe the issue in detail. Mention any error messages, when the problem started, and what you already tried."
                value={form.description}
                onChange={update}
              />
            </Field>

            <div className="ai-request-row">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleAiSuggest}
                disabled={aiLoading}
              >
                <Icon name="sparkles" size={16} />
                {aiLoading ? 'Analysing complaint…' : 'Get AI suggestion'}
              </button>
              <span>Optional. AI suggests a category, priority and department. You make the final choice.</span>
            </div>

            {aiSuggestion && (
              <div className={`ai-panel ${aiSuggestion.available ? '' : 'ai-panel-muted'}`}>
                <div className="ai-panel-header">
                  <span className="ai-label">
                    <Icon name="sparkles" size={16} /> AI suggestion — for review only
                  </span>
                  {aiSuggestion.available && (
                    <button type="button" className="btn btn-ghost btn-xs" onClick={applySuggestion}>
                      Apply suggestion
                    </button>
                  )}
                </div>
                {aiSuggestion.available ? (
                  <>
                    <div className="ai-grid">
                      <div>
                        <span>Suggested category</span>
                        <strong>{aiSuggestion.category}</strong>
                      </div>
                      <div>
                        <span>Suggested priority</span>
                        <strong>{titleCase(aiSuggestion.priority)}</strong>
                      </div>
                      <div>
                        <span>Suggested department</span>
                        <strong>{aiSuggestion.department || '—'}</strong>
                      </div>
                    </div>
                    {aiSuggestion.summary && <p className="ai-summary">“{aiSuggestion.summary}”</p>}
                    <small>{aiSuggestion.note}</small>
                  </>
                ) : (
                  <p>{aiSuggestion.note}</p>
                )}
              </div>
            )}

            <Field label="Campus location" error={errors.location} required>
              <select name="location" value={form.location} onChange={update}>
                <option value="">Select the location</option>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </Field>

            {form.location === 'Other campus location' && (
              <Field label="Specify location" error={errors.customLocation} required>
                <input
                  type="text"
                  name="customLocation"
                  maxLength={180}
                  placeholder="Building, floor, room number or landmark"
                  value={form.customLocation}
                  onChange={update}
                />
              </Field>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/student')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting || loadingCategories}>
                {submitting ? 'Submitting complaint…' : 'Submit complaint'}
                {!submitting && <Icon name="arrowRight" size={18} />}
              </button>
            </div>
          </form>
        </SectionCard>

        <div className="side-stack">
          <SectionCard title="Before you submit">
            <ul className="check-list">
              <li>
                <Icon name="checkCircle" size={17} /> Check whether a similar complaint already exists in
                “My complaints”.
              </li>
              <li>
                <Icon name="checkCircle" size={17} /> Include the exact room or campus location.
              </li>
              <li>
                <Icon name="checkCircle" size={17} /> Mention how many people or classes are affected.
              </li>
              <li>
                <Icon name="checkCircle" size={17} /> For urgent safety risks, contact campus security
                immediately as well.
              </li>
            </ul>
          </SectionCard>

          <InfoNote tone="blue" icon="clock">
            <strong>What happens next?</strong>
            <br />
            Your complaint becomes a ticket with a unique number. An administrator will assign it, update
            the status and record remarks that you can see in your complaint history.
          </InfoNote>
        </div>
      </div>
    </div>
  );
}
