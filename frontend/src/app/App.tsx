import { startTransition, useState } from 'react';
import '../App.css';
import { AdminPanel } from '../features/admin/ui/AdminPanel';
import { AuthPanel } from '../features/auth/ui/AuthPanel';
import { SessionProvider } from '../features/auth/model/SessionProvider';
import { useSession } from '../features/auth/model/use-session';
import { CartPanel } from '../features/cart/ui/CartPanel';
import { OrdersPanel } from '../features/orders/ui/OrdersPanel';
import { ProductCatalog } from '../features/products/ui/ProductCatalog';

type View = 'products' | 'cart' | 'orders' | 'admin';

function App() {
  return (
    <SessionProvider>
      <Workbench />
    </SessionProvider>
  );
}

function Workbench() {
  const { session } = useSession();
  const [view, setView] = useState<View>('products');
  const [message, setMessage] = useState('Use the seeded accounts or register a new customer.');
  const [error, setError] = useState('');

  const isAdmin = session.user?.role === 'admin';
  const activeView =
    !session.user ? 'products' : !isAdmin && view === 'admin' ? 'products' : view;

  function handleSuccess(nextMessage: string) {
    setError('');
    setMessage(nextMessage);
  }

  function handleError(nextError: string) {
    setError(nextError);
  }

  function changeView(nextView: View) {
    setError('');
    startTransition(() => {
      setView(nextView);
    });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <p className="eyebrow">Interview Demo</p>
        <h1>Backend Recall Shop</h1>
        <p className="lede">
          Feature-based React UI with query-backed data flows for products, cart, orders, and
          admin operations.
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

        <AuthPanel
          onAuthenticated={() => changeView('products')}
          onError={handleError}
          onSuccess={handleSuccess}
        />

        <div className="status-box">
          <h2>Status</h2>
          <p>{message}</p>
          {session.user ? (
            <p className="muted">
              Session: <strong>{session.user.email}</strong> ({session.user.role})
            </p>
          ) : (
            <p className="muted">Session: guest browsing products.</p>
          )}
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
            <button
              className={activeView === 'products' ? 'active' : ''}
              onClick={() => changeView('products')}
              type="button"
            >
              Products
            </button>
            <button
              className={activeView === 'cart' ? 'active' : ''}
              disabled={!session.user}
              onClick={() => changeView('cart')}
              type="button"
            >
              Cart
            </button>
            <button
              className={activeView === 'orders' ? 'active' : ''}
              disabled={!session.user}
              onClick={() => changeView('orders')}
              type="button"
            >
              Orders
            </button>
            <button
              className={activeView === 'admin' ? 'active' : ''}
              disabled={!isAdmin}
              onClick={() => changeView('admin')}
              type="button"
            >
              Admin
            </button>
          </nav>
        </header>

        {activeView === 'products' ? (
          <ProductCatalog onError={handleError} onSuccess={handleSuccess} />
        ) : null}
        {activeView === 'cart' ? <CartPanel onError={handleError} onSuccess={handleSuccess} /> : null}
        {activeView === 'orders' ? <OrdersPanel onError={handleError} /> : null}
        {activeView === 'admin' ? (
          <AdminPanel onError={handleError} onSuccess={handleSuccess} />
        ) : null}
      </main>
    </div>
  );
}

export default App;
