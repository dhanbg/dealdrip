import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserOrders } from '@/db/queries/orders';
import { getUserAddresses } from '@/db/queries/addresses';
import { formatMoney } from '@/data/catalog';
import {
  Package,
  MapPin,
  LogOut,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { SignOutButton } from './SignOutButton';

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;
  const orders = await getUserOrders(user.id);
  const addresses = await getUserAddresses(user.id);
  const isAdmin = user.role === 'admin';

  return (
    <div className="cart-page-wrapper">
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>
          <div className="checkout-header-actions">
            {isAdmin && (
              <Link href="/admin" className="checkout-secure-badge" style={{ textDecoration: 'none' }}>
                <ShieldCheck size={16} />
                <span>Admin Dashboard</span>
              </Link>
            )}
            <Link href="/" className="checkout-back-link">
              <span>Return to Store</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="cart-page-container">
        <div className="cart-page-heading">
          <div className="cart-heading-title-group">
            <span className="eyebrow">CUSTOMER PORTAL</span>
            <h1>
              Welcome, {user.name}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              {user.email} · {isAdmin ? 'Administrator' : 'Customer Account'}
            </p>
          </div>

          <SignOutButton />
        </div>

        <div className="draft-summary-grid" style={{ marginBottom: 32 }}>
          {/* Quick Stats / Navigation */}
          <Link href="/account/orders" className="form-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Package size={22} color="var(--lime)" />
                <h2 style={{ fontSize: 18, margin: 0 }}>My Orders</h2>
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {orders.length} order{orders.length === 1 ? '' : 's'} placed. View status, delivery tracking, and purchase details.
            </p>
          </Link>

          <Link href="/account/addresses" className="form-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={22} color="var(--lime)" />
                <h2 style={{ fontSize: 18, margin: 0 }}>Saved Nepal Addresses</h2>
              </div>
              <ArrowRight size={18} color="var(--text-muted)" />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              {addresses.length} saved address{addresses.length === 1 ? '' : 'es'}. Manage doorstep delivery destinations across Nepal.
            </p>
          </Link>
        </div>

        {/* Recent Orders Preview */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Recent Orders</h2>
            {orders.length > 0 && (
              <Link href="/account/orders" style={{ fontSize: 13, color: 'var(--lime)', textDecoration: 'underline' }}>
                View all ({orders.length})
              </Link>
            )}
          </div>

          {orders.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {orders.slice(0, 3).map((order) => (
                <li
                  key={order.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: 'var(--surface-card)',
                    borderRadius: 8,
                    border: '1px solid var(--line)',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 15, color: 'var(--lime)', fontFamily: 'var(--display)' }}>
                      {order.orderReference}
                    </strong>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item(s) · {order.paymentMethod.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{formatMoney(order.total)}</div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-muted)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '20px 0' }}>
              You haven't placed any orders yet. Explore our curated 3D catalog to find your next setup.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
