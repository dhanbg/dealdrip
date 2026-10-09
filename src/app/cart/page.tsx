'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatMoney } from '@/data/catalog';

export default function CartPage() {
  const router = useRouter();
  const itemsMap = useCartStore((s) => s.items);
  const isHydrated = useCartStore((s) => s.isHydrated);
  const increment = useCartStore((s) => s.incrementQuantity);
  const decrement = useCartStore((s) => s.decrementQuantity);
  const remove = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const cartItems = isHydrated ? Object.values(itemsMap) : [];
  const totalCount = isHydrated
    ? cartItems.reduce((acc, it) => acc + it.quantity, 0)
    : 0;
  const subtotal = isHydrated
    ? cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0)
    : 0;

  return (
    <div className="cart-page-wrapper">
      {/* Distraction-free clean header */}
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>

          <div className="checkout-header-actions">
            <Link href="/#collection" className="checkout-back-link">
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="cart-page-container">
        <div className="cart-page-heading">
          <div className="cart-heading-title-group">
            <span className="eyebrow">YOUR SELECTION</span>
            <h1>
              Shopping Cart <span>({totalCount})</span>
            </h1>
          </div>
          {cartItems.length > 0 && (
            <button
              type="button"
              className="cart-clear-all-btn"
              onClick={clearCart}
              title="Clear all items in cart"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length > 0 ? (
          <div className="cart-page-grid">
            {/* Left: Cart Items List */}
            <div className="cart-items-section">
              <div className="cart-items-card">
                <ul className="cart-page-list" aria-label="Shopping cart items">
                  {cartItems.map((item) => (
                    <li key={item.id} className="cart-page-item">
                      <div className="cart-item-image-box">
                        <img
                          src={item.thumbnail}
                          alt={item.name}
                          width={110}
                          height={110}
                          loading="lazy"
                        />
                      </div>

                      <div className="cart-item-details-box">
                        <div className="cart-item-header-row">
                          <div>
                            <h2 className="cart-item-title">{item.name}</h2>
                            {item.variantName && (
                              <div className="cart-item-variant-pill">
                                {item.color && (
                                  <span
                                    className="cart-variant-swatch"
                                    style={{ backgroundColor: item.color }}
                                    aria-hidden="true"
                                  />
                                )}
                                <span>Finish: {item.variantName}</span>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className="cart-item-delete-btn"
                            onClick={() => remove(item.id)}
                            aria-label={`Remove ${item.name} from cart`}
                            title="Remove item"
                          >
                            <Trash2 size={18} strokeWidth={1.7} />
                          </button>
                        </div>

                        <div className="cart-item-controls-row">
                          <div className="cart-qty-picker" role="group" aria-label="Item quantity">
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => decrement(item.id)}
                              disabled={item.quantity <= 1}
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus size={15} strokeWidth={2} />
                            </button>
                            <span className="cart-qty-display">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart-qty-btn"
                              onClick={() => increment(item.id)}
                              disabled={item.quantity >= 99}
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus size={15} strokeWidth={2} />
                            </button>
                          </div>

                          <div className="cart-item-pricing">
                            <span className="cart-item-price-each">
                              {formatMoney(item.price)} each
                            </span>
                            <span className="cart-item-price-total">
                              {formatMoney(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Assurance badges */}
              <div className="cart-assurances-grid">
                <div className="cart-assurance-pill">
                  <Truck size={20} className="assurance-icon" />
                  <div>
                    <strong>Nepal Delivery</strong>
                    <p>Direct shipping to all 7 provinces</p>
                  </div>
                </div>
                <div className="cart-assurance-pill">
                  <ShieldCheck size={20} className="assurance-icon" />
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when parcel arrives at your door</p>
                  </div>
                </div>
                <div className="cart-assurance-pill">
                  <RotateCcw size={20} className="assurance-icon" />
                  <div>
                    <strong>Quality Guarantee</strong>
                    <p>Authentic Deal Drip curated hardware</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sticky Order Summary */}
            <aside className="cart-summary-section" aria-label="Order summary">
              <div className="cart-summary-card">
                <h2>Order Summary</h2>

                <div className="cart-summary-breakdown">
                  <div className="summary-row">
                    <span>Subtotal ({totalCount} units)</span>
                    <strong>{formatMoney(subtotal)}</strong>
                  </div>

                  <div className="summary-row">
                    <span>Shipping</span>
                    <span className="shipping-estimate-pill">
                      Calculated at checkout
                    </span>
                  </div>

                  <div className="summary-divider" />

                  <div className="summary-row summary-row-total">
                    <span>Estimated Total</span>
                    <strong className="summary-total-price">
                      {formatMoney(subtotal)}
                    </strong>
                  </div>
                </div>

                <div className="summary-notes">
                  <p>
                    Final shipping calculation and delivery options are confirmed at checkout based on your Nepal delivery address.
                  </p>
                </div>

                <Link
                  href="/checkout"
                  className="button button-lime cart-checkout-cta"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={18} strokeWidth={2} />
                </Link>

                <div className="cart-summary-secondary">
                  <Link href="/#collection" className="cart-keep-shopping-link">
                    ← Or keep exploring the collection
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="cart-empty-container">
            <div className="empty-symbol" aria-hidden="true">
              ✳
            </div>
            <h2>Your cart is empty.</h2>
            <p>
              Explore our curated audio, gaming, and everyday essentials in interactive 3D.
            </p>
            <Link href="/#collection" className="button button-lime">
              Explore Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
