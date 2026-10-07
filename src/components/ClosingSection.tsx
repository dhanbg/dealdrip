'use client';

import React from 'react';

export function ClosingSection() {
  const scrollToCollection = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('collection');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="closing-section">
      <div className="closing-orbit" aria-hidden="true"></div>
      <span className="eyebrow">YOUR EVERYDAY, REIMAGINED.</span>
      <h2>
        Find your<br />
        <em>next thing.</em>
      </h2>
      <a className="button button-dark" href="#collection" onClick={scrollToCollection}>
        Back to the collection <span aria-hidden="true">✳</span>
      </a>
      <p>Explore it. Turn it around. Make it yours.</p>
    </section>
  );
}
