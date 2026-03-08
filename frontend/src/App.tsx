import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from './api';
import './App.css';
import type { AuthResponse, Cart, Order, Product, SessionUser } from './types';

type AuthMode = 'login' | 'register';
type View = 'products' | 'cart' | 'orders' | 'admin';

interface SessionState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const SESSION_KEY = 'interview-shop-session';

const defaultSession: SessionState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

function loadSession(): SessionState {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return defaultSession;
  }

  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return defaultSession;
  }
}

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('customer1@example.com');
  const [password, setPassword] = useState('customer123');
  const [session, setSession] = useState<SessionState>(() => loadSession());
  const [view, setView] = useState<View>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<
    Array<Order & { user: { id: number; email: string; role: string } }>
  >([]);
  const [quantityByProduct, setQuantityByProduct] = useState<Record<number, number>>({});
  const [adminForm, setAdminForm] = useState({
    id: '',
    name: '',
    slug: '',
    price: '',
    stock: '',
  });
  const [message, setMessage] = useState('Use the seeded accounts or register a new customer.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    void loadProducts();
  }, []);

  useEffect(() => {
    if (session.accessToken) {
      void hydratePrivateData(session.accessToken, session.user?.role === 'admin');
    } else {
      setCart(null);
      setOrders([]);
      setAdminOrders([]);
    }
  }, [session.accessToken, session.user?.role]);

  async function loadProducts() {
    try {
      const nextProducts = await api.getProducts();
      setProducts(nextProducts);
      setQuantityByProduct(
        nextProducts.reduce<Record<number, number>>((acc, product) => {
          acc[product.id] = acc[product.id] ?? 1;
          return acc;
        }, {}),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function hydratePrivateData(token: string, isAdmin: boolean) {
    try {
      const [nextCart, nextOrders] = await Promise.all([api.getCart(token), api.getOrders(token)]);
      setCart(nextCart);
      setOrders(nextOrders);

      if (isAdmin) {
        const allOrders = await api.getAdminOrders(token);
        setAdminOrders(allOrders);
      } else {
        setAdminOrders([]);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response =
        authMode === 'login'
          ? await api.login(email, password)
          : await api.register(email, password);
      applyAuthResponse(response);
      setMessage(
        authMode === 'login'
          ? 'Logged in. Walk through products, cart, and orders.'
          : 'Account created and logged in.',
      );
      setView('products');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    if (!session.accessToken) {
      return;
    }

    try {
      await api.logout(session.accessToken);
    } catch {
      // Keep local cleanup even if the server token is already invalid.
    }

    setSession(defaultSession);
    setMessage('Logged out.');
  }

  async function handleAddToCart(productId: number) {
    if (!session.accessToken) {
      setError('Log in first');
      return;
    }

    try {
      const nextCart = await api.addToCart(
        session.accessToken,
        productId,
        quantityByProduct[productId] ?? 1,
      );
      setCart(nextCart);
      setMessage('Item added to cart.');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleUpdateCartItem(itemId: number, quantity: number) {
    if (!session.accessToken) {
      return;
    }

    try {
      const nextCart = await api.updateCartItem(session.accessToken, itemId, quantity);
      setCart(nextCart);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRemoveCartItem(itemId: number) {
    if (!session.accessToken) {
      return;
    }

    try {
      const nextCart = await api.removeCartItem(session.accessToken, itemId);
      setCart(nextCart);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleCreateOrder() {
    if (!session.accessToken) {
      return;
    }

    try {
      const newOrder = await api.createOrder(session.accessToken);
      setOrders((current) => [newOrder, ...current]);
      setCart((current) => (current ? { ...current, items: [], total: 0 } : current));
      setMessage('Order placed. Stock was updated in one transaction.');
      if (session.user?.role === 'admin') {
        const allOrders = await api.getAdminOrders(session.accessToken);
        setAdminOrders(allOrders);
      }
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleAdminProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.accessToken) {
      return;
    }

    try {
      if (adminForm.id) {
        await api.updateProduct(session.accessToken, Number(adminForm.id), {
          name: adminForm.name || undefined,
          slug: adminForm.slug || undefined,
          price: adminForm.price ? Number(adminForm.price) : undefined,
          stock: adminForm.stock ? Number(adminForm.stock) : undefined,
        });
        setMessage('Product updated.');
      } else {
        await api.createProduct(session.accessToken, {
          name: adminForm.name,
          slug: adminForm.slug,
          price: Number(adminForm.price),
          stock: Number(adminForm.stock),
        });
        setMessage('Product created.');
      }

      setAdminForm({ id: '', name: '', slug: '', price: '', stock: '' });
      await loadProducts();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function applyAuthResponse(response: AuthResponse) {
    setSession({
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
  }

  const isAdmin = session.user?.role === 'admin';

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="eyebrow">Interview Demo</p>
        <h1>Backend Recall Shop</h1>
        <p className="lede">
          One monolith, one database, one proxy. Use it to explain request flow, auth, SQL,
          Docker, and architecture tradeoffs out loud.
        </p>

        <div className="demo-box">
          <h2>Seeded users</h2>
          <p>
            Customer: <strong>customer@example.com</strong> / <strong>customer123</strong>
          </p>
          <p>
            Admin: <strong>admin@example.com</strong> / <strong>admin123</strong>
          </p>
        </div>

        <form className="auth-card" onSubmit={handleAuthSubmit}>
          <div className="auth-tabs">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
              type="button"
            >
              Register
            </button>
          </div>

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>

          <button className="primary" disabled={loading} type="submit">
            {loading ? 'Working...' : authMode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {session.user ? (
            <button className="ghost" onClick={handleLogout} type="button">
              Log out {session.user.email}
            </button>
          ) : null}
        </form>

        <div className="status-box">
          <h2>Status</h2>
          <p>{message}</p>
          {error ? <p className="error">{error}</p> : null}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live flows</p>
            <h2>{session.user ? `Signed in as ${session.user.role}` : 'Public product browsing'}</h2>
          </div>
          <nav className="nav">
            <button onClick={() => setView('products')} type="button">
              Products
            </button>
            <button disabled={!session.user} onClick={() => setView('cart')} type="button">
              Cart
            </button>
            <button disabled={!session.user} onClick={() => setView('orders')} type="button">
              Orders
            </button>
            <button disabled={!isAdmin} onClick={() => setView('admin')} type="button">
              Admin
            </button>
          </nav>
        </header>

        {view === 'products' ? (
          <section className="panel-grid">
            {products.map((product) => (
              <article className="panel product-card" key={product.id}>
                <div>
                  <p className="eyebrow">/{product.slug}</p>
                  <h3>{product.name}</h3>
                  <p className="price">${Number(product.price).toFixed(2)}</p>
                  <p className={product.stock > 0 ? 'stock ok' : 'stock low'}>
                    Stock: {product.stock}
                  </p>
                </div>
                <div className="card-actions">
                  <input
                    min={1}
                    onChange={(event) =>
                      setQuantityByProduct((current) => ({
                        ...current,
                        [product.id]: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={quantityByProduct[product.id] ?? 1}
                  />
                  <button
                    className="primary"
                    disabled={!session.user || product.stock === 0}
                    onClick={() => handleAddToCart(product.id)}
                    type="button"
                  >
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {view === 'cart' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Protected route</p>
                <h3>Cart</h3>
              </div>
              <button
                className="primary"
                disabled={!cart || cart.items.length === 0}
                onClick={handleCreateOrder}
                type="button"
              >
                Place order
              </button>
            </div>

            {!cart || cart.items.length === 0 ? <p>Your cart is empty.</p> : null}
            {cart?.items.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <strong>{item.product.name}</strong>
                  <p>
                    ${Number(item.product.price).toFixed(2)} x {item.quantity} = $
                    {item.lineTotal.toFixed(2)}
                  </p>
                </div>
                <div className="inline-actions">
                  <input
                    min={1}
                    onChange={(event) =>
                      void handleUpdateCartItem(item.id, Number(event.target.value))
                    }
                    type="number"
                    value={item.quantity}
                  />
                  <button className="ghost" onClick={() => handleRemoveCartItem(item.id)} type="button">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <p className="total">Total: ${cart?.total.toFixed(2) ?? '0.00'}</p>
          </section>
        ) : null}

        {view === 'orders' ? (
          <section className="panel">
            <div className="section-header">
              <div>
                <p className="eyebrow">Join-heavy query</p>
                <h3>Order history</h3>
              </div>
            </div>

            {orders.length === 0 ? <p>No orders yet.</p> : null}
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-meta">
                  <strong>Order #{order.id}</strong>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>
                  <span>{order.status}</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
                {order.items.map((item) => (
                  <p key={item.id}>
                    {item.product.name} x {item.quantity} @ ${item.priceAtPurchase.toFixed(2)}
                  </p>
                ))}
              </article>
            ))}
          </section>
        ) : null}

        {view === 'admin' ? (
          <section className="admin-grid">
            <form className="panel" onSubmit={handleAdminProductSubmit}>
              <p className="eyebrow">Role-protected route</p>
              <h3>Create or update product</h3>
              <label>
                Product ID for update
                <input
                  onChange={(event) => setAdminForm((current) => ({ ...current, id: event.target.value }))}
                  value={adminForm.id}
                />
              </label>
              <label>
                Name
                <input
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, name: event.target.value }))
                  }
                  value={adminForm.name}
                />
              </label>
              <label>
                Slug
                <input
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  value={adminForm.slug}
                />
              </label>
              <label>
                Price
                <input
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, price: event.target.value }))
                  }
                  type="number"
                  value={adminForm.price}
                />
              </label>
              <label>
                Stock
                <input
                  onChange={(event) =>
                    setAdminForm((current) => ({ ...current, stock: event.target.value }))
                  }
                  type="number"
                  value={adminForm.stock}
                />
              </label>
              <button className="primary" type="submit">
                {adminForm.id ? 'Update product' : 'Create product'}
              </button>
            </form>

            <section className="panel">
              <p className="eyebrow">Admin reporting</p>
              <h3>All orders</h3>
              {adminOrders.length === 0 ? <p>No orders to review yet.</p> : null}
              {adminOrders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-meta">
                    <strong>Order #{order.id}</strong>
                    <span>{order.user.email}</span>
                    <span>{order.status}</span>
                    <span>${order.totalAmount.toFixed(2)}</span>
                  </div>
                  {order.items.map((item) => (
                    <p key={item.id}>
                      {item.product.name} x {item.quantity}
                    </p>
                  ))}
                </article>
              ))}
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected error';
}

export default App;
