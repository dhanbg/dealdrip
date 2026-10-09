'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useStore, CategoryFilter } from '@/context/StoreContext';
import { authClient } from '@/lib/auth-client';
import { User, Shield } from 'lucide-react';

export function Header() {
  const { bagCount, openBag, setFilter } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (category: CategoryFilter) => {
    setFilter(category);
    setMobileMenuOpen(false);

    if (pathname !== '/') {
      router.push('/#collection');
      return;
    }

    const collectionEl = document.getElementById('collection');
    if (collectionEl) {
      collectionEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
        <Link className="wordmark" href="/" aria-label="Deal Drip home">
          <img src="/assets/logo.png" alt="" className="brand-logo" width="30" height="30" />
          <span>DEAL DRIP</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button onClick={() => handleNavClick('All')}>Shop all</button>
          <button onClick={() => handleNavClick('Audio')}>Audio</button>
          <button onClick={() => handleNavClick('Gaming')}>Gaming</button>
          <button onClick={() => handleNavClick('Everyday')}>Everyday</button>
        </nav>
        <div className="header-actions">
          <span className="edition">OBJECTS FOR WHAT’S NEXT</span>

          {isAdmin && (
            <Link
              href="/admin"
              className="account-toggle"
              style={{ color: '#dfff4f', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', fontSize: '13px' }}
              aria-label="Admin Dashboard"
            >
              <Shield size={15} />
              <span>Admin</span>
            </Link>
          )}

          {session?.user ? (
            <Link
              href="/account"
              className="account-toggle"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#fff', fontSize: '13px' }}
              aria-label="My Account"
            >
              <User size={15} />
              <span>Account</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="account-toggle"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#fff', fontSize: '13px' }}
              aria-label="Sign in"
            >
              <User size={15} />
              <span>Sign in</span>
            </Link>
          )}

          <button
            className="bag-toggle"
            onClick={openBag}
            aria-label="Open shopping bag"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 7.5h14l1 13H4l1-13Z" />
              <path d="M8 8V6a4 4 0 0 1 8 0v2" />
            </svg>
            <span>Bag</span>
            <span className="bag-count">{bagCount}</span>
          </button>
          <button
            className="menu-toggle icon-button"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <button onClick={() => handleNavClick('All')}>Shop all</button>
          <button onClick={() => handleNavClick('Audio')}>Audio</button>
          <button onClick={() => handleNavClick('Gaming')}>Gaming</button>
          <button onClick={() => handleNavClick('Everyday')}>Everyday</button>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#dfff4f', textAlign: 'left', padding: '12px 0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Shield size={16} />
              <span>Admin Dashboard</span>
            </Link>
          )}
          {session?.user ? (
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#fff', textAlign: 'left', padding: '12px 0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <User size={16} />
              <span>My Account</span>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{ color: '#fff', textAlign: 'left', padding: '12px 0', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <User size={16} />
              <span>Sign in / Register</span>
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
