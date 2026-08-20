"use client";

import { create } from "zustand";
import { OrderDetails } from "@/app/checkout/components/OrderSuccessView";

interface CheckoutUIState {
  showFonepayModal: boolean;
  completedOrder: OrderDetails | null;
  setShowFonepayModal: (show: boolean) => void;
  setCompletedOrder: (order: OrderDetails | null) => void;
  clearCheckoutState: () => void;
}

export const useCheckoutStore = create<CheckoutUIState>((set) => ({
  showFonepayModal: false,
  completedOrder: null,

  setShowFonepayModal: (show: boolean) => set({ showFonepayModal: show }),
  setCompletedOrder: (order: OrderDetails | null) => set({ completedOrder: order }),
  clearCheckoutState: () => set({ showFonepayModal: false, completedOrder: null }),
}));
