'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        toast.error(res.error.message || 'Registration failed. Email may already be in use.');
      } else {
        toast.success('Account created successfully! Welcome to Deal Drip.');
        router.push('/account');
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
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
          <Link href="/login" className="checkout-back-link">
            <ArrowLeft size={16} />
            <span>Already have an account?</span>
          </Link>
        </div>
      </header>

      <main className="cart-page-container" style={{ maxWidth: 480, paddingTop: 60 }}>
        <div className="form-card" style={{ padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="eyebrow">NEW CUSTOMER</span>
            <h1 style={{ fontSize: 28, marginTop: 6, letterSpacing: '-0.8px' }}>Create an Account</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Register for faster checkout, order tracking, and saved Nepal delivery addresses.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Aarav Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="aarav@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password (min 8 characters)</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--lime)', textDecoration: 'underline' }}>
              Sign in here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
