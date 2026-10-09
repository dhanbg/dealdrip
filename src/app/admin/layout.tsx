import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Users,
  Store,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { SignOutButton } from '@/app/account/SignOutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }

  // Server-side authorization barrier: customer cannot enter admin
  if ((session.user as any).role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0b0d',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'var(--font-sans, system-ui)',
      }}>
        <div style={{
          maxWidth: '480px',
          textAlign: 'center',
          background: '#14161b',
          border: '1px solid #282c35',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
        }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 1.25rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Access Denied</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
            Your account ({session.user.email}) does not possess administrative privileges.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              href="/"
              className="button button-lime"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Back to Store
            </Link>
            <Link
              href="/account"
              className="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                background: '#20242c',
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Customer Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#1b1e28',
      color: '#f1f5f9',
      fontFamily: 'var(--font-sans, system-ui)',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: '#222634',
        borderRight: '1px solid #2d3345',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1rem',
        flexShrink: 0,
      }}>
        <div>
          {/* Logo & Brand */}
          <div style={{ padding: '0 0.5rem 1.5rem', borderBottom: '1px solid #1e222b', marginBottom: '1.5rem' }}>
            <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#fff' }}>
              <img src="/assets/logo.png" alt="" width={28} height={28} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em' }}>DEAL DRIP</div>
                <div style={{ fontSize: '0.7rem', color: '#dfff4f', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Admin Portal
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <Link
              href="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: '#e2e8f0',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
                background: 'rgba(255, 255, 255, 0.04)',
              }}
            >
              <LayoutDashboard size={18} style={{ color: '#dfff4f' }} />
              <span>Overview</span>
            </Link>

            <Link
              href="/admin/products"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <Package size={18} />
              <span>Products</span>
            </Link>

            <Link
              href="/admin/inventory"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <Boxes size={18} />
              <span>Inventory</span>
            </Link>

            <Link
              href="/admin/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <ShoppingBag size={18} />
              <span>Orders</span>
            </Link>

            <Link
              href="/admin/customers"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: '#cbd5e1',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              <Users size={18} />
              <span>Customers</span>
            </Link>
          </nav>
        </div>

        {/* Footer actions */}
        <div style={{ borderTop: '1px solid #1e222b', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0 0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            Logged in as <strong style={{ color: '#cbd5e1' }}>{session.user.name || session.user.email}</strong>
          </div>

          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.85rem',
              background: 'rgba(255, 255, 255, 0.03)',
            }}
          >
            <Store size={16} />
            <span>View Public Store</span>
          </Link>

          <SignOutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 2.5rem' }}>
        {children}
      </main>
    </div>
  );
}
