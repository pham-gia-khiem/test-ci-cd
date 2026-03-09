import { useEffect, useEffectEvent } from 'react';
import { useSession } from '../../auth/model/use-session';
import { useCreateOrderMutation } from '../../orders/model/use-orders';
import { useCartItemMutations, useCartQuery } from '../model/use-cart';
import { getErrorMessage } from '../../../shared/lib/errors';

interface CartPanelProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function CartPanel({ onError, onSuccess }: CartPanelProps) {
  const { session } = useSession();
  const cartQuery = useCartQuery();
  const notifyError = useEffectEvent(onError);
  const { updateItemMutation, removeItemMutation } = useCartItemMutations({ onError });
  const createOrderMutation = useCreateOrderMutation({ onError, onSuccess });

  useEffect(() => {
    if (cartQuery.isError) {
      notifyError(getErrorMessage(cartQuery.error));
    }
  }, [cartQuery.error, cartQuery.isError]);

  if (!session.user) {
    return (
      <section className="panel">
        <p className="eyebrow">Protected route</p>
        <h3>Cart</h3>
        <p>Log in to review your cart.</p>
      </section>
    );
  }

  if (cartQuery.isPending) {
    return (
      <section className="panel loading-panel">
        <p className="eyebrow">Protected route</p>
        <h3>Cart</h3>
        <p>Loading cart...</p>
      </section>
    );
  }

  const cart = cartQuery.data;

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">Protected route</p>
          <h3>Cart</h3>
        </div>
        <button
          className="primary"
          disabled={!cart || cart.items.length === 0 || createOrderMutation.isPending}
          onClick={() => createOrderMutation.mutate()}
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
              ${Number(item.product.price).toFixed(2)} x {item.quantity} = ${item.lineTotal.toFixed(2)}
            </p>
          </div>
          <div className="inline-actions">
            <input
              min={1}
              onChange={(event) =>
                updateItemMutation.mutate({
                  itemId: item.id,
                  quantity: Number(event.target.value),
                })
              }
              type="number"
              value={item.quantity}
            />
            <button className="ghost" onClick={() => removeItemMutation.mutate(item.id)} type="button">
              Remove
            </button>
          </div>
        </div>
      ))}
      <p className="total">Total: ${cart?.total.toFixed(2) ?? '0.00'}</p>
    </section>
  );
}
