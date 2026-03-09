import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api';
import type { Cart } from '../../cart/types';
import type { Order } from '../types';
import { useSession } from '../../auth/model/use-session';
import { getErrorMessage } from '../../../shared/lib/errors';
import { shopKeys } from '../../../shared/lib/query-keys';

interface FeedbackOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useOrdersQuery() {
  const { session } = useSession();

  return useQuery({
    queryKey: shopKeys.orders(session.user?.id ?? 0),
    queryFn: () => ordersApi.getOrders(session.accessToken!),
    enabled: Boolean(session.user && session.accessToken),
  });
}

export function useCreateOrderMutation(feedback: FeedbackOptions = {}) {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!session.accessToken || !session.user) {
        throw new Error('Log in first');
      }

      return ordersApi.createOrder(session.accessToken);
    },
    onSuccess: async (newOrder) => {
      const userId = session.user!.id;

      queryClient.setQueryData(shopKeys.orders(userId), (current: Order[] | undefined) =>
        current ? [newOrder, ...current] : [newOrder],
      );
      queryClient.setQueryData(shopKeys.cart(userId), (current: Cart | undefined) =>
        current ? { ...current, items: [], total: 0 } : current,
      );
      await queryClient.invalidateQueries({ queryKey: shopKeys.products() });

      if (session.user?.role === 'admin') {
        await queryClient.invalidateQueries({ queryKey: shopKeys.adminOrders() });
      }

      feedback.onSuccess?.('Order placed. Stock was updated in one transaction.');
    },
    onError: (error) => {
      feedback.onError?.(getErrorMessage(error));
    },
  });
}
