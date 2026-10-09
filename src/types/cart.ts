import { Product, ProductVariant } from '@/data/catalog';

export interface CartItem {
  id: string; // unique cart line key, e.g. "speaker:black" or "bottle:sage"
  productId: string;
  slug: string;
  name: string;
  thumbnail: string;
  variantId?: string;
  variantName?: string;
  color?: string;
  quantity: number;
  price: number; // display price only (non-authoritative client value)
  currency: 'NPR';
}

export interface CartTotals {
  subtotal: number;
  itemCount: number;
  totalQuantity: number;
  shippingState: 'calculated_at_checkout';
}
