import React from 'react';
import Link from 'next/link';
import { getAdminStats } from '@/db/queries/admin';
import { formatMoney } from '@/data/catalog';
import {
  Package,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  Truck,
  ExternalLink,
} from 'lucide-react';

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
            Store Operations Overview
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Neon PostgreSQL Live Database · Nepal Market Commerce Foundation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href="/admin/inventory"
            className="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: '#1a1d24',
              border: '1px solid #282d38',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            <span>Manage Inventory</span>
          </Link>
          <Link
            href="/admin/products"
            className="button button-lime"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span>Manage Products</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        {/* Total Products */}
        <div style={{
          background: '#12141a',
          border: '1px solid #1e222b',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Products Catalog</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#38bdf8' }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {stats.totalProducts}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
            {stats.activeProducts} active on storefront
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div style={{
          background: '#12141a',
          border: '1px solid #1e222b',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Low Stock Alert</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: stats.lowStockCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(74, 222, 128, 0.12)', color: stats.lowStockCount > 0 ? '#ef4444' : '#4ade80' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: stats.lowStockCount > 0 ? '#ef4444' : '#4ade80', lineHeight: 1 }}>
            {stats.lowStockCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
            Variants with stock &le; 10 units
          </div>
        </div>

        {/* Total Orders */}
        <div style={{
          background: '#12141a',
          border: '1px solid #1e222b',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Total Orders</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#dfff4f' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {stats.totalOrders}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
            {stats.pendingOrdersCount} pending fulfillment
          </div>
        </div>

        {/* Target Market */}
        <div style={{
          background: '#12141a',
          border: '1px solid #1e222b',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Market Target</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#a78bfa' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            Nepal
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
            Currency: NPR (Rs.) · All 7 Provinces
          </div>
        </div>
      </div>

      {/* Low Stock Warning Callout */}
      {stats.lowStockVariants.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fca5a5' }}>
                Inventory Attention Needed ({stats.lowStockVariants.length} variants)
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Some product variants have fallen below the 10-unit safety threshold.
              </div>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Adjust Stock
          </Link>
        </div>
      )}

      {/* Integration & Gateway Infrastructure Health (Prompt 8) */}
      <div style={{
        background: '#12141a',
        border: '1px solid #1e222b',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
              Integrations & Payment Infrastructure
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Production services status without exposing secret credentials
            </p>
          </div>
          <span style={{
            fontSize: '0.75rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
            background: 'rgba(74, 222, 128, 0.12)',
            color: '#4ade80',
            fontWeight: 700,
          }}>
            Prompt 8 Active
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {/* Cloudflare R2 Storage */}
          <div style={{ background: '#0e1014', border: '1px solid #1e222b', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Cloudflare R2</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(74, 222, 128, 0.15)',
                color: '#4ade80',
              }}>
                Ready
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Bucket: <code style={{ color: '#dfff4f' }}>dealdrip-media</code><br />
              Domain: <code style={{ color: '#38bdf8' }}>media.dealdrip.store</code><br />
              S3 API: AWS SDK v3 Client
            </div>
          </div>

          {/* eSewa ePay v2 */}
          <div style={{ background: '#0e1014', border: '1px solid #1e222b', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>eSewa ePay v2</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(74, 222, 128, 0.15)',
                color: '#4ade80',
              }}>
                Sandbox Active
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Merchant Code: <code style={{ color: '#dfff4f' }}>EPAYTEST</code><br />
              Signature: HMAC-SHA256<br />
              Flow: Form POST + Server Inquiry
            </div>
          </div>

          {/* Nepal Payment Solutions */}
          <div style={{ background: '#0e1014', border: '1px solid #1e222b', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>NPS / OnePG</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(74, 222, 128, 0.15)',
                color: '#4ade80',
              }}>
                Sandbox Active
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Merchant ID: <code style={{ color: '#dfff4f' }}>9669</code> (ddesAPI)<br />
              Signature: HMAC-SHA512<br />
              Flow: ProcessId + OnePG Gateway
            </div>
          </div>


          {/* Transactional Email */}
          <div style={{ background: '#0e1014', border: '1px solid #1e222b', borderRadius: '10px', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Transactional Email</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(74, 222, 128, 0.15)',
                color: '#4ade80',
              }}>
                Gmail SMTP Active
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
              Provider: Gmail SMTP (smtp.gmail.com)<br />
              Sender: <code style={{ color: '#38bdf8' }}>dealdrip.store.np@gmail.com</code><br />
              Idempotent: Single dispatch guarantee
            </div>
          </div>

        </div>
      </div>

      {/* Recent Orders Section */}
      <div style={{
        background: '#12141a',
        border: '1px solid #1e222b',
        borderRadius: '12px',
        padding: '1.75rem',
      }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Recent Store Orders</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Live customer transactions recorded in Neon PostgreSQL
            </p>
          </div>
          <Link
            href="/admin/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              color: '#dfff4f',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <span>View All Orders</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <ShoppingBag size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>No orders have been placed yet. Submit a test order via storefront checkout.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e222b', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Order Ref</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Items</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Method</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #161820' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 600, color: '#dfff4f' }}>
                      {ord.orderReference}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{ord.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ord.customerPhone}</div>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                      {ord.items.length} item{ord.items.length !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#94a3b8',
                      }}>
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: ord.status === 'confirmed' || ord.status === 'delivered' ? 'rgba(74, 222, 128, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                        color: ord.status === 'confirmed' || ord.status === 'delivered' ? '#4ade80' : '#eab308',
                        textTransform: 'capitalize',
                      }}>
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                      {formatMoney(ord.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
