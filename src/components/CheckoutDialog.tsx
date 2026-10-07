'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { formatMoney } from '@/data/catalog';

export function CheckoutDialog() {
  const { isCheckoutOpen, closeCheckout, cartItems, bagTotal } = useStore();

  useEffect(() => {
    if (isCheckoutOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeCheckout();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isCheckoutOpen, closeCheckout]);

  if (!isCheckoutOpen) return null;

  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCheckout();
      }}
    >
      <div
        className="checkout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <button
          className="dialog-close icon-button"
          onClick={closeCheckout}
          aria-label="Close order review"
        >
          ×
        </button>
        <span className="eyebrow">YOUR NEXT SETUP</span>
        <h2 id="checkout-title">
          Looking good<br />together.
        </h2>
        <div id="checkout-items">
          {cartItems.map(({ product, quantity }) => (
            <div key={product.id} className="checkout-row">
              <span>
                {quantity} × {product.name}
              </span>
              <span>{formatMoney(product.price * quantity)}</span>
            </div>
          ))}
        </div>
        <div className="checkout-total">
          <span>Order total</span>
          <strong id="checkout-total">{formatMoney(bagTotal)}</strong>
        </div>
        <p className="checkout-note">
          Checkout preview. No order or payment is submitted.
        </p>
        <button className="button button-dark" onClick={closeCheckout}>
          Continue exploring
        </button>
      </div>
    </div>
  );
}
