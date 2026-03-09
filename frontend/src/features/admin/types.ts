import type { Order } from '../orders/types';

export interface AdminOrder extends Order {
  user: {
    id: number;
    email: string;
    role: string;
  };
}
