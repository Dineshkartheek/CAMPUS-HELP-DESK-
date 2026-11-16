import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Icon } from '../components/Icons.jsx';
import { PageHeader, RoleBadge, SectionCard, Spinner } from '../components/UI.jsx';
import { formatDateTime, initials, roleLabel } from '../utils/format.js';

const ROLE_DESCRIPTION = {
  STUDENT: 'Submit campus complaints, track their progress and communicate with the support team.',
  ADMIN: 'Manage the ticket queue, assign complaints and record status updates and remarks.',
  MAIN_ADMIN: 'Manage users and categories, monitor administrator performance and export confidential reports.',
};

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      toast.success('Profile refreshed.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Account"
        title="My profile"
        subtitle="Your CampusCare account information and access level."
        actions={
          <button type="button" className="btn btn-outline" onClick={refresh} disabled={refreshing}>
            <Icon name="refresh" size={16} /> {refreshing ? 'Refreshing…' : 'Refresh profile'}
          </button>
        }
      />

      <div className="profile-grid">
        <SectionCard className="profile-main">
          <div className="profile-banner">
            <div className="avatar avatar-xl">{initials(user?.fullName)}</div>
            <div>
              <h2>{user?.fullName}</h2>
              <p>{user?.email}</p>
              <div className="profile-badges">
                <RoleBadge role={user?.role} />
                <span className={`badge ${user?.active ? 'status-resolved' : 'status-rejected'}`}>
                  {user?.active ? 'Active account' : 'Deactivated'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-details">
            <div>
              <span>Full name</span>
              <strong>{user?.fullName}</strong>
            </div>
            <div>
              <span>Email address</span>
              <strong>{user?.email}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{roleLabel(user?.role)}</strong>
            </div>
            <div>
              <span>Department</span>
              <strong>{user?.department || 'Not specified'}</strong>
            </div>
            <div>
              <span>Account created</span>
              <strong>{formatDateTime(user?.createdAt)}</strong>
            </div>
            <div>
              <span>Account status</span>
              <strong>{user?.active ? 'Active' : 'Deactivated'}</strong>
            </div>
          </div>
        </SectionCard>

        <div className="side-stack">
          <SectionCard title="Access level">
            <div className="role-explainer">
              <div className="role-explainer-icon">
                <Icon name={user?.role === 'MAIN_ADMIN' ? 'shield' : user?.role === 'ADMIN' ? 'users' : 'user'} size={22} />
              </div>
              <strong>{roleLabel(user?.role)}</strong>
              <p>{ROLE_DESCRIPTION[user?.role]}</p>
            </div>
          </SectionCard>

          <SectionCard title="Account security">
            <ul className="security-list">
              <li>
                <Icon name="checkCircle" size={17} />
                <span>Passwords are stored using BCrypt hashing.</span>
              </li>
              <li>
                <Icon name="checkCircle" size={17} />
                <span>Your session uses a signed JWT and expires automatically.</span>
              </li>
              <li>
                <Icon name="checkCircle" size={17} />
                <span>The token is stored in session storage, not a public file.</span>
              </li>
            </ul>
            <p className="muted-text small-text">
              Password changes and account deactivation are handled by the Main Administrator. Contact the
              campus support office if you need help with your account.
            </p>
          </SectionCard>

          {refreshing && (
            <div className="inline-loading">
              <Spinner size={16} /> Updating profile…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
