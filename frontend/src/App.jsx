import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import SubmitComplaintPage from './pages/SubmitComplaintPage.jsx';
import MyTicketsPage from './pages/MyTicketsPage.jsx';
import TicketDetailPage from './pages/TicketDetailPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminTicketsPage from './pages/AdminTicketsPage.jsx';
import AdminTicketDetailPage from './pages/AdminTicketDetailPage.jsx';
import MainAdminDashboard from './pages/MainAdminDashboard.jsx';
import MainAdminUsersPage from './pages/MainAdminUsersPage.jsx';
import MainAdminCategoriesPage from './pages/MainAdminCategoriesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage portal="student" />} />
        <Route path="/admin/login" element={<LoginPage portal="admin" />} />
        <Route path="/main-admin/login" element={<LoginPage portal="main-admin" />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute roles={['STUDENT']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/submit" element={<SubmitComplaintPage />} />
          <Route path="/student/tickets" element={<MyTicketsPage />} />
          <Route path="/student/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/student/profile" element={<ProfilePage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/admin/tickets/:id" element={<AdminTicketDetailPage />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute roles={['MAIN_ADMIN']}>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/main-admin" element={<MainAdminDashboard />} />
          <Route path="/main-admin/tickets" element={<AdminTicketsPage />} />
          <Route path="/main-admin/tickets/:id" element={<AdminTicketDetailPage />} />
          <Route path="/main-admin/users" element={<MainAdminUsersPage />} />
          <Route path="/main-admin/categories" element={<MainAdminCategoriesPage />} />
          <Route path="/main-admin/reports" element={<ReportsPage />} />
          <Route path="/main-admin/profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
