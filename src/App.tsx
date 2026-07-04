import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminLayout from 'components/layout/AdminLayout';
import ProtectedRoute from 'components/ProtectedRoute/ProtectedRoute';
import LoginPage from 'pages/login/LoginPage';
import DashboardPage from 'pages/dashboard/DashboardPage';
import UsersPage from 'pages/users/UsersPage';
import VideosPage from 'pages/videos/VideosPage';
import VideoRequestsPage from 'pages/video-requests/VideoRequestsPage';
import CommentsPage from 'pages/comments/CommentsPage';
import { useAuthStore } from 'store/authStore';

const UnauthorizedListener = (): null => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [clearAuth, navigate]);

  return null;
};

const App = (): ReactElement => (
  <BrowserRouter>
    <UnauthorizedListener />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="video-requests" element={<VideoRequestsPage />} />
        <Route path="comments" element={<CommentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ToastContainer theme="dark" position="top-right" autoClose={2500} />
  </BrowserRouter>
);

export default App;
