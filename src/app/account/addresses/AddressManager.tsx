'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveAddressAction, deleteAddressAction } from '@/app/actions/addresses';
import { NEPAL_PROVINCES } from '@/data/nepalLocations';
import { MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface AddressRecord {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  municipality: string;
  ward: string;
  areaTole: string;
  streetLandmark: string | null;
  deliveryInstructions: string | null;
  isDefault: boolean;
}

export function AddressManager({ initialAddresses }: { initialAddresses: AddressRecord[] }) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [provinceId, setProvinceId] = useState('bagmati');
  const [district, setDistrict] = useState('Kathmandu');
  const [municipality, setMunicipality] = useState('');
  const [ward, setWard] = useState('');
  const [areaTole, setAreaTole] = useState('');
  const [streetLandmark, setStreetLandmark] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const selectedProvince = NEPAL_PROVINCES.find((p) => p.id === provinceId) || NEPAL_PROVINCES[2];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setProvinceId(pId);
    const p = NEPAL_PROVINCES.find((item) => item.id === pId);
    if (p && p.districts.length > 0) {
      setDistrict(p.districts[0]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !municipality || !ward || !areaTole) {
      toast.error('Please complete all required address fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await saveAddressAction({
        fullName,
        phone,
        province: selectedProvince.name,
        district,
        municipality,
        ward,
        areaTole,
        streetLandmark,
        deliveryInstructions,
        isDefault,
      });

      if (res.success) {
        toast.success('Address saved successfully!');
        setShowAddForm(false);
        // Reset form
        setFullName('');
        setPhone('');
        setMunicipality('');
        setWard('');
        setAreaTole('');
        setStreetLandmark('');
        setDeliveryInstructions('');
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to save address.');
      }
    } catch {
      toast.error('Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteAddressAction(id);
      if (res.success) {
        toast.info('Address removed.');
        router.refresh();
      }
    } catch {
      toast.error('Failed to remove address.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="button button-lime"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={16} />
          <span>{showAddForm ? 'Cancel New Address' : 'Add New Nepal Address'}</span>
        </button>
      </div>

      {showAddForm && (
        <div className="form-card" style={{ marginBottom: 32, padding: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 18 }}>New Delivery Address</h2>
          <form onSubmit={handleCreate}>
            <div className="form-fields-grid">
              <div className="form-group">
                <label>Recipient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Nepal Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Province *</label>
                <select value={provinceId} onChange={handleProvinceChange}>
                  {NEPAL_PROVINCES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>District *</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)}>
                  {selectedProvince.districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Municipality / City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kathmandu Metropolitan / Pokhara"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Ward Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                />
              </div>

              <div className="form-group span-full">
                <label>Area / Tole / Chowk *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Baneshwor, Thapagaun"
                  value={areaTole}
                  onChange={(e) => setAreaTole(e.target.value)}
                />
              </div>

              <div className="form-group span-full">
                <label>Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Standard Chartered Bank"
                  value={streetLandmark}
                  onChange={(e) => setStreetLandmark(e.target.value)}
                />
              </div>

              <div className="form-group span-full">
                <label>Delivery Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Call before arrival"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                />
              </div>

              <div className="form-group span-full" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="isDefault" style={{ cursor: 'pointer', margin: 0 }}>
                  Set as default delivery address
                </label>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="button"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="button button-lime"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address cards list */}
      {initialAddresses.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {initialAddresses.map((addr) => (
            <div
              key={addr.id}
              className="form-card"
              style={{
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: addr.isDefault ? '1px solid var(--lime)' : '1px solid var(--line)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <strong>{addr.fullName}</strong>
                  {addr.isDefault && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        background: 'rgba(0, 240, 255, 0.1)',
                        color: 'var(--lime)',
                        fontWeight: 600,
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <div>Phone: {addr.phone}</div>
                  <div>
                    {addr.municipality}, Ward {addr.ward}, {addr.areaTole}
                  </div>
                  <div>
                    {addr.district}, {addr.province}
                  </div>
                  {addr.streetLandmark && <div style={{ color: 'var(--text-dim)' }}>Landmark: {addr.streetLandmark}</div>}
                </div>
              </div>

              <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="cart-item-delete-btn"
                  title="Delete address"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cart-empty-container">
          <div className="empty-symbol">✳</div>
          <h2>No saved addresses</h2>
          <p>You have not saved any Nepal delivery addresses yet.</p>
        </div>
      )}
    </div>
  );
}
