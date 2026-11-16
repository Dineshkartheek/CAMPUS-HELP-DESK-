import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import { Field } from '../components/UI.jsx';
import { applyFieldErrors, homeForRole } from '../utils/format.js';

const EMPTY_FORM = {
  fullName: '',
  email: '',
  department: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const { user, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: undefined, general: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.department.trim()) next.department = 'Department is required.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const account = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        department: form.department.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success('Student account created successfully.');
      navigate(homeForRole(account.role), { replace: true });
    } catch (error) {
      applyFieldErrors(error, setErrors);
      setErrors((current) => ({ ...current, general: error.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/" className="auth-brand">
          <span className="brand-mark brand-mark-light">
            <Icon name="headset" size={24} />
          </span>
          <span>
            <strong>CampusCare</strong>
            <small>Smart Campus Help Desk</small>
          </span>
        </Link>
        <div className="auth-aside-content">
          <span className="hero-eyebrow">
            <Icon name="user" size={15} /> Student registration
          </span>
          <h2>Report your first campus issue today.</h2>
          <p>
            Create a student account, submit a complaint in a few clicks and track every update from the
            campus support team.
          </p>
          <ul className="auth-benefits">
            <li>
              <Icon name="checkCircle" size={17} /> Unique ticket number for every complaint
            </li>
            <li>
              <Icon name="checkCircle" size={17} /> Search and filter your complaint history
            </li>
            <li>
              <Icon name="checkCircle" size={17} /> View administrator remarks and status updates
            </li>
          </ul>
        </div>
        <p className="auth-aside-foot">Centurion University of Technology and Management · Vizianagaram</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card auth-card-wide">
          <Link to="/" className="auth-back">
            <Icon name="chevronLeft" size={16} /> Back to home
          </Link>
          <div className="auth-heading">
            <div className="auth-icon">
              <Icon name="user" size={22} />
            </div>
            <h1>Create student account</h1>
            <p>Public registration creates STUDENT accounts only.</p>
          </div>

          {errors.general && (
            <div className="form-alert" role="alert">
              <Icon name="alert" size={18} />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <Field label="Full name" error={errors.fullName} required>
                <input
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={update}
                />
              </Field>
              <Field label="Department / course" error={errors.department} required>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. B.Tech CSE"
                  value={form.department}
                  onChange={update}
                />
              </Field>
            </div>

            <Field label="Email address" error={errors.email} required>
              <div className="input-with-icon">
                <Icon name="mail" size={17} />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update}
                />
              </div>
            </Field>

            <div className="form-grid">
              <Field
                label="Password"
                error={errors.password}
                hint="Use at least 8 characters."
                required
              >
                <div className="input-with-icon">
                  <Icon name="lock" size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={update}
                  />
                  <button
                    type="button"
                    className="input-action"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name="eye" size={17} />
                  </button>
                </div>
              </Field>
              <Field label="Confirm password" error={errors.confirmPassword} required>
                <div className="input-with-icon">
                  <Icon name="lock" size={17} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={form.confirmPassword}
                    onChange={update}
                  />
                </div>
              </Field>
            </div>

            <p className="terms-note">
              By creating an account you agree to use CampusCare only for genuine campus support requests.
              Administrator accounts cannot be created from this page.
            </p>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create student account'}
              {!submitting && <Icon name="arrowRight" size={18} />}
            </button>
          </form>

          <div className="auth-footer-text">
            Already registered? <Link to="/login">Sign in to the student portal</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
