export {};

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: 'admin' | 'customer';
    }

    interface Request {
      requestId?: string;
    }
  }
}
