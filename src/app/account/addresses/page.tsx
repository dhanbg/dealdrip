import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserAddresses } from '@/db/queries/addresses';
import { ArrowLeft, MapPin } from 'lucide-react';
import { AddressManager } from './AddressManager';

export default async function AccountAddressesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;
  const addresses = await getUserAddresses(user.id);

  return (
    <div className="cart-page-wrapper">
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>
          <Link href="/account" className="checkout-back-link">
            <ArrowLeft size={16} />
            <span>Back to Account</span>
          </Link>
        </div>
      </header>

      <main className="cart-page-container">
        <div className="cart-page-heading">
          <div className="cart-heading-title-group">
            <span className="eyebrow">SAVED DESTINATIONS</span>
            <h1>Nepal Delivery Addresses</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
              Manage addresses for quick doorstep delivery across all 7 provinces.
            </p>
          </div>
        </div>

        <AddressManager initialAddresses={addresses} />
      </main>
    </div>
  );
}
