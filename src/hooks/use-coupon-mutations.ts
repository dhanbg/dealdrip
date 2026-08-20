"use client";

import { useMutation } from "@tanstack/react-query";
import { dealDripApi, ValidateCouponResponse } from "@/lib/api-client";
import { useCartStore, selectSubtotal } from "@/store/use-cart-store";
import { toast } from "sonner";

interface ValidateCouponInput {
  code: string;
  subtotal?: number;
}

export function useValidateCouponMutation() {
  const applyCouponData = useCartStore((s) => s.applyCouponData);
  const currentSubtotal = useCartStore(selectSubtotal);

  return useMutation<{
    success: boolean;
    data?: ValidateCouponResponse;
    message: string;
  }, Error, ValidateCouponInput>({
    mutationFn: async ({ code, subtotal }) => {
      const calcSubtotal = subtotal !== undefined ? subtotal : currentSubtotal;
      return await dealDripApi.validateCoupon(code, calcSubtotal);
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        applyCouponData({
          code: res.data.code,
          discountPercent: res.data.discountPercent,
          discountAmount: res.data.discountAmount,
        });
        toast.success(res.message || "Promo code applied successfully!");
      } else {
        toast.error(res.message || "Invalid coupon code");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to validate coupon");
    },
  });
}
