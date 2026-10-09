import React from 'react';
import { getAdminCustomersList } from '@/db/queries/admin';
import { Users, Mail, Calendar, ShoppingBag, ShieldCheck } from 'lucide-react';

export default async function AdminCustomersPage() {
  const users = await getAdminCustomersList();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.35rem 0', letterSpacing: '-0.02em' }}>
          Customer Accounts Overview
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
          Registered Deal Drip customers with order metrics. Non-sensitive overview.
        </p>
      </div>

      <div style={{
        background: '#12141a',
        border: '1px solid #1e222b',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e222b', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#0e1014' }}>
                <th style={{ padding: '0.85rem 1rem' }}>User / Customer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Email Address</th>
                <th style={{ padding: '0.85rem 1rem' }}>Account Role</th>
                <th style={{ padding: '0.85rem 1rem' }}>Orders Count</th>
                <th style={{ padding: '0.85rem 1rem' }}>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #161820' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{u.name || 'Unnamed Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                      ID: {u.id.slice(0, 12)}...
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={14} style={{ color: '#64748b' }} />
                      <span>{u.email}</span>
                      {u.emailVerified && (
                        <span title="Verified" style={{ display: 'inline-flex' }}>
                          <ShieldCheck size={14} style={{ color: '#4ade80' }} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: u.role === 'admin' ? 'rgba(223, 255, 79, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      color: u.role === 'admin' ? '#dfff4f' : '#94a3b8',
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>
                    {u.ordersCount || 0} order{u.ordersCount !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
