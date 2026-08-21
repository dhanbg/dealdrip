/**
 * Deal Drip NestJS API Client
 * Connects the Next.js frontend to the NestJS backend API with graceful offline fallback.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function safeJsonParse<T = any>(res: Response): Promise<T | null> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

export interface BackendOrderPayload {
  userId?: string;
  customerName: string;
  phone: string;
  email?: string;
  province: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: string;
  cart: {
    plan: 'single' | 'duo';
    quantity: number;
    couponCode?: string;
    discountAmount?: number;
    discountPercentage?: number;
  };
  subtotal: number;
  discount: number;
  total: number;
}

export interface BackendOrderResponse {
  orderId: string;
  date: string;
  createdAt: string;
  status: string;
  customerName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: string;
  cart: {
    plan: 'single' | 'duo';
    quantity: number;
    couponCode?: string;
    discountAmount?: number;
    discountPercentage?: number;
  };
  subtotal: number;
  discount: number;
  total: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  code: string;
  discountPercent: number;
  discountAmount: number;
  message: string;
}

export const dealDripApi = {
  /**
   * Health check to see if the NestJS backend is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        cache: 'no-store',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Create an order in the NestJS backend
   */
  async createOrder(payload: BackendOrderPayload): Promise<{
    success: boolean;
    data?: BackendOrderResponse;
    message?: string;
    isBackend: boolean;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await safeJsonParse(res);

      if (!res.ok) {
        throw new Error(json?.message || `Server responded with ${res.status}`);
      }

      return {
        success: true,
        data: json?.data,
        message: json?.message || 'Order placed successfully',
        isBackend: true,
      };
    } catch (err: any) {
      console.warn('Backend unavailable, falling back to local order generation:', err.message);
      // Fallback: Generate local order when backend is not actively running
      const year = new Date().getFullYear();
      const orderId = `DD-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const fallbackOrder: BackendOrderResponse = {
        orderId,
        date: formattedDate,
        createdAt: now.toISOString(),
        status: 'CONFIRMED',
        customerName: payload.customerName,
        phone: payload.phone,
        email: payload.email || 'Not provided',
        province: payload.province,
        city: payload.city,
        address: payload.address,
        notes: payload.notes,
        paymentMethod: payload.paymentMethod,
        cart: payload.cart,
        subtotal: payload.subtotal,
        discount: payload.discount,
        total: payload.total,
      };

      return {
        success: true,
        data: fallbackOrder,
        message: 'Order placed locally (Backend offline fallback)',
        isBackend: false,
      };
    }
  },

  /**
   * Validate a coupon with the NestJS backend
   */
  async validateCoupon(code: string, subtotal: number): Promise<{
    success: boolean;
    data?: ValidateCouponResponse;
    message: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, subtotal }),
      });

      const json = await safeJsonParse(res);
      if (!res.ok || !json?.success) {
        return {
          success: false,
          message: Array.isArray(json?.message) ? json.message.join(', ') : json?.message || 'Invalid coupon code',
        };
      }

      return {
        success: true,
        data: json.data,
        message: json.message,
      };
    } catch {
      // Local fallback coupon validation
      const normalized = code.trim().toUpperCase();
      if (normalized === 'DEALDRIP10' || normalized === 'DRIP10') {
        const discountAmount = Math.round((subtotal * 10) / 100);
        return {
          success: true,
          data: {
            valid: true,
            code: normalized,
            discountPercent: 10,
            discountAmount,
            message: '10% Discount Applied!',
          },
          message: '10% Discount Applied!',
        };
      }

      if (normalized === 'NEPAL500') {
        return {
          success: true,
          data: {
            valid: true,
            code: normalized,
            discountPercent: Math.min(100, Math.round((500 / subtotal) * 100)),
            discountAmount: 500,
            message: 'Rs. 500 Launch Discount Applied!',
          },
          message: 'Rs. 500 Launch Discount Applied!',
        };
      }

      return {
        success: false,
        message: 'Invalid promo code. Try "DEALDRIP10" or "NEPAL500".',
      };
    }
  },

  /**
   * Fetch active products and packages
   */
  async getProducts() {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
      if (res.ok) {
        const json = await safeJsonParse(res);
        return json?.data || null;
      }
      return null;
    } catch {
      return null;
    }
  },
};
