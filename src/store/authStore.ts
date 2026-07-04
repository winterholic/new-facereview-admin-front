import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import HeaderToken from 'api/HeaderToken';

interface AuthState {
  is_sign_in: boolean;
  user_id: string;
  user_name: string;
  access_token: string;
  setToken: (access_token: string) => void;
  setUser: (props: { user_id: string; user_name: string }) => void;
  clearAuth: () => void;
}

const initialState = {
  is_sign_in: false,
  user_id: '',
  user_name: '',
  access_token: '',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setToken: (access_token) => set({ access_token }),
      setUser: ({ user_id, user_name }) =>
        set({ is_sign_in: true, user_id, user_name }),
      clearAuth: () => {
        HeaderToken.set(null);
        set(initialState);
      },
    }),
    {
      name: 'admin-auth-storage',
      // access_token is intentionally excluded — it lives in memory only. On reload the
      // first API call has no Authorization header, 401s, and the axios interceptor
      // (api/index.ts) transparently refreshes it via the httpOnly refresh cookie.
      partialize: (state) => ({
        is_sign_in: state.is_sign_in,
        user_id: state.user_id,
        user_name: state.user_name,
      }),
    },
  ),
);
