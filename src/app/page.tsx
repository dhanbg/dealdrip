'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroStory3D } from '@/components/HeroStory3D';
import { CollectionSection } from '@/components/CollectionSection';
import { KeyboardDemo3D } from '@/components/KeyboardDemo3D';
import { ClosingSection } from '@/components/ClosingSection';
import { Footer } from '@/components/Footer';

export default function Home() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) {
      document.body.classList.add('motion-ready');
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              revealObserver.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach((e) => revealObserver.observe(e));

      return () => revealObserver.disconnect();
    }
  }, []);

  return (
    <>
      <Header />
      <main>
        <HeroStory3D />
        <CollectionSection />
        <KeyboardDemo3D />
        <ClosingSection />
      </main>
      <Footer />
    </>
  );
}
