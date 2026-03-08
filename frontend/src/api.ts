import type { AuthResponse, Cart, Order, Product } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  token?: string | null;
  body?: unknown;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  requestId: string | null;
  durationMs: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message =
      payload && 'message' in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(', ')
          : payload.message
        : 'Request failed';
    throw new Error(message);
  }

  if (!payload || !('data' in payload)) {
    throw new Error('Invalid server response');
  }

  return payload.data;
}

export const api = {
  register(email: string, password: string) {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
  },
  login(email: string, password: string) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },
  refresh(refreshToken: string) {
    return request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  },
  logout(token: string) {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
      token,
    });
  },
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
  createOrder(token: string) {
    return request<Order>('/orders', {
      method: 'POST',
      token,
    });
  },
  getOrders(token: string) {
    return request<Order[]>('/orders', { token });
  },
  getAdminOrders(token: string) {
    return request<Array<Order & { user: { id: number; email: string; role: string } }>>(
      '/admin/orders',
      { token },
    );
  },
};
