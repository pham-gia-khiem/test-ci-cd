import { request } from '../../shared/api/http';
import type { Product } from './types';

export const productsApi = {
  getProducts() {
    return request<Product[]>('/products');
  },
  createProduct(token: string, body: { name: string; slug: string; price: number; stock: number }) {
    return request<Product>('/products', {
      method: 'POST',
      token,
      body,
    });
  },
  updateProduct(
    token: string,
    productId: number,
    body: Partial<{ name: string; slug: string; price: number; stock: number }>,
  ) {
    return request<Product>(`/products/${productId}`, {
      method: 'PATCH',
      token,
      body,
    });
  },
};
