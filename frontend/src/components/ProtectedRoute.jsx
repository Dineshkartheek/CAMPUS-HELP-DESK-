import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { LoadingScreen } from './UI.jsx';
import { homeForRole } from '../utils/format.js';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen label="Checking your session…" />;
  }

  if (!user) {
    const loginPath = location.pathname.startsWith('/main-admin')
      ? '/main-admin/login'
      : location.pathname.startsWith('/admin')
        ? '/admin/login'
        : '/login';
    return <Navigate to={loginPath} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children;
}
