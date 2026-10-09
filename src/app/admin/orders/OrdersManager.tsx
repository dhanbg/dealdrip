'use client';

import React, { useState } from 'react';
import { updateOrderStatusAction } from '@/app/actions/admin';
import { recheckPaymentStatusAction } from '@/app/actions/payments';
import { formatMoney } from '@/data/catalog';
import { toast } from 'sonner';

import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle,
  Truck,
  Clock,
  XCircle,
  AlertCircle,
  X,
  MapPin,
  CreditCard,
  Package,
  RotateCw,
  ShieldCheck,
} from 'lucide-react';


interface OrderItemSnapshot {
  id: string;
  productNameSnapshot: string;
  variantNameSnapshot: string | null;
  skuSnapshot: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  thumbnail: string | null;
}

interface OrderRecord {
  id: string;
  orderReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingAmount: number;
  total: number;
  deliveryAddress: {
    country: string;
    province: string;
    district: string;
    municipality: string;
    ward: string;
    areaTole: string;
    streetLandmark?: string;
    deliveryInstructions?: string;
  };
  notes: string | null;
  createdAt: string;
  items: OrderItemSnapshot[];
  payments: any[];
}

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  pending_payment: ['cancelled'], // Prompt 8 gateway controls payment transitions
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function OrdersManager({ initialOrders }: { initialOrders: OrderRecord[] }) {
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setIsUpdatingStatus(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await updateOrderStatusAction(orderId, nextStatus);
    setIsUpdatingStatus(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to update order status');
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    setActionSuccess(`Order status updated to ${nextStatus.replace('_', ' ')}`);
  };

  const [isRecheckingPayment, setIsRecheckingPayment] = useState(false);

  const handleRecheckPayment = async (orderRef: string) => {
    setIsRecheckingPayment(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await recheckPaymentStatusAction(orderRef);
      if (!res.success) {
        setActionError(res.error || 'Failed to query gateway status');
        toast.error(res.error || 'Failed to query gateway');
        return;
      }

      const result: any = res.result;
      if (result?.success && result?.status === 'paid') {
        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.orderReference === orderRef
              ? { ...o, paymentStatus: 'paid', status: 'confirmed' }
              : o
          )
        );
        if (selectedOrder && selectedOrder.orderReference === orderRef) {
          setSelectedOrder((prev) =>
            prev ? { ...prev, paymentStatus: 'paid', status: 'confirmed' } : null
          );
        }
        setActionSuccess('Payment verified successfully via provider inquiry! Order confirmed.');
        toast.success('Payment authoritatively verified as PAID!');
      } else {
        toast.info(result?.error || `Payment inquiry complete: Status is ${result?.status || 'unpaid'}`);
      }

    } catch (err: any) {
      setActionError(err.message || 'Error executing gateway status inquiry');
      toast.error(err.message || 'Error inquiring gateway');
    } finally {
      setIsRecheckingPayment(false);
    }
  };


  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderReference.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.toLowerCase().includes(search.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by order ref, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.25rem',
              borderRadius: '8px',
              background: '#12141a',
              border: '1px solid #1e222b',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'pending_confirmation', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid #282d38',
                background: statusFilter === st ? 'rgba(223, 255, 79, 0.15)' : '#12141a',
                color: statusFilter === st ? '#dfff4f' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'rgba(74, 222, 128, 0.1)',
          border: '1px solid #4ade80',
          color: '#86efac',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Orders Table */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Order Ref</th>
                <th style={{ padding: '0.85rem 1rem' }}>Customer Details</th>
                <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                <th style={{ padding: '0.85rem 1rem' }}>Method & Payment</th>
                <th style={{ padding: '0.85rem 1rem' }}>Fulfillment Status</th>
                <th style={{ padding: '0.85rem 1rem' }}>Total (NPR)</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid #161820' }}>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 700, color: '#dfff4f' }}>
                      {ord.orderReference}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{ord.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{ord.customerPhone}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ord.customerEmail}</div>
                    </td>
                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1' }}>
                          {ord.paymentMethod}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          color: ord.paymentStatus === 'paid' ? '#4ade80' : ord.paymentStatus === 'pending' ? '#eab308' : '#94a3b8',
                        }}>
                          {ord.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: ord.status === 'confirmed' || ord.status === 'delivered' ? 'rgba(74, 222, 128, 0.12)' : ord.status === 'cancelled' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(234, 179, 8, 0.12)',
                        color: ord.status === 'confirmed' || ord.status === 'delivered' ? '#4ade80' : ord.status === 'cancelled' ? '#ef4444' : '#eab308',
                        textTransform: 'capitalize',
                      }}>
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                      {formatMoney(ord.total)}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          background: '#1a1d24',
                          border: '1px solid #282d38',
                          color: '#fff',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={13} />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#14161c',
            border: '1px solid #282c35',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #282c35', paddingBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Order Details
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.2rem 0', color: '#dfff4f', fontFamily: 'monospace' }}>
                  {selectedOrder.orderReference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Status Transition Control */}
            <div style={{ background: '#0e1014', padding: '1rem', borderRadius: '10px', border: '1px solid #1e222b', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Current Fulfillment Status:</div>
                  <strong style={{ fontSize: '1rem', textTransform: 'capitalize', color: '#fff' }}>
                    {selectedOrder.status.replace('_', ' ')}
                  </strong>
                </div>

                {ORDER_STATUS_TRANSITIONS[selectedOrder.status]?.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Transition to:</span>
                    {ORDER_STATUS_TRANSITIONS[selectedOrder.status].map((nextSt) => (
                      <button
                        key={nextSt}
                        type="button"
                        disabled={isUpdatingStatus}
                        onClick={() => handleUpdateStatus(selectedOrder.id, nextSt)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: nextSt === 'cancelled' ? 'rgba(239, 68, 68, 0.2)' : '#dfff4f',
                          color: nextSt === 'cancelled' ? '#ef4444' : '#000',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {nextSt.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0' }}>
                Ordered Hardware Items ({selectedOrder.items.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: '#0e1014',
                    border: '1px solid #1e222b',
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt=""
                          style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', background: '#000' }}
                        />
                      ) : (
                        <Package size={20} style={{ color: '#64748b' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{item.productNameSnapshot}</div>
                        {item.variantNameSnapshot && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Finish: {item.variantNameSnapshot}</div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Qty: {item.quantity} × {formatMoney(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                    <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{formatMoney(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Address & Payment Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Delivery Details */}
              <div style={{ background: '#0e1014', padding: '1rem', borderRadius: '8px', border: '1px solid #1e222b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#dfff4f' }}>
                  <MapPin size={16} />
                  <strong style={{ fontSize: '0.85rem' }}>Nepal Shipping Address</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  <div><strong style={{ color: '#fff' }}>Recipient:</strong> {selectedOrder.customerName}</div>
                  <div><strong style={{ color: '#fff' }}>Phone:</strong> {selectedOrder.customerPhone}</div>
                  <div><strong style={{ color: '#fff' }}>Email:</strong> {selectedOrder.customerEmail}</div>
                  <div style={{ marginTop: '0.35rem' }}>
                    {selectedOrder.deliveryAddress.areaTole}, Ward {selectedOrder.deliveryAddress.ward}<br />
                    {selectedOrder.deliveryAddress.municipality}, {selectedOrder.deliveryAddress.district}<br />
                    {selectedOrder.deliveryAddress.province}, Nepal
                  </div>
                  {selectedOrder.deliveryAddress.streetLandmark && (
                    <div>Landmark: {selectedOrder.deliveryAddress.streetLandmark}</div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div style={{ background: '#0e1014', padding: '1rem', borderRadius: '8px', border: '1px solid #1e222b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', color: '#38bdf8' }}>
                    <CreditCard size={16} />
                    <strong style={{ fontSize: '0.85rem' }}>Payment & Totals</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    <div><strong style={{ color: '#fff' }}>Method:</strong> {selectedOrder.paymentMethod.toUpperCase()}</div>
                    <div><strong style={{ color: '#fff' }}>Payment Status:</strong> {selectedOrder.paymentStatus.toUpperCase()}</div>
                    <div><strong style={{ color: '#fff' }}>Subtotal:</strong> {formatMoney(selectedOrder.subtotal)}</div>
                    <div><strong style={{ color: '#fff' }}>Delivery:</strong> Free / Calculated at checkout</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #1e222b', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dfff4f' }}>{formatMoney(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Audit & Gateway Reconciliation */}
            <div style={{ background: '#0e1014', padding: '1.25rem', borderRadius: '10px', border: '1px solid #1e222b', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} style={{ color: '#dfff4f' }} />
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                    Payment Records & Reconciliation ({selectedOrder.payments?.length || 0})
                  </h4>
                </div>

                {selectedOrder.paymentMethod !== 'cod' && (
                  <button
                    type="button"
                    disabled={isRecheckingPayment}
                    onClick={() => handleRecheckPayment(selectedOrder.orderReference)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      background: '#dfff4f',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: isRecheckingPayment ? 'not-allowed' : 'pointer',
                      opacity: isRecheckingPayment ? 0.7 : 1,
                    }}
                  >
                    <RotateCw size={13} className={isRecheckingPayment ? 'spin' : ''} />
                    <span>{isRecheckingPayment ? 'Querying Gateway...' : 'Recheck Payment Status'}</span>
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                Authoritative verification runs server-to-server status check against eSewa / NPS APIs. Direct database forced &apos;paid&apos; overrides are disabled to preserve financial audit compliance.
              </div>

              {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedOrder.payments.map((p: any) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '0.75rem',
                        background: '#14161c',
                        borderRadius: '6px',
                        border: '1px solid #232731',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, textTransform: 'uppercase', color: '#fff' }}>{p.provider}</span>
                          <span style={{
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: p.status === 'paid' ? 'rgba(74, 222, 128, 0.2)' : p.status === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                            color: p.status === 'paid' ? '#4ade80' : p.status === 'failed' ? '#ef4444' : '#eab308',
                          }}>
                            {p.status}
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, color: '#dfff4f' }}>
                          {formatMoney(p.amount)}
                        </span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.25rem' }}>
                        <div>Merchant Ref: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{p.merchantTxnRef || 'None'}</span></div>
                        <div>Provider Txn ID: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{p.providerTxnId || 'Pending'}</span></div>
                        <div>Initiated: {p.initiatedAt ? new Date(p.initiatedAt).toLocaleString() : 'N/A'}</div>
                        <div>Verified: {p.verifiedAt ? new Date(p.verifiedAt).toLocaleString() : 'Not verified'}</div>
                        {p.failureReason && (
                          <div style={{ color: '#ef4444', gridColumn: '1 / -1' }}>Failure reason: {p.failureReason}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                  No payment attempts logged yet.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  background: '#1a1d24',
                  border: '1px solid #282d38',
                  color: '#fff',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
