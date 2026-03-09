import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api';
import type { Cart } from '../types';
import { useSession } from '../../auth/model/use-session';
import { getErrorMessage } from '../../../shared/lib/errors';
import { shopKeys } from '../../../shared/lib/query-keys';

interface FeedbackOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface CartItemPayload {
  itemId: number;
  quantity: number;
}

interface AddToCartPayload {
  productId: number;
  quantity: number;
}

export function useCartQuery() {
  const { session } = useSession();

  return useQuery({
    queryKey: shopKeys.cart(session.user?.id ?? 0),
    queryFn: () => cartApi.getCart(session.accessToken!),
    enabled: Boolean(session.user && session.accessToken),
  });
}

export function useAddToCartMutation(feedback: FeedbackOptions = {}) {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity }: AddToCartPayload) => {
      if (!session.accessToken || !session.user) {
        throw new Error('Log in first');
      }

      return cartApi.addToCart(session.accessToken, productId, quantity);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(shopKeys.cart(session.user!.id), cart);
      feedback.onSuccess?.('Item added to cart.');
    },
    onError: (error) => {
      feedback.onError?.(getErrorMessage(error));
    },
  });
}

export function useCartItemMutations(feedback: FeedbackOptions = {}) {
  const { session } = useSession();
  const queryClient = useQueryClient();

  function setCart(cart: Cart) {
    queryClient.setQueryData(shopKeys.cart(session.user!.id), cart);
  }

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: CartItemPayload) => {
      if (!session.accessToken || !session.user) {
        throw new Error('Log in first');
      }

      return cartApi.updateCartItem(session.accessToken, itemId, quantity);
    },
    onSuccess: (cart) => {
      setCart(cart);
    },
    onError: (error) => {
      feedback.onError?.(getErrorMessage(error));
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => {
      if (!session.accessToken || !session.user) {
        throw new Error('Log in first');
      }

      return cartApi.removeCartItem(session.accessToken, itemId);
    },
    onSuccess: (cart) => {
      setCart(cart);
    },
    onError: (error) => {
      feedback.onError?.(getErrorMessage(error));
    },
  });

  return {
    updateItemMutation,
    removeItemMutation,
  };
}
