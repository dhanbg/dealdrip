import React from 'react';
import { getAllOrdersAdmin } from '@/db/queries/orders';
import { OrdersManager } from './OrdersManager';

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersAdmin(100);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
          Customer Orders Management
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Manage customer orders, track courier fulfillment, and review payment statuses.
        </p>
      </div>

      <OrdersManager initialOrders={orders as any} />
    </div>
  );
}
