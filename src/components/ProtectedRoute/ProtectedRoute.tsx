import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from 'store/authStore';

const ProtectedRoute = ({ children }: { children: ReactElement }): ReactElement => {
  const isSignedIn = useAuthStore((state) => state.is_sign_in);

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
