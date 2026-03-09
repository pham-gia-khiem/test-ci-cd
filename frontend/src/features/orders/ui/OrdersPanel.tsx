import { useEffect, useEffectEvent } from 'react';
import { useSession } from '../../auth/model/use-session';
import { useOrdersQuery } from '../model/use-orders';
import { getErrorMessage } from '../../../shared/lib/errors';

interface OrdersPanelProps {
  onError: (message: string) => void;
}

export function OrdersPanel({ onError }: OrdersPanelProps) {
  const { session } = useSession();
  const ordersQuery = useOrdersQuery();
  const notifyError = useEffectEvent(onError);

  useEffect(() => {
    if (ordersQuery.isError) {
      notifyError(getErrorMessage(ordersQuery.error));
    }
  }, [ordersQuery.error, ordersQuery.isError]);

  if (!session.user) {
    return (
      <section className="panel">
        <p className="eyebrow">Join-heavy query</p>
        <h3>Order history</h3>
        <p>Log in to review your orders.</p>
      </section>
    );
  }

  if (ordersQuery.isPending) {
    return (
      <section className="panel loading-panel">
        <p className="eyebrow">Join-heavy query</p>
        <h3>Order history</h3>
        <p>Loading orders...</p>
      </section>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
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
  );
}
