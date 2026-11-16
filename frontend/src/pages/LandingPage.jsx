import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../components/Icons.jsx';
import { homeForRole } from '../utils/format.js';

const FEATURES = [
  {
    icon: 'ticket',
    title: 'Raise complaints in minutes',
    text: 'Students select a category, describe the issue, choose the campus location and receive a unique ticket number instantly.',
  },
  {
    icon: 'clock',
    title: 'Track every step',
    text: 'A complete status timeline shows when a ticket is assigned, in progress, resolved or closed — with administrator remarks.',
  },
  {
    icon: 'shield',
    title: 'Secure by design',
    text: 'BCrypt password hashing, JWT sessions and strict role-based access keep student, administrator and Main Admin data separate.',
  },
  {
    icon: 'users',
    title: 'Built for campus teams',
    text: 'Administrators assign work, update statuses and record history. Main Admins manage accounts, categories and confidential reports.',
  },
];

const CATEGORIES = [
  'Wi-Fi',
  'Smart Board',
  'Electrical',
  'Computer Lab',
  'Network',
  'Classroom',
  'Internet',
  'Other',
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">
            <Icon name="headset" size={23} />
          </span>
          <span>
            <strong>CampusCare</strong>
            <small>Smart Campus Help Desk</small>
          </span>
        </Link>
        <nav className="landing-links" aria-label="Landing page navigation">
          <a href="#features">Features</a>
          <a href="#categories">Categories</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="landing-actions">
          {user ? (
            <Link to={homeForRole(user.role)} className="btn btn-primary btn-sm">
              Open dashboard <Icon name="arrowRight" size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Create account
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <Icon name="building" size={15} /> Centurion University · Vizianagaram
            </span>
            <h1>
              Campus support,
              <br />
              <span>resolved with clarity.</span>
            </h1>
            <p className="hero-text">
              CampusCare is a smart help desk for university students and campus teams. Report a Wi-Fi,
              classroom, lab or electrical issue, receive a ticket and follow its progress from submission
              to resolution.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Report an issue <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">
                Student / Staff sign in
              </Link>
            </div>
            <div className="hero-trust">
              <span>
                <Icon name="checkCircle" size={16} /> Real database records
              </span>
              <span>
                <Icon name="lock" size={16} /> JWT protected
              </span>
              <span>
                <Icon name="shield" size={16} /> Three access levels
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-panel">
              <div className="hero-panel-top">
                <div>
                  <span className="mini-label">TICKET TRACKING</span>
                  <strong>CC-2026-7K4M2Q9B</strong>
                </div>
                <span className="badge status-in_progress">In Progress</span>
              </div>
              <div className="hero-ticket-title">Smart board not displaying in Room A-204</div>
              <div className="hero-ticket-meta">
                <span>
                  <Icon name="tag" size={14} /> Smart Board
                </span>
                <span>
                  <Icon name="mapPin" size={14} /> Academic Block A
                </span>
                <span className="priority-high">
                  <Icon name="alert" size={14} /> High priority
                </span>
              </div>
              <div className="hero-timeline">
                <div className="timeline-step done">
                  <span />
                  <div>
                    <strong>Submitted</strong>
                    <small>Student complaint recorded</small>
                  </div>
                </div>
                <div className="timeline-step done">
                  <span />
                  <div>
                    <strong>Assigned</strong>
                    <small>Facilities administrator</small>
                  </div>
                </div>
                <div className="timeline-step current">
                  <span />
                  <div>
                    <strong>In Progress</strong>
                    <small>Technician is investigating</small>
                  </div>
                </div>
                <div className="timeline-step">
                  <span />
                  <div>
                    <strong>Resolved</strong>
                    <small>Resolution confirmed by staff</small>
                  </div>
                </div>
              </div>
              <div className="hero-panel-foot">
                <div className="avatar avatar-sm">AR</div>
                <span>Assigned to Facilities Team</span>
                <span className="hero-dot" />
                <span>Live status history</span>
              </div>
            </div>
            <div className="hero-float-card">
              <div className="float-icon">
                <Icon name="checkCircle" size={20} />
              </div>
              <div>
                <strong>Every action is recorded</strong>
                <span>Status history is stored in MySQL</span>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-strip">
          <div>
            <strong>Students</strong>
            <span>Submit and track complaints</span>
          </div>
          <div>
            <strong>Administrators</strong>
            <span>Assign, update and resolve tickets</span>
          </div>
          <div>
            <strong>Main Admin</strong>
            <span>Manage users, categories and reports</span>
          </div>
          <div>
            <strong>MySQL</strong>
            <span>Persistent, auditable records</span>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="section-heading">
            <span className="eyebrow">Why CampusCare</span>
            <h2>A professional help desk for every campus issue</h2>
            <p>Purpose-built for university operations, with clear ownership and an audit trail for every complaint.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="feature-card">
                <div className="feature-icon">
                  <Icon name={feature.icon} size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section categories-section" id="categories">
          <div className="section-heading">
            <span className="eyebrow">Complaint categories</span>
            <h2>One place for every campus support request</h2>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <div key={category} className="category-chip">
                <Icon
                  name={
                    category === 'Wi-Fi' || category === 'Internet'
                      ? 'wifi'
                      : category === 'Electrical'
                        ? 'alert'
                        : category === 'Classroom'
                          ? 'building'
                          : category === 'Computer Lab'
                            ? 'book'
                            : 'tag'
                  }
                  size={20}
                />
                <span>{category}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2>From complaint to resolution in three steps</h2>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <h3>Submit your complaint</h3>
              <p>Sign in as a student, choose a category, describe the issue and add the campus location.</p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <h3>Campus team takes action</h3>
              <p>An administrator assigns the ticket, updates its status and communicates through admin remarks.</p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <h3>Track the resolution</h3>
              <p>Follow the full status history until the ticket is resolved and formally closed.</p>
            </article>
          </div>
        </section>

        <section className="portal-section">
          <div>
            <span className="eyebrow">Choose your portal</span>
            <h2>Sign in to the right workspace</h2>
            <p>
              Student accounts can be created online. Administrator and Main Administrator accounts are
              provisioned securely by the Main Administrator.
            </p>
          </div>
          <div className="portal-cards">
            <Link to="/login" className="portal-card">
              <Icon name="user" size={23} />
              <strong>Student portal</strong>
              <span>Submit and track complaints</span>
              <Icon name="arrowRight" size={17} />
            </Link>
            <Link to="/admin/login" className="portal-card">
              <Icon name="users" size={23} />
              <strong>Administrator</strong>
              <span>Manage and resolve tickets</span>
              <Icon name="arrowRight" size={17} />
            </Link>
            <Link to="/main-admin/login" className="portal-card">
              <Icon name="shield" size={23} />
              <strong>Main Administrator</strong>
              <span>Users, categories and reports</span>
              <Icon name="arrowRight" size={17} />
            </Link>
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <h2>Ready to report a campus issue?</h2>
            <p>Create your student account and receive a ticket number immediately.</p>
          </div>
          <Link to="/register" className="btn btn-light btn-lg">
            Create student account <Icon name="arrowRight" size={18} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="brand-mark">
            <Icon name="headset" size={21} />
          </span>
          <span>
            <strong>CampusCare</strong>
            <small>Smart Campus Help Desk Management System</small>
          </span>
        </div>
        <p>V. Dinesh Kartheek · Centurion University of Technology and Management, Vizianagaram</p>
        <div className="footer-links">
          <Link to="/login">Student login</Link>
          <Link to="/admin/login">Admin login</Link>
          <Link to="/main-admin/login">Main Admin login</Link>
        </div>
      </footer>
    </div>
  );
}
