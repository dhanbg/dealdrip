'use client';

import React, { useState } from 'react';
import { catalog, formatMoney, getPreviewUrl } from '@/data/catalog';
import { useStore, CategoryFilter } from '@/context/StoreContext';
import { ShoppingBag, Check, SlidersHorizontal, Eye } from 'lucide-react';

const categories: { label: string; value: CategoryFilter }[] = [
  { label: 'All objects', value: 'All' },
  { label: 'Audio', value: 'Audio' },
  { label: 'Gaming', value: 'Gaming' },
  { label: 'Everyday', value: 'Everyday' },
];

export function CollectionSection() {
  const {
    filter,
    setFilter,
    filteredProducts,
    openQuickview,
    addToBag,
  } = useStore();

  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);

  const handleAddDirect = (productId: string, variantId?: string) => {
    addToBag(productId, 1, variantId);
    setRecentlyAddedId(productId);
    setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === productId ? null : curr));
    }, 1800);
  };

  return (
    <section className="collection-section" id="collection">
      <div className="section-topline">
        <span>CURATED HARDWARE</span>
        <span>INTERACTIVE 3D CATALOG</span>
      </div>

      <div className="collection-heading reveal">
        <h2>
          FEATURED<br />
          <span>PRODUCTS.</span>
        </h2>
        <p>
          Thoughtfully engineered audio, gaming equipment, and everyday essentials.<br />
          Explore each object in interactive 3D, compare finishes, and elevate your setup.
        </p>
      </div>

      <div className="collection-tools">
        <div className="category-tabs" role="tablist" aria-label="Product categories">
          {categories.map((c) => {
            const isActive = filter === c.value;
            const count =
              c.value === 'All'
                ? catalog.length
                : catalog.filter((p) => p.category === c.value).length;
            return (
              <button
                key={c.value}
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'active' : ''}
                onClick={() => setFilter(c.value)}
              >
                {c.label} {c.value === 'All' && <span>{count}</span>}
              </button>
            );
          })}
        </div>
        <span className="product-counter" id="product-counter">
          {filteredProducts.length} objects
        </span>
      </div>

      <div className="product-grid" id="product-grid">
        {filteredProducts.map((p) => {
          const indexNum = String(catalog.indexOf(p) + 1).padStart(2, '0');
          const currentVariantId = p.defaultVariant;
          const hasVariants = Boolean(p.variants && p.variants.length > 1);
          const isJustAdded = recentlyAddedId === p.id;

          return (
            <article key={p.id} className="product-card">
              <button
                type="button"
                className="product-image-button"
                onClick={() => openQuickview(p, currentVariantId)}
                aria-label={`Explore ${p.name} in 3D`}
              >
                <span className="product-index">{indexNum} /</span>
                {p.badge && <span className="product-badge">{p.badge}</span>}
                <img
                  src={getPreviewUrl(p, currentVariantId)}
                  alt={p.name}
                  width="760"
                  height="640"
                  loading="lazy"
                />
                <span className="card-interactive-tag" aria-hidden="true">
                  <Eye size={13} strokeWidth={2.2} />
                  <span>3D View</span>
                </span>
                <span className="quickview-hint">Explore in 3D +</span>
              </button>

              <div className="product-info">
                <div className="product-meta">
                  <div className="product-category">{p.category}</div>
                  <h3 className="product-title">
                    <button
                      type="button"
                      onClick={() => openQuickview(p, currentVariantId)}
                      aria-label={`View details for ${p.name}`}
                    >
                      {p.name}
                    </button>
                  </h3>

                  {hasVariants && p.variants && (
                    <div className="product-card-variants" aria-label={`${p.variants.length} finishes available`}>
                      <span className="variant-dots-row">
                        {p.variants.slice(0, 5).map((v) => (
                          <span
                            key={v.id}
                            className="variant-mini-dot"
                            style={{ backgroundColor: v.color }}
                            title={v.name}
                          />
                        ))}
                        {p.variants.length > 5 && (
                          <span className="variant-more-count">+{p.variants.length - 5}</span>
                        )}
                      </span>
                      <span className="variant-count-text">{p.variants.length} finishes</span>
                    </div>
                  )}

                  <p className="product-price">{formatMoney(p.price)}</p>
                </div>

                <div className="product-card-actions">
                  {hasVariants ? (
                    <button
                      type="button"
                      className="product-card-btn product-card-btn-options"
                      onClick={() => openQuickview(p, currentVariantId)}
                      aria-label={`Choose options for ${p.name}`}
                    >
                      <SlidersHorizontal size={15} strokeWidth={2} />
                      <span>Choose options</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`product-card-btn product-card-btn-add ${isJustAdded ? 'is-added' : ''}`}
                      onClick={() => handleAddDirect(p.id, currentVariantId)}
                      aria-label={isJustAdded ? `${p.name} added to bag` : `Add ${p.name} to bag`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check size={16} strokeWidth={2.5} />
                          <span>Added to bag</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={15} strokeWidth={2} />
                          <span>Add to bag</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
