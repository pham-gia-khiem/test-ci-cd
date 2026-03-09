import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api';
import { useSession } from '../../auth/model/use-session';
import { getErrorMessage } from '../../../shared/lib/errors';
import { shopKeys } from '../../../shared/lib/query-keys';
import { productsApi } from '../../products/api';

interface FeedbackOptions {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

interface ProductPayload {
  id?: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
}

export function useAdminOrdersQuery() {
  const { session } = useSession();

  return useQuery({
    queryKey: shopKeys.adminOrders(),
    queryFn: () => adminApi.getAdminOrders(session.accessToken!),
    enabled: Boolean(session.accessToken && session.user?.role === 'admin'),
  });
}

export function useProductMutations(feedback: FeedbackOptions = {}) {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: (payload: ProductPayload) => {
      if (!session.accessToken || session.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      return productsApi.createProduct(session.accessToken, {
        name: payload.name,
        slug: payload.slug,
        price: payload.price,
        stock: payload.stock,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shopKeys.products() });
      feedback.onSuccess?.('Product created.');
    },
    onError: (error) => {
      feedback.onError?.(getErrorMessage(error));
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, ...payload }: ProductPayload) => {
      if (!session.accessToken || session.user?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      if (!id) {
        throw new Error('Product ID is required for updates');
      }

      return productsApi.updateProduct(session.accessToken, id, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shopKeys.products() });
      feedback.onSuccess?.('Product updated.');
    },
    onError: (error) => {
      feedback.onError?.(getErrorMessage(error));
    },
  });

  return {
    createProductMutation,
    updateProductMutation,
  };
}
