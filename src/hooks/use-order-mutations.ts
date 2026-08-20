"use client";

import { useMutation } from "@tanstack/react-query";
import {
  dealDripApi,
  BackendOrderPayload,
  BackendOrderResponse,
} from "@/lib/api-client";
import { OrderDetails } from "@/app/checkout/components/OrderSuccessView";
import { useCartStore, selectCartSummary } from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import { CheckoutFormValues } from "@/schemas/checkout.schema";
import { toast } from "sonner";

export interface CreateOrderMutationInput {
  formData: CheckoutFormValues;
}

export function useCreateOrderMutation() {
  const setCompletedOrder = useCheckoutStore((s) => s.setCompletedOrder);
  const setShowFonepayModal = useCheckoutStore((s) => s.setShowFonepayModal);

  return useMutation<
    {
      orderData: OrderDetails;
      isBackend: boolean;
      message?: string;
    },
    Error,
    CreateOrderMutationInput
  >({
    mutationFn: async ({ formData }) => {
      const cartSummary = selectCartSummary(useCartStore.getState());
      const finalCity =
        formData.city === "Other" && formData.customCity
          ? formData.customCity.trim()
          : formData.city;

      let paymentLabel = "Cash on Delivery (COD)";
      if (formData.paymentMethod === "esewa") {
        paymentLabel = "eSewa Mobile Wallet";
      } else if (formData.paymentMethod === "banking_card") {
        paymentLabel = "Local Banks & Visa / MasterCard (NPX)";
      }

      const payload: BackendOrderPayload = {
        customerName: formData.fullName,
        phone: formData.phone,
        email: formData.email || undefined,
        province: formData.province,
        city: finalCity,
        address: formData.address,
        notes: formData.notes || undefined,
        paymentMethod: paymentLabel,
        cart: {
          plan: cartSummary.plan,
          quantity: cartSummary.quantity,
          couponCode: cartSummary.couponCode || undefined,
          discountAmount: cartSummary.discount,
          discountPercentage: useCartStore.getState().discountPercentage,
        },
        subtotal: cartSummary.subtotal,
        discount: cartSummary.discount,
        total: cartSummary.grandTotal,
      };

      const res = await dealDripApi.createOrder(payload);

      const year = new Date().getFullYear();
      const orderData: OrderDetails = {
        orderId:
          res.data?.orderId ||
          `DD-${year}-${Math.floor(10000 + Math.random() * 90000)}`,
        date:
          res.data?.date ||
          new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        customerName: formData.fullName,
        phone: formData.phone,
        email: formData.email || "Not provided",
        province: formData.province,
        city: finalCity,
        address: formData.address,
        notes: formData.notes,
        paymentMethod: paymentLabel,
        cart: {
          plan: cartSummary.plan,
          quantity: cartSummary.quantity,
          couponCode: cartSummary.couponCode,
          discountAmount: cartSummary.discount,
          discountPercentage: useCartStore.getState().discountPercentage,
        },
        subtotal: cartSummary.subtotal,
        discount: cartSummary.discount,
        total: cartSummary.grandTotal,
      };

      // Persist order in local storage history
      if (typeof window !== "undefined") {
        try {
          const prevOrders = JSON.parse(
            localStorage.getItem("deal_drip_orders") || "[]"
          );
          localStorage.setItem(
            "deal_drip_orders",
            JSON.stringify([orderData, ...prevOrders])
          );
        } catch (e) {
          console.error("Failed to persist order history:", e);
        }
      }

      return {
        orderData,
        isBackend: res.isBackend,
        message: res.message,
      };
    },
    onSuccess: ({ orderData, isBackend }) => {
      setShowFonepayModal(false);
      setCompletedOrder(orderData);

      if (isBackend) {
        toast.success("Order Synced to Deal Drip API Server & Dispatched!");
      } else {
        toast.success(
          "Order Placed Successfully! We are dispatching your Deal Drip package."
        );
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to place order. Please try again.");
    },
  });
}
