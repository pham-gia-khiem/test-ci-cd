import { request } from '../../shared/api/http';
import type { Order } from './types';

export const ordersApi = {
  createOrder(token: string) {
    return request<Order>('/orders', {
      method: 'POST',
      token,
    });
  },
  getOrders(token: string) {
    return request<Order[]>('/orders', { token });
  },
};
