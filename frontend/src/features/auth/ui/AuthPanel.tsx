import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthMutations } from '../model/use-auth-mutations';
import { useSession } from '../model/use-session';

type AuthMode = 'login' | 'register';

interface AuthPanelProps {
  onAuthenticated: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function AuthPanel({ onAuthenticated, onError, onSuccess }: AuthPanelProps) {
  const { session } = useSession();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('customer@example.com');
  const [password, setPassword] = useState('customer123');
  const { loginMutation, registerMutation, logoutMutation } = useAuthMutations({
    onError,
    onSuccess,
  });

  const isWorking =
    loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError('');

    try {
      if (authMode === 'login') {
        await loginMutation.mutateAsync({ email, password });
      } else {
        await registerMutation.mutateAsync({ email, password });
      }
      onAuthenticated();
    } catch {
      // React Query handlers already surface the error.
    }
  }

  async function handleLogout() {
    onError('');

    try {
      await logoutMutation.mutateAsync(session.accessToken);
    } catch {
      // Logout still clears local state from mutation handlers.
    }
  }

  return (
    <form className="auth-card" onSubmit={handleSubmit}>
      <div className="auth-tabs">
        <button
          className={authMode === 'login' ? 'active' : ''}
          onClick={() => setAuthMode('login')}
          type="button"
        >
          Login
        </button>
        <button
          className={authMode === 'register' ? 'active' : ''}
          onClick={() => setAuthMode('register')}
          type="button"
        >
          Register
        </button>
      </div>

      <label>
        Email
        <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
      </label>
      <label>
        Password
        <input
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </label>

      <button className="primary" disabled={isWorking} type="submit">
        {isWorking ? 'Working...' : authMode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      {session.user ? (
        <button className="ghost" onClick={handleLogout} type="button">
          Log out {session.user.email}
        </button>
      ) : null}
    </form>
  );
}
