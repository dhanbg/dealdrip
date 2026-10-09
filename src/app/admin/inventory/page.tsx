import React from 'react';
import { getAdminInventoryList } from '@/db/queries/admin';
import { InventoryManager } from './InventoryManager';

export default async function AdminInventoryPage() {
  const variants = await getAdminInventoryList();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
          Inventory & Variant Stock Management
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Authoritative real-time stock levels and audit ledger tracking for Nepal hardware store.
        </p>
      </div>

      <InventoryManager initialVariants={variants as any} />
    </div>
  );
}
