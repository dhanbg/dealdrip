import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserOrders } from '@/db/queries/orders';
import { formatMoney } from '@/data/catalog';
import { ArrowLeft, Package, Clock, Truck, CheckCircle2 } from 'lucide-react';

export default async function AccountOrdersPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;
  // Strictly scoped to the authenticated user ID
  const orders = await getUserOrders(user.id);

  return (
    <div className="cart-page-wrapper">
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>
          <Link href="/account" className="checkout-back-link">
            <ArrowLeft size={16} />
            <span>Back to Account</span>
          </Link>
        </div>
      </header>

      <main className="cart-page-container">
        <div className="cart-page-heading">
          <div className="cart-heading-title-group">
            <span className="eyebrow">ORDER HISTORY</span>
            <h1>My Orders ({orders.length})</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Track past and active deliveries placed under {user.email}.
            </p>
          </div>
        </div>

        {orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {orders.map((order) => (
              <div key={order.id} className="form-card" style={{ padding: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid var(--line)',
                    paddingBottom: 16,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Order Reference
                    </span>
                    <h2
                      style={{
                        fontSize: 20,
                        color: 'var(--lime)',
                        fontFamily: 'var(--display)',
                        margin: '2px 0 0',
                      }}
                    >
                      {order.orderReference}
                    </h2>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>
                      Payment: {order.paymentMethod.toUpperCase()} ({order.paymentStatus})
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 9999,
                        background:
                          order.status === 'delivered'
                            ? 'rgba(0, 240, 255, 0.15)'
                            : 'rgba(255, 255, 255, 0.08)',
                        color: order.status === 'delivered' ? 'var(--lime)' : 'var(--paper)',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {order.items.map((it) => (
                    <li
                      key={it.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 14,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {it.thumbnail && (
                          <img
                            src={it.thumbnail}
                            alt=""
                            width={40}
                            height={40}
                            style={{ borderRadius: 6, background: 'var(--surface-card)' }}
                          />
                        )}
                        <div>
                          <strong>{it.productNameSnapshot}</strong>
                          {it.variantNameSnapshot && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block' }}>
                              Finish: {it.variantNameSnapshot}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span>
                          {it.quantity} × {formatMoney(it.unitPrice)}
                        </span>
                        <strong style={{ display: 'block', color: 'var(--lime)' }}>
                          {formatMoney(it.lineTotal)}
                        </strong>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Footer / Destination */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--line)',
                    paddingTop: 14,
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <strong>Delivering to:</strong> {order.deliveryAddress.municipality}, Ward {order.deliveryAddress.ward}, {order.deliveryAddress.areaTole}, {order.deliveryAddress.district}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 13 }}>Order Total: </span>
                      <strong style={{ fontSize: 18, color: 'var(--paper)', fontFamily: 'var(--display)' }}>
                        {formatMoney(order.total)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Link
                        href={`/order-confirmation/${order.orderReference}`}
                        className="button button-outline"
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        View Receipt
                      </Link>

                      {order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                        <Link
                          href={`/checkout/payment-failed?orderRef=${order.orderReference}&reason=retry_payment`}
                          className="button button-lime"
                          style={{ fontSize: 12, padding: '4px 10px' }}
                        >
                          Pay / Retry
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

          </div>
        ) : (
          <div className="cart-empty-container">
            <div className="empty-symbol">✳</div>
            <h2>No orders yet</h2>
            <p>Your orders will appear here once you make your first purchase.</p>
            <Link href="/#collection" className="button button-lime">
              Explore Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
