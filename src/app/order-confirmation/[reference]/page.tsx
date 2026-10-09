import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrderByReference } from '@/db/queries/orders';
import { formatMoney } from '@/data/catalog';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  MapPin,
  CreditCard,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

interface OrderConfirmationProps {
  params: Promise<{
    reference: string;
  }>;
}

export default async function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const { reference } = await params;
  const order = await getOrderByReference(reference);

  if (!order) {
    notFound();
  }

  const isCod = order.paymentMethod === 'cod';
  const isPaid = order.paymentStatus === 'paid';
  const isOnlinePayment = order.paymentMethod === 'esewa' || order.paymentMethod === 'nps';

  return (
    <div className="checkout-page-wrapper" style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>
          <div className="checkout-header-actions">
            <div className="checkout-secure-badge">
              <ShieldCheck size={16} />
              <span>Verified Store Order</span>
            </div>
          </div>
        </div>
      </header>

      <main className="checkout-confirmation-container" style={{ maxWidth: '840px', margin: '2rem auto', padding: '0 1.25rem' }}>
        <div className="confirmation-card" style={{
          background: 'var(--panel-bg, #121316)',
          border: '1px solid var(--border-color, #23272f)',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
        }}>
          {/* Header Status */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isPaid || isCod ? 'rgba(74, 222, 128, 0.12)' : 'rgba(234, 179, 8, 0.12)',
              color: isPaid || isCod ? '#4ade80' : '#eab308',
              marginBottom: '1.25rem',
            }}>
              {isPaid || isCod ? <CheckCircle2 size={36} /> : <Clock size={36} />}
            </div>

            <div style={{
              display: 'inline-block',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: isPaid ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: isPaid ? '#4ade80' : 'var(--text-muted, #94a3b8)',
              marginBottom: '0.75rem',
            }}>
              {isPaid
                ? 'Payment Authoritatively Verified · Paid'
                : isCod
                ? 'Order Placed · Cash On Delivery'
                : 'Pending Gateway Capture · Neon DB Persisted'}
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              {isPaid
                ? 'Payment & Order Confirmed!'
                : isCod
                ? 'Order Placed Successfully!'
                : 'Order Initiated & Awaiting Payment'}
            </h1>
            <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0 0 1rem 0', fontSize: '1rem' }}>
              Thank you for ordering with Deal Drip. Your order reference is:
            </p>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              borderRadius: '8px',
              background: 'var(--surface-color, #1a1d24)',
              border: '1px solid var(--border-color, #2e3440)',
              fontFamily: 'monospace',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#dfff4f',
              letterSpacing: '0.05em',
            }}>
              {order.orderReference}
            </div>
          </div>

          {/* Payment Status Notice */}
          <div style={{
            background: isPaid ? 'rgba(74, 222, 128, 0.05)' : 'var(--surface-color, #181b22)',
            border: `1px solid ${isPaid ? 'rgba(74, 222, 128, 0.2)' : 'var(--border-color, #272c38)'}`,
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
          }}>
            <CreditCard size={22} style={{ color: isPaid ? '#4ade80' : '#dfff4f', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Payment Method: {order.paymentMethod.toUpperCase()}</span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: isPaid ? 'rgba(74, 222, 128, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: isPaid ? '#4ade80' : '#eab308',
                }}>
                  Status: {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', margin: 0, lineHeight: 1.5 }}>
                {isPaid && 'Your payment of ' + formatMoney(order.total) + ' was authoritatively verified. Inventory has been permanently deducted from inventory ledger and order is confirmed for fulfillment.'}
                {isCod && 'Your order will be verified and dispatched via express courier in Nepal. Cash payment of ' + formatMoney(order.total) + ' is due upon delivery.'}
                {isOnlinePayment && !isPaid && 'Your order has been initiated, but payment confirmation is still pending from the provider.'}
              </p>
              {isOnlinePayment && !isPaid && (
                <div style={{ marginTop: '0.75rem' }}>
                  <Link
                    href={`/checkout/payment-failed?orderRef=${order.orderReference}&reason=pending_verification`}
                    className="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: 'rgba(234, 179, 8, 0.15)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      color: '#facc15',
                      borderRadius: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <span>Complete or Retry Payment</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>


          {/* Items Breakdown */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color, #23272f)', paddingBottom: '0.5rem' }}>
              Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {order.items.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'var(--surface-color, #181b22)',
                  border: '1px solid var(--border-color, #23272f)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.productNameSnapshot}
                        style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px', background: '#0a0b0d' }}
                      />
                    ) : (
                      <Package size={24} style={{ color: 'var(--text-muted, #64748b)' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.productNameSnapshot}</div>
                      {item.variantNameSnapshot && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)' }}>
                          Finish: {item.variantNameSnapshot} {item.skuSnapshot ? `· SKU: ${item.skuSnapshot}` : ''}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                        Quantity: {item.quantity} × {formatMoney(item.unitPrice)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                    {formatMoney(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Delivery Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}>
            {/* Delivery Details */}
            <div style={{
              background: 'var(--surface-color, #181b22)',
              border: '1px solid var(--border-color, #23272f)',
              borderRadius: '12px',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <MapPin size={18} style={{ color: '#dfff4f' }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Delivery Details</h4>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6 }}>
                <div><strong style={{ color: '#fff' }}>Recipient:</strong> {order.customerName}</div>
                <div><strong style={{ color: '#fff' }}>Phone:</strong> {order.customerPhone}</div>
                <div><strong style={{ color: '#fff' }}>Email:</strong> {order.customerEmail}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <strong style={{ color: '#fff' }}>Address:</strong><br />
                  {order.deliveryAddress.areaTole}, Ward {order.deliveryAddress.ward}<br />
                  {order.deliveryAddress.municipality}, {order.deliveryAddress.district}<br />
                  {order.deliveryAddress.province}, Nepal
                </div>
                {order.deliveryAddress.streetLandmark && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <strong style={{ color: '#fff' }}>Landmark:</strong> {order.deliveryAddress.streetLandmark}
                  </div>
                )}
              </div>
            </div>

            {/* Price Summary */}
            <div style={{
              background: 'var(--surface-color, #181b22)',
              border: '1px solid var(--border-color, #23272f)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700 }}>Payment Summary</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary, #94a3b8)' }}>
                  <span>Delivery (Nepal)</span>
                  <span style={{ color: '#4ade80' }}>Calculated at checkout</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color, #2e3440)', margin: '0.75rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800 }}>
                  <span>Total Amount</span>
                  <span style={{ color: '#dfff4f' }}>{formatMoney(order.total)}</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
                Order Status: <span style={{ textTransform: 'capitalize', color: '#fff', fontWeight: 600 }}>{order.status.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/"
              className="button button-lime"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.75rem',
                borderRadius: '8px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <ShoppingBag size={18} />
              <span>Continue Shopping</span>
            </Link>

            <Link
              href="/account/orders"
              className="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.75rem',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-color, #2e3440)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>View Account Orders</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
