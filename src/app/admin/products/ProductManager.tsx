'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatMoney } from '@/data/catalog';
import {
  toggleProductActiveAction,
  updateProductDetailsAction,
} from '@/app/actions/admin';
import {
  Search,
  Edit2,
  Check,
  X,
  Package,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { ProductMediaModal } from './ProductMediaModal';


const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  basePrice: z.number().min(1, 'Price must be greater than 0'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  badge: z.string().optional(),
  featured: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  thumbnail: string | null;
  basePrice: number;
  active: boolean;
  featured: boolean;
  badge: string | null;
  description: string;
  categoryId: string;
  variants: any[];
}

export function ProductManager({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [mediaModalProduct, setMediaModalProduct] = useState<ProductItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const handleEditClick = (p: ProductItem) => {
    setEditingProduct(p);
    setActionError(null);
    reset({
      name: p.name,
      basePrice: p.basePrice,
      description: p.description,
      badge: p.badge || '',
      featured: p.featured,
    });
  };

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, active: nextActive } : p))
    );

    const res = await toggleProductActiveAction(productId, nextActive);
    if (!res.success) {
      // Revert if error
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, active: currentActive } : p))
      );
      setActionError(res.error || 'Failed to toggle product status');
    }
  };

  const onSubmitForm = async (data: ProductFormData) => {
    if (!editingProduct) return;
    setIsSubmitting(true);
    setActionError(null);

    const res = await updateProductDetailsAction(editingProduct.id, {
      name: data.name,
      basePrice: data.basePrice,
      description: data.description,
      badge: data.badge || undefined,
      featured: data.featured,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setActionError(res.error || 'Failed to update product');
      return;
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: data.name,
              basePrice: data.basePrice,
              description: data.description,
              badge: data.badge || null,
              featured: data.featured,
            }
          : p
      )
    );

    setEditingProduct(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Top Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search products by name or category..."
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

        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Showing <strong>{filteredProducts.length}</strong> of {products.length} products
        </div>
      </div>

      {actionError && (
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1rem',
          borderRadius: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.85rem',
        }}>
          <AlertCircle size={18} style={{ color: '#ef4444' }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Products Table */}
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
                <th style={{ padding: '0.85rem 1rem' }}>Product</th>
                <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                <th style={{ padding: '0.85rem 1rem' }}>Base Price (NPR)</th>
                <th style={{ padding: '0.85rem 1rem' }}>Variants</th>
                <th style={{ padding: '0.85rem 1rem' }}>Featured</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #161820' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.name}
                          style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '6px', background: '#0a0b0d', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#1c1f26', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} style={{ color: '#64748b' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          slug: {p.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#94a3b8',
                      textTransform: 'capitalize',
                    }}>
                      {p.categoryId}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#dfff4f' }}>
                    {formatMoney(p.basePrice)}
                  </td>
                  <td style={{ padding: '1rem', color: '#cbd5e1' }}>
                    {p.variants?.length || 1} variant{p.variants?.length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {p.featured ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        color: '#facc15',
                        fontWeight: 600,
                      }}>
                        <Sparkles size={13} />
                        Featured
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>Standard</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p.id, p.active)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: p.active ? 'rgba(74, 222, 128, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: p.active ? '#4ade80' : '#ef4444',
                      }}
                      title={p.active ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {p.active ? <Eye size={12} /> : <EyeOff size={12} />}
                      <span>{p.active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setMediaModalProduct(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '6px',
                          background: '#14161c',
                          border: '1px solid #282d38',
                          color: '#38bdf8',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                        title="Upload/Manage R2 Media & 3D GLB"
                      >
                        <ImageIcon size={13} />
                        <span>Media</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditClick(p)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '6px',
                          background: '#1a1d24',
                          border: '1px solid #282d38',
                          color: '#fff',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
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
            maxWidth: '560px',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                  Edit Product
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, fontFamily: 'monospace' }}>
                  ID: {editingProduct.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  Product Name
                </label>
                <input
                  type="text"
                  {...register('name')}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#0e1014',
                    border: '1px solid #282c35',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                {errors.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name.message}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  Base Price (NPR)
                </label>
                <input
                  type="number"
                  {...register('basePrice', { valueAsNumber: true })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#0e1014',
                    border: '1px solid #282c35',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
                {errors.basePrice && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.basePrice.message}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  Badge / Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PRO STUDIO, NEW RELEASE"
                  {...register('badge')}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#0e1014',
                    border: '1px solid #282c35',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#cbd5e1' }}>
                  Description
                </label>
                <textarea
                  rows={4}
                  {...register('description')}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: '#0e1014',
                    border: '1px solid #282c35',
                    color: '#fff',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                />
                {errors.description && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.description.message}</p>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="checkbox"
                  id="featured-checkbox"
                  {...register('featured')}
                  style={{ width: '16px', height: '16px', accentColor: '#dfff4f' }}
                />
                <label htmlFor="featured-checkbox" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Mark as Featured Product on Homepage
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Media & 3D Assets Modal */}
      {mediaModalProduct && (
        <ProductMediaModal
          product={mediaModalProduct}
          onClose={() => setMediaModalProduct(null)}
          onProductUpdated={() => {
            // Refresh if needed
          }}
        />
      )}
    </div>
  );
}

