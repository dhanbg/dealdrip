'use client';

import React, { useState } from 'react';
import { adjustStockAction } from '@/app/actions/admin';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';

interface VariantItem {
  id: string;
  variantCode: string;
  sku: string;
  name: string;
  color: string;
  stockQuantity: number;
  active: boolean;
  product: {
    id: string;
    name: string;
    thumbnail: string | null;
  };
}

export function InventoryManager({ initialVariants }: { initialVariants: VariantItem[] }) {
  const [variants, setVariants] = useState(initialVariants);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'out'>('all');
  const [adjustingVariant, setAdjustingVariant] = useState<VariantItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [reason, setReason] = useState('manual_adjustment');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenAdjust = (v: VariantItem) => {
    setAdjustingVariant(v);
    setNewStock(v.stockQuantity);
    setReason('manual_adjustment');
    setNotes('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariant) return;

    if (newStock < 0) {
      setErrorMsg('Stock quantity cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await adjustStockAction(
      adjustingVariant.id,
      newStock,
      reason,
      notes || `Admin adjustment to ${newStock} units`
    );

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update stock');
      return;
    }

    setVariants((prev) =>
      prev.map((v) =>
        v.id === adjustingVariant.id ? { ...v, stockQuantity: newStock } : v
      )
    );

    setSuccessMsg(`Stock for ${adjustingVariant.product.name} (${adjustingVariant.name}) updated to ${newStock}`);
    setAdjustingVariant(null);
  };

  const filteredVariants = variants.filter((v) => {
    const matchesSearch =
      v.product.name.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'low') return v.stockQuantity > 0 && v.stockQuantity <= 10;
    if (filterMode === 'out') return v.stockQuantity === 0;
    return true;
  });

  return (
    <div>
      {/* Top Filter & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by SKU, product or variant..."
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #282d38',
              background: filterMode === 'all' ? 'rgba(223, 255, 79, 0.15)' : '#12141a',
              color: filterMode === 'all' ? '#dfff4f' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All Variants ({variants.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('low')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #282d38',
              background: filterMode === 'low' ? 'rgba(234, 179, 8, 0.15)' : '#12141a',
              color: filterMode === 'low' ? '#eab308' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Low Stock (&le; 10)
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('out')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #282d38',
              background: filterMode === 'out' ? 'rgba(239, 68, 68, 0.15)' : '#12141a',
              color: filterMode === 'out' ? '#ef4444' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1rem',
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
          <span>{successMsg}</span>
        </div>
      )}

      {/* Inventory Table */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Product & Variant</th>
                <th style={{ padding: '0.85rem 1rem' }}>SKU</th>
                <th style={{ padding: '0.85rem 1rem' }}>Color Finish</th>
                <th style={{ padding: '0.85rem 1rem' }}>Current Stock</th>
                <th style={{ padding: '0.85rem 1rem' }}>Inventory Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVariants.map((v) => {
                const isOutOfStock = v.stockQuantity === 0;
                const isLowStock = v.stockQuantity > 0 && v.stockQuantity <= 10;

                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #161820' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        {v.product.thumbnail ? (
                          <img
                            src={v.product.thumbnail}
                            alt=""
                            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', background: '#0a0b0d' }}
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#1a1d24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={18} style={{ color: '#64748b' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{v.product.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{v.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {v.sku}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: v.color || '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          display: 'inline-block',
                        }} />
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{v.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.05rem', color: isOutOfStock ? '#ef4444' : isLowStock ? '#eab308' : '#fff' }}>
                      {v.stockQuantity} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>units</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {isOutOfStock ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                        }}>
                          <XCircle size={13} />
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(234, 179, 8, 0.12)',
                          color: '#eab308',
                        }}>
                          <AlertTriangle size={13} />
                          Low Stock
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(74, 222, 128, 0.12)',
                          color: '#4ade80',
                        }}>
                          <CheckCircle size={13} />
                          In Stock
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(v)}
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
                        <Edit3 size={13} />
                        <span>Adjust Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingVariant && (
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
            maxWidth: '500px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                  Adjust Variant Stock
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                  {adjustingVariant.product.name} · {adjustingVariant.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingVariant(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: '#0e1014', padding: '1rem', borderRadius: '8px', border: '1px solid #1e222b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Current Authoritative Stock:</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  {adjustingVariant.stockQuantity} units
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#0e1014',
                    border: '1px solid #282c35',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  Adjustment Reason (Inventory Audit Ledger)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#0e1014',
                    border: '1px solid #282c35',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                >
                  <option value="manual_adjustment">Manual Adjustment</option>
                  <option value="restock">Shipment Restock</option>
                  <option value="inventory_count_correction">Physical Audit Correction</option>
                  <option value="damaged_goods">Damaged / Removed Goods</option>
                  <option value="return_restock">Customer Return Restock</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment batch #NP-482"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#0e1014',
                    border: '1px solid #282c35',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setAdjustingVariant(null)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    background: '#1a1d24',
                    border: '1px solid #282d38',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button button-lime"
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {isSubmitting ? 'Updating...' : 'Commit Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
