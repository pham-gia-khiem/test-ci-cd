export type Role = 'admin' | 'customer';

export interface SessionUser {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

export interface SessionState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}
