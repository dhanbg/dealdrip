'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  X,
  CheckCircle,
} from 'lucide-react';

type TrustModalType = 'delivery' | 'returns' | 'contact' | 'privacy' | null;

export function Footer() {
  const [activeModal, setActiveModal] = useState<TrustModalType>(null);

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActiveModal(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeModal]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };

  return (
    <>
      <footer className="site-footer">
        {/* Trust Badges Strip */}
        <div className="footer-trust-strip">
          <div className="footer-trust-grid">
            <div className="footer-trust-item">
              <div className="trust-icon-box">
                <Truck size={22} className="trust-icon" strokeWidth={1.8} />
              </div>
              <div className="trust-text">
                <strong>Nepal-Wide Delivery</strong>
                <p>Direct courier delivery across all 7 provinces with Cash on Delivery option.</p>
              </div>
            </div>

            <div className="footer-trust-item">
              <div className="trust-icon-box">
                <RotateCcw size={22} className="trust-icon" strokeWidth={1.8} />
              </div>
              <div className="trust-text">
                <strong>7-Day Defect Replacement</strong>
                <p>Inspect your parcel on arrival. Prompt replacement for damaged or defective items.</p>
              </div>
            </div>

            <div className="footer-trust-item">
              <div className="trust-icon-box">
                <ShieldCheck size={22} className="trust-icon" strokeWidth={1.8} />
              </div>
              <div className="trust-text">
                <strong>Verified Hardware</strong>
                <p>Curated audio gear, gaming equipment, and essentials inspected before dispatch.</p>
              </div>
            </div>

            <div className="footer-trust-item">
              <div className="trust-icon-box">
                <Mail size={22} className="trust-icon" strokeWidth={1.8} />
              </div>
              <div className="trust-text">
                <strong>Direct Support</strong>
                <p>Have a question? Reach our team directly at dealdrip.store.np@gmail.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Body */}
        <div className="footer-main">
          <div className="footer-col footer-brand-col">
            <Link className="wordmark" href="/" aria-label="Deal Drip home">
              <img src="/assets/logo.png" alt="" className="brand-logo" width="34" height="34" />
              <span>DEAL DRIP</span>
            </Link>
            <p className="brand-tagline">
              Curated hardware in another dimension. Explore authentic audio interfaces, gaming peripherals, and everyday objects in interactive 3D before you make them yours.
            </p>
            <div className="footer-status-pill">
              <span className="status-indicator-dot" />
              <span>Orders operating nationwide across Nepal</span>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Collection</h4>
            <ul className="footer-links-list">
              <li>
                <a href="#collection">Shop All Products</a>
              </li>
              <li>
                <a href="#collection">Audio Interfaces & Docks</a>
              </li>
              <li>
                <a href="#play">Gaming Keyboards & Coolers</a>
              </li>
              <li>
                <a href="#collection">Everyday Carry & Cables</a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Store Policies</h4>
            <ul className="footer-links-list">
              <li>
                <button
                  type="button"
                  className="footer-policy-btn"
                  onClick={() => setActiveModal('delivery')}
                >
                  Delivery & Shipping
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-policy-btn"
                  onClick={() => setActiveModal('returns')}
                >
                  Returns & Warranty
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-policy-btn"
                  onClick={() => setActiveModal('privacy')}
                >
                  Privacy & Terms
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-policy-btn"
                  onClick={() => setActiveModal('contact')}
                >
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-col footer-contact-col">
            <h4 className="footer-col-title">Contact</h4>
            <p className="contact-note">
              Questions regarding an order, product compatibility, or delivery estimate?
            </p>
            <a
              href="mailto:dealdrip.store.np@gmail.com"
              className="footer-email-link"
              aria-label="Email dealdrip.store.np@gmail.com"
            >
              <Mail size={16} />
              <span>dealdrip.store.np@gmail.com</span>
            </a>
            <div className="footer-coverage-note">
              <MapPin size={15} />
              <span>Serving Bagmati, Gandaki, Koshi, Lumbini, Madhesh, Karnali & Sudurpashchim</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <span>© 2026 Deal Drip. All rights reserved.</span>
          <span>Audio · Gaming · Everyday</span>
          <button className="text-button" id="back-to-top" onClick={scrollToTop} aria-label="Scroll back to top">
            Back to top <span aria-hidden="true">↑</span>
          </button>
        </div>
      </footer>

      {/* Trust & Policy Modal */}
      {activeModal && (
        <div
          className="dialog-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          role="presentation"
        >
          <div
            className="policy-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-modal-title"
          >
            <button
              type="button"
              className="dialog-close icon-button"
              onClick={() => setActiveModal(null)}
              aria-label="Close dialog"
            >
              <X size={20} strokeWidth={2} />
            </button>

            {activeModal === 'delivery' && (
              <div className="policy-content">
                <div className="policy-header">
                  <Truck size={28} className="policy-header-icon" />
                  <h3 id="policy-modal-title">Delivery & Shipping Information</h3>
                </div>
                <div className="policy-body">
                  <h4>Delivery Coverage</h4>
                  <p>
                    Deal Drip ships to all 7 provinces of Nepal: Bagmati, Gandaki, Koshi, Lumbini, Madhesh, Karnali, and Sudurpashchim.
                  </p>
                  <h4>Delivery Methods & Options</h4>
                  <ul>
                    <li>
                      <strong>Kathmandu Valley:</strong> Standard delivery within 1–2 business days. Express dispatch available for in-stock orders.
                    </li>
                    <li>
                      <strong>Outside Valley:</strong> Courier delivery within 2–5 business days depending on district and accessible transportation routes.
                    </li>
                    <li>
                      <strong>Cash on Delivery (COD):</strong> Available across all eligible courier delivery zones in Nepal.
                    </li>
                  </ul>
                  <h4>Shipping Costs</h4>
                  <p>
                    Delivery charges are clearly calculated and displayed at checkout once you provide your delivery address in Nepal.
                  </p>
                </div>
              </div>
            )}

            {activeModal === 'returns' && (
              <div className="policy-content">
                <div className="policy-header">
                  <RotateCcw size={28} className="policy-header-icon" />
                  <h3 id="policy-modal-title">Returns & Warranty Policy</h3>
                </div>
                <div className="policy-body">
                  <h4>7-Day Defect Replacement Guarantee</h4>
                  <p>
                    We want you to shop with complete confidence. If your item arrives damaged, defective, or does not match the specifications listed, notify us within 7 days of delivery for a replacement.
                  </p>
                  <h4>Package Inspection on Arrival</h4>
                  <p>
                    For Cash on Delivery orders, customers are encouraged to inspect outer parcel condition upon delivery. If physical transit damage is evident, please contact our support team immediately.
                  </p>
                  <h4>Hardware Warranty</h4>
                  <ul>
                    <li>
                      <strong>Focusrite Scarlett Audio Interfaces:</strong> 1-year authentic manufacturer hardware warranty.
                    </li>
                    <li>
                      <strong>Gaming Peripherals & Coolers:</strong> 3-month store warranty covering internal electronic defects.
                    </li>
                    <li>
                      <strong>Everyday Accessories & Cables:</strong> Direct replacement against manufacturing flaws upon delivery.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeModal === 'contact' && (
              <div className="policy-content">
                <div className="policy-header">
                  <Mail size={28} className="policy-header-icon" />
                  <h3 id="policy-modal-title">Contact & Customer Support</h3>
                </div>
                <div className="policy-body">
                  <p>
                    We are dedicated to providing responsive assistance for all product inquiries, order updates, and technical questions.
                  </p>
                  <div className="contact-detail-card">
                    <div className="contact-detail-row">
                      <Mail size={18} />
                      <div>
                        <strong>Customer Support Email:</strong>
                        <a href="mailto:dealdrip.store.np@gmail.com">dealdrip.store.np@gmail.com</a>
                      </div>
                    </div>
                    <div className="contact-detail-row">
                      <Clock size={18} />
                      <div>
                        <strong>Response Time:</strong>
                        <span>Inquiries typically answered within 24 business hours.</span>
                      </div>
                    </div>
                    <div className="contact-detail-row">
                      <MapPin size={18} />
                      <div>
                        <strong>Service Region:</strong>
                        <span>Nepal Nationwide Delivery & Online Support</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="policy-content">
                <div className="policy-header">
                  <ShieldCheck size={28} className="policy-header-icon" />
                  <h3 id="policy-modal-title">Privacy & Terms</h3>
                </div>
                <div className="policy-body">
                  <h4>Information Collection & Use</h4>
                  <p>
                    Deal Drip collects only essential information required to fulfill orders and provide support (such as your full name, delivery address, phone number, and email address).
                  </p>
                  <h4>Data Protection</h4>
                  <p>
                    We do not sell, rent, or trade your personal information. Customer details are used strictly for parcel dispatch, order status notifications, and customer service.
                  </p>
                  <h4>Secure Transactions</h4>
                  <p>
                    Online transactions via eSewa and Nepal Payment Solutions are processed directly through certified, PCI-compliant payment gateways. Deal Drip never stores sensitive banking credentials or payment PINs.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
