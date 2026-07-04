import axios from 'axios';
import { refreshToken } from './auth';
import { useAuthStore } from 'store/authStore';
import HeaderToken from './HeaderToken';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MAX_RETRY_COUNT = 3;

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Reissue endpoint failures should not trigger another reissue.
    if (originalRequest?.url?.includes('/v2/auth/reissue')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      isRefreshing = true;

      if (originalRequest._retryCount > MAX_RETRY_COUNT) {
        window.dispatchEvent(new Event('auth:unauthorized'));
        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await refreshToken();
        const { access_token } = data;

        useAuthStore.getState().setToken(access_token);
        HeaderToken.set(access_token);

        processQueue(null, access_token);

        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        window.dispatchEvent(new Event('auth:unauthorized'));
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
