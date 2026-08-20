"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  useCartStore,
  ProductPlan,
  CartState,
  PLAN_PRICES,
  selectSubtotal,
  selectDiscount,
  selectGrandTotal,
} from "@/store/use-cart-store";

export type { ProductPlan, CartState };
export { PLAN_PRICES };

export interface CartContextType {
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

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const plan = useCartStore((s) => s.plan);
  const quantity = useCartStore((s) => s.quantity);
  const couponCode = useCartStore((s) => s.couponCode);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const discountPercentage = useCartStore((s) => s.discountPercentage);

  const setPlan = useCartStore((s) => s.setPlan);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const resetCart = useCartStore((s) => s.resetCart);

  const subtotal = useCartStore(selectSubtotal);
  const discount = useCartStore(selectDiscount);
  const grandTotal = useCartStore(selectGrandTotal);

  const cart = useMemo<CartState>(
    () => ({
      plan,
      quantity,
      couponCode,
      discountAmount,
      discountPercentage,
    }),
    [plan, quantity, couponCode, discountAmount, discountPercentage]
  );

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
    // If used outside CartProvider, fall back directly to Zustand store
    const store = useCartStore.getState();
    const subtotal = selectSubtotal(store);
    const discount = selectDiscount(store);
    const grandTotal = selectGrandTotal(store);
    return {
      cart: {
        plan: store.plan,
        quantity: store.quantity,
        couponCode: store.couponCode,
        discountAmount: store.discountAmount,
        discountPercentage: store.discountPercentage,
      },
      setPlan: store.setPlan,
      setQuantity: store.setQuantity,
      applyCoupon: store.applyCoupon,
      removeCoupon: store.removeCoupon,
      subtotal,
      discount,
      grandTotal,
      resetCart: store.resetCart,
    };
  }
  return context;
}
