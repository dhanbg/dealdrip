"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type ProductPlan = "single" | "duo";

export interface CartState {
  plan: ProductPlan;
  quantity: number;
  couponCode: string;
  discountAmount: number;
  discountPercentage: number;
}

interface CartContextType {
  cart: CartState;
  setPlan: (plan: ProductPlan) => void;
  setQuantity: (qty: number) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discount: number;
  grandTotal: number;
  resetCart: () => void;
}

const PLAN_PRICES: Record<ProductPlan, number> = {
  single: 3500,
  duo: 6000,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "deal_drip_cart_v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>({
    plan: "duo",
    quantity: 1,
    couponCode: "",
    discountAmount: 0,
    discountPercentage: 0,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCart((prev) => ({
          ...prev,
          plan: parsed.plan === "single" ? "single" : "duo",
          quantity: typeof parsed.quantity === "number" && parsed.quantity >= 1 ? parsed.quantity : 1,
          couponCode: parsed.couponCode || "",
          discountAmount: parsed.discountAmount || 0,
          discountPercentage: parsed.discountPercentage || 0,
        }));
      }
    } catch (e) {
      console.warn("Failed to load cart from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn("Failed to save cart to storage", e);
    }
  }, [cart, isLoaded]);

  const setPlan = useCallback((plan: ProductPlan) => {
    setCart((prev) => {
      if (prev.plan === plan) return prev;
      return { ...prev, plan };
    });
  }, []);

  const setQuantity = useCallback((quantity: number) => {
    if (quantity < 1 || quantity > 10) return;
    setCart((prev) => {
      if (prev.quantity === quantity) return prev;
      return { ...prev, quantity };
    });
  }, []);

  const applyCoupon = useCallback((code: string): { success: boolean; message: string } => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { success: false, message: "Please enter a promo code." };
    }

    if (normalized === "DEALDRIP10") {
      setCart((prev) => ({
        ...prev,
        couponCode: normalized,
        discountPercentage: 10,
        discountAmount: 0,
      }));
      return { success: true, message: "10% VIP Discount Applied!" };
    }

    if (normalized === "NEPAL500") {
      setCart((prev) => ({
        ...prev,
        couponCode: normalized,
        discountPercentage: 0,
        discountAmount: 500,
      }));
      return { success: true, message: "Rs. 500 Launch Discount Applied!" };
    }

    return {
      success: false,
      message: "Invalid code. Try 'DEALDRIP10' or 'NEPAL500'",
    };
  }, []);

  const removeCoupon = useCallback(() => {
    setCart((prev) => ({
      ...prev,
      couponCode: "",
      discountAmount: 0,
      discountPercentage: 0,
    }));
  }, []);

  const resetCart = useCallback(() => {
    setCart({
      plan: "duo",
      quantity: 1,
      couponCode: "",
      discountAmount: 0,
      discountPercentage: 0,
    });
  }, []);

  // Calculations
  const basePrice = PLAN_PRICES[cart.plan] || 3500;
  const subtotal = basePrice * cart.quantity;

  let discount = 0;
  if (cart.discountPercentage > 0) {
    discount = Math.round(subtotal * (cart.discountPercentage / 100));
  } else if (cart.discountAmount > 0) {
    discount = Math.min(cart.discountAmount, subtotal);
  }

  const grandTotal = Math.max(0, subtotal - discount);

  const contextValue = useMemo(
    () => ({
      cart,
      setPlan,
      setQuantity,
      applyCoupon,
      removeCoupon,
      subtotal,
      discount,
      grandTotal,
      resetCart,
    }),
    [
      cart,
      setPlan,
      setQuantity,
      applyCoupon,
      removeCoupon,
      subtotal,
      discount,
      grandTotal,
      resetCart,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
