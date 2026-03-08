export type Role = 'admin' | 'customer';

export interface SessionUser {
  id: number;
  email: string;
  role: Role;
}

export interface AuthResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  createdAt: string;
}

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
