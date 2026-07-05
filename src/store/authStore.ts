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
      // NOTE: access_token도 함께 저장(사용자 요청) — 새로고침 직후 첫 요청이 401→재발급을
      // 한 번 거치는 대신 곧바로 Authorization 헤더를 채워 200으로 가도록. 토큰이 만료된
      // 뒤에는 여전히 axios 인터셉터(api/index.ts)가 401→reissue로 정상 처리함.
      partialize: (state) => ({
        is_sign_in: state.is_sign_in,
        user_id: state.user_id,
        user_name: state.user_name,
        access_token: state.access_token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.access_token) {
          HeaderToken.set(state.access_token);
        }
      },
    },
  ),
);
