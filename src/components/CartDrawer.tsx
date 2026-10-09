'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import {
  useCartStore,
  selectCartItemsList,
  selectCartTotalCount,
  selectCartSubtotal,
} from '@/store/useCartStore';
import { formatMoney } from '@/data/catalog';

export function CartDrawer() {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);

  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const itemsMap = useCartStore((s) => s.items);
  const isHydrated = useCartStore((s) => s.isHydrated);
  const increment = useCartStore((s) => s.incrementQuantity);
  const decrement = useCartStore((s) => s.decrementQuantity);
  const remove = useCartStore((s) => s.removeItem);

  const cartItems = isHydrated ? Object.values(itemsMap) : [];
  const totalCount = isHydrated
    ? cartItems.reduce((acc, it) => acc + it.quantity, 0)
    : 0;
  const subtotal = isHydrated
    ? cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0)
    : 0;

  // Accessibility: close on Escape & lock body scroll
  useEffect(() => {
    if (!isDrawerOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus close button inside drawer on mount
    const closeBtn = drawerRef.current?.querySelector<HTMLButtonElement>(
      'button[aria-label="Close cart drawer"]'
    );
    closeBtn?.focus();

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const handleCheckoutClick = () => {
    closeDrawer();
    router.push('/checkout');
  };

  const handleViewCartClick = () => {
    closeDrawer();
    router.push('/cart');
  };

  const handleExploreClick = () => {
    closeDrawer();
    const el = document.getElementById('collection');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#collection');
    }
  };

  return (
    <div
      className="cart-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDrawer();
      }}
      role="presentation"
    >
      <aside
        ref={drawerRef}
        className="cart-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title-wrap">
            <ShoppingBag className="cart-drawer-icon" size={20} strokeWidth={1.8} />
            <h2 id="cart-drawer-title">Shopping Bag</h2>
            <span className="cart-drawer-badge" aria-label={`${totalCount} items`}>
              {totalCount}
            </span>
          </div>
          <button
            type="button"
            className="cart-drawer-close-btn"
            onClick={closeDrawer}
            aria-label="Close cart drawer"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Items List */}
        <div className="cart-drawer-body">
          {cartItems.length > 0 ? (
            <ul className="cart-drawer-items" aria-label="Cart items">
              {cartItems.map((item) => (
                <li key={item.id} className="cart-drawer-item">
                  <div className="cart-drawer-thumb">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      width={80}
                      height={80}
                      loading="lazy"
                    />
                  </div>

                  <div className="cart-drawer-details">
                    <div className="cart-drawer-item-head">
                      <h3 className="cart-drawer-item-name">{item.name}</h3>
                      <button
                        type="button"
                        className="cart-drawer-remove-btn"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name} from bag`}
                        title="Remove item"
                      >
                        <Trash2 size={16} strokeWidth={1.6} />
                      </button>
                    </div>

                    {item.variantName && (
                      <div className="cart-drawer-variant">
                        {item.color && (
                          <span
                            className="cart-drawer-color-dot"
                            style={{ backgroundColor: item.color }}
                            aria-hidden="true"
                          />
                        )}
                        <span>{item.variantName}</span>
                      </div>
                    )}

                    <div className="cart-drawer-item-footer">
                      <div className="cart-drawer-qty-controls" role="group" aria-label="Quantity controls">
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          onClick={() => decrement(item.id)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus size={14} strokeWidth={2} />
                        </button>
                        <span className="cart-drawer-qty-value" aria-label={`Quantity ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="cart-drawer-qty-btn"
                          onClick={() => increment(item.id)}
                          disabled={item.quantity >= 99}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus size={14} strokeWidth={2} />
                        </button>
                      </div>

                      <div className="cart-drawer-price-wrap">
                        <span className="cart-drawer-unit-price">
                          {formatMoney(item.price)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="cart-drawer-line-total">
                            Total: {formatMoney(item.price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cart-drawer-empty">
              <div className="cart-drawer-empty-icon" aria-hidden="true">
                ✳
              </div>
              <h3>Your cart is empty</h3>
              <p>Explore our curated audio, gaming, and everyday essentials.</p>
              <button
                type="button"
                className="button button-lime cart-drawer-explore-btn"
                onClick={handleExploreClick}
              >
                Explore Products
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-summary-row">
              <span className="cart-drawer-summary-label">Subtotal</span>
              <span className="cart-drawer-summary-value">{formatMoney(subtotal)}</span>
            </div>
            <div className="cart-drawer-shipping-note">
              <span>Delivery</span>
              <span className="cart-drawer-shipping-badge">Calculated at checkout</span>
            </div>

            <div className="cart-drawer-actions">
              <button
                type="button"
                className="button button-lime cart-drawer-checkout-btn"
                onClick={handleCheckoutClick}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={18} strokeWidth={2} />
              </button>

              <button
                type="button"
                className="button cart-drawer-viewcart-btn"
                onClick={handleViewCartClick}
              >
                View Full Cart
              </button>
            </div>

            <p className="cart-drawer-guarantee">
              Nepal-wide delivery · Cash on Delivery available
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
