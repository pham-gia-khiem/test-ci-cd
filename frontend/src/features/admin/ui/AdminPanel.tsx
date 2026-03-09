import { useEffect, useEffectEvent, useState } from 'react';
import type { FormEvent } from 'react';
import { useSession } from '../../auth/model/use-session';
import { useAdminOrdersQuery, useProductMutations } from '../model/use-admin';
import { getErrorMessage } from '../../../shared/lib/errors';

interface AdminPanelProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

interface AdminFormState {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: string;
}

const emptyForm: AdminFormState = {
  id: '',
  name: '',
  slug: '',
  price: '',
  stock: '',
};

export function AdminPanel({ onError, onSuccess }: AdminPanelProps) {
  const { session } = useSession();
  const [adminForm, setAdminForm] = useState<AdminFormState>(emptyForm);
  const adminOrdersQuery = useAdminOrdersQuery();
  const notifyError = useEffectEvent(onError);
  const { createProductMutation, updateProductMutation } = useProductMutations({
    onError,
    onSuccess,
  });

  useEffect(() => {
    if (adminOrdersQuery.isError) {
      notifyError(getErrorMessage(adminOrdersQuery.error));
    }
  }, [adminOrdersQuery.error, adminOrdersQuery.isError]);

  if (session.user?.role !== 'admin') {
    return (
      <section className="panel">
        <p className="eyebrow">Role-protected route</p>
        <h3>Admin</h3>
        <p>Admin access is required for this workspace.</p>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onError('');

    const payload = {
      id: adminForm.id ? Number(adminForm.id) : undefined,
      name: adminForm.name,
      slug: adminForm.slug,
      price: Number(adminForm.price),
      stock: Number(adminForm.stock),
    };

    try {
      if (payload.id) {
        await updateProductMutation.mutateAsync(payload);
      } else {
        await createProductMutation.mutateAsync(payload);
      }

      setAdminForm(emptyForm);
    } catch {
      // Mutation handlers already push status.
    }
  }

  return (
    <section className="admin-grid">
      <form className="panel" onSubmit={handleSubmit}>
        <p className="eyebrow">Role-protected route</p>
        <h3>Create or update product</h3>
        <label>
          Product ID for update
          <input
            onChange={(event) =>
              setAdminForm((current) => ({ ...current, id: event.target.value }))
            }
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
        <button
          className="primary"
          disabled={createProductMutation.isPending || updateProductMutation.isPending}
          type="submit"
        >
          {adminForm.id ? 'Update product' : 'Create product'}
        </button>
      </form>

      <section className="panel">
        <p className="eyebrow">Admin reporting</p>
        <h3>All orders</h3>
        {adminOrdersQuery.isPending ? <p>Loading orders...</p> : null}
        {adminOrdersQuery.data?.length === 0 ? <p>No orders to review yet.</p> : null}
        {adminOrdersQuery.data?.map((order) => (
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
  );
}
