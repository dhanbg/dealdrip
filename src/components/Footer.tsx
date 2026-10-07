'use client';

import React from 'react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };

  return (
    <footer>
      <div className="footer-top">
        <a className="wordmark" href="#experience" aria-label="Deal Drip home">
          <img src="/assets/logo.png" alt="" className="brand-logo" width="34" height="34" />
          <span>DEAL DRIP</span>
        </a>
        <span>CURIOUS BY DESIGN.</span>
        <button className="text-button" id="back-to-top" onClick={scrollToTop}>
          Back to top <span aria-hidden="true">+</span>
        </button>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Deal Drip</span>
        <span>Audio / Gaming / Everyday</span>
        <span>Another dimension of everyday.</span>
      </div>
    </footer>
  );
}
