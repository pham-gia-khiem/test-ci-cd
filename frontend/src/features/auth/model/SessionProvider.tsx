import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { SessionState } from '../types';
import { SessionContext } from './session-context';
import { defaultSession, loadSession, saveSession } from './session-storage';

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionState>(() => loadSession());

  useEffect(() => {
    saveSession(session);
  }, [session]);

  return (
    <SessionContext.Provider
      value={{
        session,
        setSession,
        clearSession: () => setSession(defaultSession),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
