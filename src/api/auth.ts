import type { LoginResponse, MeResponse } from 'types';
import api from './index';

export const signIn = (props: { email: string; password: string }) =>
  api.post<LoginResponse>('/v2/auth/login', props);

export const getMe = () => api.get<MeResponse>('/v2/auth/me');

export const refreshToken = () => api.post<LoginResponse>('/v2/auth/reissue');

export const signOut = () => api.post('/v2/auth/logout');
