import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import { Field } from '../components/UI.jsx';
import { applyFieldErrors, homeForRole, roleLabel } from '../utils/format.js';

const PORTALS = {
  student: {
    eyebrow: 'Student portal',
    title: 'Welcome back',
    text: 'Sign in to submit a complaint and follow its progress.',
    icon: 'user',
  },
  admin: {
    eyebrow: 'Administrator portal',
    title: 'Administrator sign in',
    text: 'Access the ticket queue, assign work and update complaint statuses.',
    icon: 'users',
  },
  'main-admin': {
    eyebrow: 'Main Administrator',
    title: 'Main Administrator sign in',
    text: 'Manage campus accounts, categories and confidential support reports.',
    icon: 'shield',
  },
};

export default function LoginPage({ portal = 'student' }) {
  const config = PORTALS[portal] || PORTALS.student;
  const { user, login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
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
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const account = await login(form.email.trim(), form.password);
      toast.success(`Signed in as ${roleLabel(account.role)}.`);
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
            <Icon name={config.icon} size={15} /> {config.eyebrow}
          </span>
          <h2>Campus support that stays organised.</h2>
          <p>
            Every complaint receives a unique ticket number, a clear owner and a complete status history.
            No lost requests, no unclear updates.
          </p>
          <ul className="auth-benefits">
            <li>
              <Icon name="checkCircle" size={17} /> Role-based secure access
            </li>
            <li>
              <Icon name="checkCircle" size={17} /> Live complaint tracking
            </li>
            <li>
              <Icon name="checkCircle" size={17} /> Audit-ready status history
            </li>
          </ul>
        </div>
        <p className="auth-aside-foot">Centurion University of Technology and Management · Vizianagaram</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="auth-back">
            <Icon name="chevronLeft" size={16} /> Back to home
          </Link>
          <div className="auth-heading">
            <div className="auth-icon">
              <Icon name={config.icon} size={22} />
            </div>
            <h1>{config.title}</h1>
            <p>{config.text}</p>
          </div>

          {errors.general && (
            <div className="form-alert" role="alert">
              <Icon name="alert" size={18} />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
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

            <Field label="Password" error={errors.password} required>
              <div className="input-with-icon">
                <Icon name="lock" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
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

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'} {!submitting && <Icon name="arrowRight" size={18} />}
            </button>
          </form>

          <div className="auth-footer-text">
            {portal === 'student' ? (
              <>
                New student? <Link to="/register">Create a student account</Link>
              </>
            ) : (
              <>
                Administrator accounts are created by the Main Administrator.{' '}
                <Link to="/login">Student sign in</Link>
              </>
            )}
          </div>

          <div className="auth-role-links">
            {portal !== 'student' && <Link to="/login">Student</Link>}
            {portal !== 'admin' && <Link to="/admin/login">Administrator</Link>}
            {portal !== 'main-admin' && <Link to="/main-admin/login">Main Administrator</Link>}
          </div>
        </div>
      </main>
    </div>
  );
}
