import { request } from '../../shared/api/http';
import type { AuthResponse } from './types';

export const authApi = {
  register(email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  refresh(refreshToken: string) {
    return request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  },
  logout(token: string) {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
      token,
    });
  },
};
