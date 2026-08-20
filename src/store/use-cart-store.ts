"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProductPlan = "single" | "duo";

export const PLAN_PRICES: Record<ProductPlan, number> = {
  single: 3500,
  duo: 6000,
};

export interface CartState {
  plan: ProductPlan;
  quantity: number;
  couponCode: string;
  discountAmount: number;
  discountPercentage: number;
}

export interface CartStoreActions {
  setPlan: (plan: ProductPlan) => void;
  setQuantity: (quantity: number) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  applyCouponData: (data: {
    code: string;
    discountPercent?: number;
    discountAmount?: number;
  }) => void;
  removeCoupon: () => void;
  resetCart: () => void;
}

export type CartStore = CartState & CartStoreActions;

export const INITIAL_CART_STATE: CartState = {
  plan: "duo",
  quantity: 1,
  couponCode: "",
  discountAmount: 0,
  discountPercentage: 0,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_CART_STATE,

      setPlan: (plan: ProductPlan) => {
        if (get().plan === plan) return;
        set({ plan });
      },

      setQuantity: (quantity: number) => {
        if (quantity < 1 || quantity > 10) return;
        if (get().quantity === quantity) return;
        set({ quantity });
      },

      applyCoupon: (code: string) => {
        const normalized = code.trim().toUpperCase();
        if (!normalized) {
          return { success: false, message: "Please enter a promo code." };
        }

        if (normalized === "DEALDRIP10" || normalized === "DRIP10") {
          set({
            couponCode: normalized,
            discountPercentage: 10,
            discountAmount: 0,
          });
          return { success: true, message: "10% VIP Discount Applied!" };
        }

        if (normalized === "NEPAL500") {
          set({
            couponCode: normalized,
            discountPercentage: 0,
            discountAmount: 500,
          });
          return { success: true, message: "Rs. 500 Launch Discount Applied!" };
        }

        return {
          success: false,
          message: "Invalid code. Try 'DEALDRIP10' or 'NEPAL500'",
        };
      },

      applyCouponData: ({ code, discountPercent = 0, discountAmount = 0 }) => {
        set({
          couponCode: code.trim().toUpperCase(),
          discountPercentage: discountPercent,
          discountAmount: discountAmount,
        });
      },

      removeCoupon: () => {
        set({
          couponCode: "",
          discountAmount: 0,
          discountPercentage: 0,
        });
      },

      resetCart: () => {
        set(INITIAL_CART_STATE);
      },
    }),
    {
      name: "deal_drip_cart_v2",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        plan: state.plan,
        quantity: state.quantity,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
        discountPercentage: state.discountPercentage,
      }),
    }
  )
);

// Atomic Selectors for optimal performance & zero unnecessary re-renders
export const selectPlan = (state: CartStore) => state.plan;
export const selectQuantity = (state: CartStore) => state.quantity;
export const selectCouponCode = (state: CartStore) => state.couponCode;

export const selectCartState = (state: CartStore): CartState => ({
  plan: state.plan,
  quantity: state.quantity,
  couponCode: state.couponCode,
  discountAmount: state.discountAmount,
  discountPercentage: state.discountPercentage,
});

export const selectSubtotal = (state: CartStore) => {
  const basePrice = PLAN_PRICES[state.plan] || 3500;
  return basePrice * state.quantity;
};

export const selectDiscount = (state: CartStore) => {
  const subtotal = selectSubtotal(state);
  if (state.discountPercentage > 0) {
    return Math.round(subtotal * (state.discountPercentage / 100));
  }
  if (state.discountAmount > 0) {
    return Math.min(state.discountAmount, subtotal);
  }
  return 0;
};

export const selectGrandTotal = (state: CartStore) => {
  const subtotal = selectSubtotal(state);
  const discount = selectDiscount(state);
  return Math.max(0, subtotal - discount);
};

export const selectCartSummary = (state: CartStore) => {
  const subtotal = selectSubtotal(state);
  const discount = selectDiscount(state);
  const grandTotal = Math.max(0, subtotal - discount);
  return {
    subtotal,
    discount,
    grandTotal,
    quantity: state.quantity,
    plan: state.plan,
    couponCode: state.couponCode,
    isDuo: state.plan === "duo",
  };
};
