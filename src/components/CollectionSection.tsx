'use client';

import React from 'react';
import { catalog, formatMoney, getPreviewUrl } from '@/data/catalog';
import { useStore, CategoryFilter } from '@/context/StoreContext';

const categories: { label: string; value: CategoryFilter }[] = [
  { label: 'All objects', value: 'All' },
  { label: 'Audio', value: 'Audio' },
  { label: 'Gaming', value: 'Gaming' },
  { label: 'Everyday', value: 'Everyday' },
];

export function CollectionSection() {
  const { filter, setFilter, filteredProducts, openQuickview, addToBag } = useStore();

  return (
    <section className="collection-section" id="collection">
      <div className="section-topline">
        <span>FEATURED PRODUCTS</span>
        <span>INTERACTIVE 3D CATALOG</span>
      </div>

      <div className="collection-heading reveal">
        <h2>
          FEATURED<br />
          <span>PRODUCTS.</span>
        </h2>
        <p>
          A clean product section with interactive cards.<br />
          Hover to preview the 3D model.
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
          return (
            <article key={p.id} className="product-card">
              <button
                className="product-image-button"
                onClick={() => openQuickview(p)}
                aria-label={`Explore ${p.name} in 3D`}
              >
                <span className="product-index">{indexNum} /</span>
                {p.badge && <span className="product-badge">{p.badge}</span>}
                <img
                  src={getPreviewUrl(p)}
                  alt={p.name}
                  width="760"
                  height="640"
                  loading="lazy"
                />
                <span className="quickview-hint">Explore in 3D +</span>
              </button>

              <div className="product-info">
                <div>
                  <div className="product-category">{p.category}</div>
                  <h3>
                    <button onClick={() => openQuickview(p)}>{p.name}</button>
                  </h3>
                  <p className="product-price">{formatMoney(p.price)}</p>
                </div>
                <button
                  className="add-circle"
                  onClick={() => addToBag(p.id)}
                  aria-label={`Add ${p.name} to bag`}
                >
                  +
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
