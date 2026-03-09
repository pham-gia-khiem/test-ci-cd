import { request } from '../../shared/api/http';
import type { Cart } from './types';

export const cartApi = {
  getCart(token: string) {
    return request<Cart>('/cart', { token });
  },
  addToCart(token: string, productId: number, quantity: number) {
    return request<Cart>('/cart/items', {
      method: 'POST',
      token,
      body: { productId, quantity },
    });
  },
  updateCartItem(token: string, itemId: number, quantity: number) {
    return request<Cart>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      token,
      body: { quantity },
    });
  },
  removeCartItem(token: string, itemId: number) {
    return request<Cart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
      token,
    });
  },
};
