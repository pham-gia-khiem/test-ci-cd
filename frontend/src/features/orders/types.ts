import type { Product } from '../products/types';

export interface OrderItem {
  id: number;
  quantity: number;
  priceAtPurchase: number;
  product: Product;
}

export interface Order {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}
