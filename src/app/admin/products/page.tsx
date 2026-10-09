import React from 'react';
import { getAdminProductsList } from '@/db/queries/admin';
import { ProductManager } from './ProductManager';

export default async function AdminProductsPage() {
  const products = await getAdminProductsList();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
          Catalog Products Management
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Manage Deal Drip products, prices, descriptions, and storefront visibility.
        </p>
      </div>

      <ProductManager initialProducts={products as any} />
    </div>
  );
}
