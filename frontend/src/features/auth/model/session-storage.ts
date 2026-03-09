import type { SessionState } from '../types';

const SESSION_KEY = 'interview-shop-session';

export const defaultSession: SessionState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

export function loadSession(): SessionState {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return defaultSession;
  }

  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return defaultSession;
  }
}

export function saveSession(session: SessionState) {
  if (!session.user && !session.accessToken && !session.refreshToken) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
