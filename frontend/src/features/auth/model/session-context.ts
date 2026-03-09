import { createContext } from 'react';
import type { SessionState } from '../types';

export interface SessionContextValue {
  session: SessionState;
  setSession: (nextSession: SessionState) => void;
  clearSession: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
