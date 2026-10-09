'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        toast.error(res.error.message || 'Invalid email or password.');
      } else {
        toast.success('Welcome back to Deal Drip!');
        router.push('/account');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page-wrapper">
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>
          <Link href="/" className="checkout-back-link">
            <ArrowLeft size={16} />
            <span>Return to Store</span>
          </Link>
        </div>
      </header>

      <main className="cart-page-container" style={{ maxWidth: 480, paddingTop: 60 }}>
        <div className="form-card" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="eyebrow">CUSTOMER PORTAL</span>
            <h1 style={{ fontSize: 28, marginTop: 6, letterSpacing: '-0.8px' }}>Sign in to Deal Drip</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Access your order history and saved delivery addresses.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button button-lime"
              style={{ width: '100%', padding: '13px', marginTop: 8 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Don't have an account yet?{' '}
            <Link href="/register" style={{ color: 'var(--lime)', textDecoration: 'underline' }}>
              Create an account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
