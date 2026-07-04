import type { ReactElement } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { signOut } from 'api/auth';
import { useAuthStore } from 'store/authStore';

import './adminLayout.scss';

const NAV_ITEMS = [
  { to: '/', label: '대시보드', end: true },
  { to: '/users', label: '회원 관리' },
  { to: '/videos', label: '영상 관리' },
  { to: '/video-requests', label: '영상 요청' },
  { to: '/comments', label: '댓글 관리' },
];

const AdminLayout = (): ReactElement => {
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.user_name);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error(err);
    } finally {
      clearAuth();
      navigate('/login');
      toast.info('로그아웃되었습니다.');
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/logo.svg" alt="" className="admin-sidebar__logo-mark" />
          <span className="font-title-mini">Admin</span>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-sidebar__link font-label-medium${isActive ? ' active' : ''}`
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <span className="admin-topbar__user font-body-medium">{userName} 님</span>
          <button
            type="button"
            className="admin-topbar__logout font-label-small"
            onClick={handleLogout}>
            로그아웃
          </button>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
