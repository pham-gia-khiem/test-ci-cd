import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api';
import { shopKeys } from '../../../shared/lib/query-keys';

export function useProductsQuery() {
  return useQuery({
    queryKey: shopKeys.products(),
    queryFn: () => productsApi.getProducts(),
  });
}
