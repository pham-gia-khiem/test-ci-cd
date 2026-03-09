export const shopKeys = {
  all: ['shop'] as const,
  products: () => ['shop', 'products'] as const,
  cartRoot: ['shop', 'cart'] as const,
  cart: (userId: number) => ['shop', 'cart', userId] as const,
  ordersRoot: ['shop', 'orders'] as const,
  orders: (userId: number) => ['shop', 'orders', userId] as const,
  adminOrders: () => ['shop', 'admin', 'orders'] as const,
};
