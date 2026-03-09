import { useEffect, useEffectEvent, useState } from 'react';
import { useSession } from '../../auth/model/use-session';
import { useAddToCartMutation } from '../../cart/model/use-cart';
import { useProductsQuery } from '../model/use-products';
import { getErrorMessage } from '../../../shared/lib/errors';

interface ProductCatalogProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function ProductCatalog({ onError, onSuccess }: ProductCatalogProps) {
  const { session } = useSession();
  const { data: products = [], error, isError, isPending } = useProductsQuery();
  const [quantityByProduct, setQuantityByProduct] = useState<Record<number, number>>({});
  const notifyError = useEffectEvent(onError);
  const addToCartMutation = useAddToCartMutation({ onError, onSuccess });

  useEffect(() => {
    if (isError) {
      notifyError(getErrorMessage(error));
    }
  }, [error, isError]);

  if (isPending) {
    return (
      <section className="panel loading-panel">
        <p className="eyebrow">Public query</p>
        <h3>Products</h3>
        <p>Loading products...</p>
      </section>
    );
  }

  return (
    <section className="panel-grid">
      {products.map((product) => (
        <article className="panel product-card" key={product.id}>
          <div>
            <p className="eyebrow">/{product.slug}</p>
            <h3>{product.name}</h3>
            <p className="price">${Number(product.price).toFixed(2)}</p>
            <p className={product.stock > 0 ? 'stock ok' : 'stock low'}>Stock: {product.stock}</p>
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
              disabled={!session.user || product.stock === 0 || addToCartMutation.isPending}
              onClick={() =>
                addToCartMutation.mutate({
                  productId: product.id,
                  quantity: quantityByProduct[product.id] ?? 1,
                })
              }
              type="button"
            >
              Add to cart
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
