import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { getOrderByReference } from '@/db/queries/orders';
import { PaymentFailedClient } from './PaymentFailedClient';

interface PaymentFailedPageProps {
  searchParams: Promise<{
    orderRef?: string;
    reason?: string;
  }>;
}

export default async function PaymentFailedPage({ searchParams }: PaymentFailedPageProps) {
  const { orderRef, reason } = await searchParams;

  let order = null;
  if (orderRef) {
    try {
      order = await getOrderByReference(orderRef);
    } catch (err) {
      console.error('Failed to load order for payment retry page:', err);
    }
  }

  return (
    <div className="checkout-page-wrapper" style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>
          <div className="checkout-header-actions">
            <div className="checkout-secure-badge">
              <ShieldCheck size={16} />
              <span>Secure Recovery</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        <PaymentFailedClient
          orderReference={orderRef || ''}
          reason={reason}
          orderTotal={order ? order.total : undefined}
          currentPaymentStatus={order ? order.paymentStatus : 'unpaid'}
        />
      </main>
    </div>
  );
}
