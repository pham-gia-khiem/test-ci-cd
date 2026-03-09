import { request } from '../../shared/api/http';
import type { AdminOrder } from './types';

export const adminApi = {
  getAdminOrders(token: string) {
    return request<AdminOrder[]>('/admin/orders', { token });
  },
};
