import { z } from 'zod';
import { isValidNepalPhone } from '@/data/nepalLocations';

export type PaymentMethod = 'cod' | 'esewa' | 'nps';

export interface PaymentOptionInfo {
  id: PaymentMethod;
  title: string;
  badge?: string;
  description: string;
  subtext: string;
  icon: string;
  enabled: boolean;
}

export const PAYMENT_METHODS: PaymentOptionInfo[] = [
  {
    id: 'cod',
    title: 'Cash on Delivery (COD)',
    badge: 'Popular across Nepal',
    description: 'Pay with cash or mobile banking scan when your package is handed to you.',
    subtext: 'Available across all 7 provinces. Verified by courier at your doorstep.',
    icon: 'banknote',
    enabled: true,
  },
  {
    id: 'esewa',
    title: 'eSewa Mobile Wallet',
    badge: 'Digital Wallet',
    description: 'Instant transfer via your registered eSewa digital wallet.',
    subtext: 'Gateway integration ready for Prompt 8 real credentials.',
    icon: 'wallet',
    enabled: true,
  },
  {
    id: 'nps',
    title: 'Card / Bank Payment (NPS)',
    badge: 'Nepal Payment Solutions',
    description: 'Pay using SCT, local bank account, VISA, or Mastercard.',
    subtext: 'Powered by Nepal Payment Solutions (OnePG). Direct secure card and bank checkout.',
    icon: 'credit-card',
    enabled: true,
  },

];

export const checkoutFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters.' })
    .max(80, { message: 'Full name is too long.' }),
  phone: z
    .string()
    .min(7, { message: 'Please enter a valid phone number.' })
    .refine((val) => isValidNepalPhone(val), {
      message: 'Please enter a valid Nepal phone number (e.g., 98XXXXXXXX or 97XXXXXXXX).',
    }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address for order notifications.' }),
  province: z
    .string()
    .min(1, { message: 'Please select your delivery province.' }),
  district: z
    .string()
    .min(1, { message: 'Please specify your district.' }),
  municipality: z
    .string()
    .min(2, { message: 'Please specify your municipality, rural municipality, or metropolitan city.' }),
  ward: z
    .string()
    .min(1, { message: 'Please enter your ward number (e.g. 3 or Ward 4).' }),
  areaTole: z
    .string()
    .min(2, { message: 'Please specify your tole, chowk, or neighborhood area.' }),
  streetLandmark: z
    .string()
    .max(150, { message: 'Landmark description is too long.' })
    .optional(),
  deliveryInstructions: z
    .string()
    .max(300, { message: 'Delivery instructions are too long.' })
    .optional(),
  paymentMethod: z.enum(['cod', 'esewa', 'nps'] as const, {
    error: 'Please select a payment method.',
  }),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

/**
 * SECURITY & ARCHITECTURAL BOUNDARY:
 * -------------------------------------------------------------
 * The client only transmits:
 * - Product IDs
 * - Variant IDs
 * - Quantities
 * - Customer & Nepal delivery address
 * - Chosen payment method
 *
 * Client prices and subtotals are explicitly NON-AUTHORITATIVE.
 * When Prompt 7 (Database/API) and Prompt 8 (Payments) are connected,
 * the server will look up current catalog prices, compute taxes/shipping,
 * verify real inventory, and generate the authoritative charge.
 */
export interface CheckoutLineItemPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  // Non-authoritative reference value sent from client UI for telemetry/audit
  clientDisplayUnitPrice: number;
}

export interface CheckoutPayload {
  mode: 'guest';
  customer: {
    fullName: string;
    phone: string;
    email: string;
  };
  deliveryAddress: {
    country: 'Nepal';
    province: string;
    district: string;
    municipality: string;
    ward: string;
    areaTole: string;
    streetLandmark?: string;
    deliveryInstructions?: string;
  };
  paymentMethod: PaymentMethod;
  items: CheckoutLineItemPayload[];
  currency: 'NPR';
  clientReferenceSubtotal: number;
  shippingState: 'calculated_at_checkout';
  submissionTimestamp: string;
  status: 'draft_validated_for_prompt7';
}
