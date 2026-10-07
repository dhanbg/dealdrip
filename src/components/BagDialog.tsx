'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { formatMoney, getPreviewUrl } from '@/data/catalog';

export function BagDialog() {
  const {
    isBagOpen,
    closeBag,
    cartItems,
    bagCount,
    bagTotal,
    updateQuantity,
    removeFromBag,
    openCheckout,
  } = useStore();

  useEffect(() => {
    if (isBagOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeBag();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isBagOpen, closeBag]);

  if (!isBagOpen) return null;

  const handleReviewOrder = () => {
    closeBag();
    openCheckout();
  };

  const handleExplore = () => {
    closeBag();
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="bag-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeBag();
      }}
    >
      <div className="bag-dialog" role="dialog" aria-modal="true" aria-labelledby="bag-title">
        <div className="bag-header">
          <h2 id="bag-title">
            Your bag <span id="bag-title-count">({bagCount})</span>
          </h2>
          <button
            className="icon-button"
            onClick={closeBag}
            aria-label="Close shopping bag"
          >
            ×
          </button>
        </div>

        <div id="bag-items">
          {cartItems.length > 0 ? (
            cartItems.map(({ product, quantity }) => (
              <div key={product.id} className="bag-item">
                <img
                  src={getPreviewUrl(product)}
                  alt={product.name}
                  width="95"
                  height="100"
                />
                <div>
                  <h3>{product.name}</h3>
                  <p className="bag-item-price">{formatMoney(product.price)}</p>
                  <div className="bag-item-controls">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      aria-label={`Decrease ${product.name} quantity`}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      aria-label={`Increase ${product.name} quantity`}
                    >
                      +
                    </button>
                    <button
                      className="remove-item"
                      onClick={() => removeFromBag(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-bag">
              <div className="empty-symbol">✳</div>
              <h3>A little room for possibility.</h3>
              <p>Your next favorite object is out there.</p>
              <button className="button button-dark" onClick={handleExplore}>
                Explore the collection
              </button>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="bag-summary" id="bag-summary">
            <div>
              <span>Subtotal</span>
              <strong id="bag-total">{formatMoney(bagTotal)}</strong>
            </div>
            <button className="button button-lime" onClick={handleReviewOrder}>
              Review order <span aria-hidden="true">+</span>
            </button>
            <button className="text-button continue-shopping" onClick={closeBag}>
              Keep exploring
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
