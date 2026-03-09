import type { Product } from '../products/types';

export interface CartItem {
  id: number;
  quantity: number;
  lineTotal: number;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  total: number;
  items: CartItem[];
}
