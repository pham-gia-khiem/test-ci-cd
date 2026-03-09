import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api';
import { useSession } from './use-session';
import { getErrorMessage } from '../../../shared/lib/errors';
import { shopKeys } from '../../../shared/lib/query-keys';

interface Credentials {
  email: string;
  password: string;
}

interface AuthMessages {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useAuthMutations(messages: AuthMessages = {}) {
  const queryClient = useQueryClient();
  const { setSession, clearSession } = useSession();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: Credentials) => authApi.login(email, password),
    onSuccess: async (response) => {
      setSession({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      await queryClient.invalidateQueries({ queryKey: shopKeys.all });
      messages.onSuccess?.('Logged in. Walk through products, cart, and orders.');
    },
    onError: (error) => {
      messages.onError?.(getErrorMessage(error));
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password }: Credentials) => authApi.register(email, password),
    onSuccess: async (response) => {
      setSession({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      });
      await queryClient.invalidateQueries({ queryKey: shopKeys.all });
      messages.onSuccess?.('Account created and logged in.');
    },
    onError: (error) => {
      messages.onError?.(getErrorMessage(error));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (token: string | null) => {
      if (!token) {
        return;
      }

      await authApi.logout(token);
    },
    onSuccess: async () => {
      clearSession();
      queryClient.removeQueries({ queryKey: shopKeys.cartRoot });
      queryClient.removeQueries({ queryKey: shopKeys.ordersRoot });
      queryClient.removeQueries({ queryKey: shopKeys.adminOrders() });
      await queryClient.invalidateQueries({ queryKey: shopKeys.products() });
      messages.onSuccess?.('Logged out.');
    },
    onError: async () => {
      clearSession();
      queryClient.removeQueries({ queryKey: shopKeys.cartRoot });
      queryClient.removeQueries({ queryKey: shopKeys.ordersRoot });
      queryClient.removeQueries({ queryKey: shopKeys.adminOrders() });
      await queryClient.invalidateQueries({ queryKey: shopKeys.products() });
      messages.onSuccess?.('Logged out.');
    },
  });

  return {
    loginMutation,
    registerMutation,
    logoutMutation,
  };
}
