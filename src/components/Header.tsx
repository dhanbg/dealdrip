'use client';

import React, { useState } from 'react';
import { useStore, CategoryFilter } from '@/context/StoreContext';

export function Header() {
  const { bagCount, openBag, setFilter } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (category: CategoryFilter) => {
    setFilter(category);
    setMobileMenuOpen(false);
    const collectionEl = document.getElementById('collection');
    if (collectionEl) {
      collectionEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="site-header">
        <a className="wordmark" href="#experience" aria-label="Deal Drip home">
          <img src="/assets/logo.png" alt="" className="brand-logo" width="30" height="30" />
          <span>DEAL DRIP</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button onClick={() => handleNavClick('All')}>Shop all</button>
          <button onClick={() => handleNavClick('Audio')}>Audio</button>
          <button onClick={() => handleNavClick('Gaming')}>Gaming</button>
          <button onClick={() => handleNavClick('Everyday')}>Everyday</button>
        </nav>
        <div className="header-actions">
          <span className="edition">OBJECTS FOR WHAT’S NEXT</span>
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
        </nav>
      )}
    </>
  );
}
