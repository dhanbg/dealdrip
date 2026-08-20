"use client";

import React, { Suspense, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ShieldCheck,
  ArrowLeft,
  Check,
  Sparkles,
  Truck,
  Banknote,
  QrCode,
  Tag,
  Clock,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
} from "lucide-react";

import {
  useCartStore,
  ProductPlan,
  selectSubtotal,
  selectDiscount,
  selectGrandTotal,
} from "@/store/use-cart-store";
import { useCheckoutStore } from "@/store/use-checkout-store";
import {
  checkoutFormSchema,
  CheckoutFormValues,
  DEFAULT_CHECKOUT_VALUES,
  PROVINCES,
  POPULAR_CITIES,
} from "@/schemas/checkout.schema";
import { useCreateOrderMutation } from "@/hooks/use-order-mutations";
import { useValidateCouponMutation } from "@/hooks/use-coupon-mutations";
import { OrderSuccessView } from "./components/OrderSuccessView";
import { FonepayQRModal } from "./components/FonepayQRModal";

function CheckoutContent() {
  const searchParams = useSearchParams();

  // Zustand Cart Store - Fine-grained reactive subscriptions
  const plan = useCartStore((s) => s.plan);
  const quantity = useCartStore((s) => s.quantity);
  const couponCode = useCartStore((s) => s.couponCode);
  const discountPercentage = useCartStore((s) => s.discountPercentage);
  const discountAmount = useCartStore((s) => s.discountAmount);
  const setPlan = useCartStore((s) => s.setPlan);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const resetCart = useCartStore((s) => s.resetCart);

  const subtotal = useCartStore(selectSubtotal);
  const discount = useCartStore(selectDiscount);
  const grandTotal = useCartStore(selectGrandTotal);

  // Zustand Checkout UI Store
  const showFonepayModal = useCheckoutStore((s) => s.showFonepayModal);
  const setShowFonepayModal = useCheckoutStore((s) => s.setShowFonepayModal);
  const completedOrder = useCheckoutStore((s) => s.completedOrder);

  // TanStack Query Mutations
  const createOrderMutation = useCreateOrderMutation();
  const validateCouponMutation = useValidateCouponMutation();

  // Coupon text input state
  const [couponInput, setCouponInput] = useState("");
  const [, startTransition] = useTransition();

  // React Hook Form with Zod Schema Validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: DEFAULT_CHECKOUT_VALUES,
    mode: "onTouched",
  });

  const selectedPaymentMethod = watch("paymentMethod");
  const selectedCity = watch("city");

  // Sync plan from URL query parameter on mount
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam === "single" || planParam === "duo") {
      setPlan(planParam as ProductPlan);
    }
  }, [searchParams, setPlan]);

  const handleSelectPlan = (newPlan: ProductPlan) => {
    setPlan(newPlan);
    startTransition(() => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("plan", newPlan);
        window.history.replaceState({}, "", url.toString());
      }
    });
  };

  const handleApplyCouponForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    validateCouponMutation.mutate(
      { code: couponInput.trim(), subtotal },
      {
        onSuccess: (res) => {
          if (res.success) {
            setCouponInput("");
          }
        },
      }
    );
  };

  const handleApplyQuickCoupon = (code: string) => {
    validateCouponMutation.mutate({ code, subtotal });
  };

  // Form submission handler
  const onSubmit = (data: CheckoutFormValues) => {
    if (data.paymentMethod === "banking_card") {
      setShowFonepayModal(true);
      return;
    }

    createOrderMutation.mutate({ formData: data });
  };

  const handleFonepaySuccess = () => {
    const formData = watch();
    createOrderMutation.mutate({ formData });
  };

  if (completedOrder) {
    return <OrderSuccessView order={completedOrder} onReset={resetCart} />;
  }

  const isDuo = plan === "duo";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Checkout Navbar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 px-4 py-4 backdrop-blur-md md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Store</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Image
              src="/deal-drip-logo.png"
              alt="Deal Drip"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="font-display text-sm font-bold tracking-[0.2em] uppercase">
              Deal Drip
            </span>
          </div>

          <div className="w-24" />
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        {/* Title & Trust Header */}
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-4xl">
              Express Checkout
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Free Delivery Across Nepal • Cash on Delivery &amp; Instant Banking Available
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-accent" />
              100% Genuine
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-accent" />
              Free Nepal Delivery
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-accent" />
              7-Day Replacement
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-8 lg:grid-cols-12">
            {/* LEFT COLUMN: Customer Details & Payment Methods */}
            <div className="space-y-8 lg:col-span-7">
              {/* Step 1: Contact Information */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-background">
                    1
                  </div>
                  <h2 className="text-base font-semibold uppercase tracking-wider">
                    Contact Information
                  </h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("fullName")}
                      placeholder="Asim Thapa"
                      className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${
                        errors.fullName
                          ? "border-destructive focus:border-destructive focus:ring-destructive"
                          : "border-border focus:border-accent focus:ring-accent"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="flex items-center gap-1 text-[11px] text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.fullName.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Mobile Phone Number <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-xs font-mono text-muted-foreground">
                        +977
                      </span>
                      <input
                        type="tel"
                        {...register("phone")}
                        placeholder="98XXXXXXXX"
                        className={`w-full rounded-xl border bg-background py-3 pr-4 pl-16 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${
                          errors.phone
                            ? "border-destructive focus:border-destructive focus:ring-destructive"
                            : "border-border focus:border-accent focus:ring-accent"
                        }`}
                      />
                    </div>
                    {errors.phone ? (
                      <p className="flex items-center gap-1 text-[11px] text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.phone.message}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        For delivery coordination &amp; rider call.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="aarav@example.com"
                      className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${
                        errors.email
                          ? "border-destructive focus:border-destructive focus:ring-destructive"
                          : "border-border focus:border-accent focus:ring-accent"
                      }`}
                    />
                    {errors.email ? (
                      <p className="flex items-center gap-1 text-[11px] text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.email.message}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        For printable invoice and dispatch receipt.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: Delivery Destination */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-background">
                    2
                  </div>
                  <h2 className="text-base font-semibold uppercase tracking-wider">
                    Delivery Destination (Nepal)
                  </h2>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Province <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...register("province")}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {PROVINCES.map((p) => (
                        <option key={p} value={p} className="bg-card text-foreground">
                          {p}
                        </option>
                      ))}
                    </select>
                    {errors.province && (
                      <p className="text-[11px] text-destructive">
                        {errors.province.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      City / District <span className="text-destructive">*</span>
                    </label>
                    <select
                      {...register("city")}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {POPULAR_CITIES.map((c) => (
                        <option key={c} value={c} className="bg-card text-foreground">
                          {c}
                        </option>
                      ))}
                      <option value="Other" className="bg-card text-foreground">
                        Other / Custom City...
                      </option>
                    </select>
                    {errors.city && (
                      <p className="text-[11px] text-destructive">
                        {errors.city.message}
                      </p>
                    )}
                  </div>

                  {selectedCity === "Other" && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">
                        Enter City / District Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("customCity")}
                        placeholder="e.g. Banepa, Damak, Tansen..."
                        className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${
                          errors.customCity
                            ? "border-destructive focus:border-destructive focus:ring-destructive"
                            : "border-border focus:border-accent focus:ring-accent"
                        }`}
                      />
                      {errors.customCity && (
                        <p className="flex items-center gap-1 text-[11px] text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          <span>{errors.customCity.message}</span>
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Street Address &amp; Nearest Landmark <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("address")}
                      placeholder="e.g. Ward 4, House 21, Opp. Bhatbhateni Supermarket, Naxal"
                      className={`w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 ${
                        errors.address
                          ? "border-destructive focus:border-destructive focus:ring-destructive"
                          : "border-border focus:border-accent focus:ring-accent"
                      }`}
                    />
                    {errors.address && (
                      <p className="flex items-center gap-1 text-[11px] text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors.address.message}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Delivery Instructions / Landmark Notes (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("notes")}
                      placeholder="e.g. Call before delivery / Leave with security guard"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    {errors.notes && (
                      <p className="text-[11px] text-destructive">
                        {errors.notes.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Free Nationwide Delivery Banner */}
                <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-chart-2/30 bg-chart-2/10 p-3.5 text-xs text-chart-2">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>Free Express Shipping:</strong> Dispatched from Kathmandu with 2–4 business days delivery nationwide.
                  </span>
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-background">
                    3
                  </div>
                  <h2 className="text-base font-semibold uppercase tracking-wider">
                    Payment Method
                  </h2>
                </div>

                <div className="mt-6 space-y-3">
                  {/* 1. eSewa Mobile Wallet */}
                  <div
                    onClick={() => setValue("paymentMethod", "esewa", { shouldValidate: true })}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      selectedPaymentMethod === "esewa"
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.15)]"
                        : "border-border bg-background hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selectedPaymentMethod === "esewa"
                              ? "border-accent bg-accent text-background"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedPaymentMethod === "esewa" && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Image
                            src="/esewa-logo.png"
                            alt="eSewa"
                            width={32}
                            height={32}
                            className="h-8 w-8 shrink-0 rounded-full object-contain shadow-sm"
                          />
                          <span className="text-sm font-semibold">eSewa Mobile Wallet</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#60BB46]">
                        eSewa
                      </span>
                    </div>
                  </div>

                  {/* 2. Unified Gateway: Local Banks & Visa / MasterCard (NPX) */}
                  <div
                    onClick={() =>
                      setValue("paymentMethod", "banking_card", { shouldValidate: true })
                    }
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      selectedPaymentMethod === "banking_card"
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.15)]"
                        : "border-border bg-background hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selectedPaymentMethod === "banking_card"
                              ? "border-accent bg-accent text-background"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedPaymentMethod === "banking_card" && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card border border-border/80 p-1 shadow-sm">
                            <Image
                              src="/npx-logo.png"
                              alt="NPX"
                              width={32}
                              height={32}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            Local Banks &amp; Visa / MasterCard
                          </span>
                        </div>
                      </div>
                      <span className="rounded bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400">
                        NPX
                      </span>
                    </div>
                  </div>

                  {/* 3. Cash on Delivery (COD) */}
                  <div
                    onClick={() => setValue("paymentMethod", "cod", { shouldValidate: true })}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      selectedPaymentMethod === "cod"
                        ? "border-accent bg-accent/10 shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.15)]"
                        : "border-border bg-background hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selectedPaymentMethod === "cod"
                              ? "border-accent bg-accent text-background"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedPaymentMethod === "cod" && (
                            <Check className="h-3 w-3 stroke-[3]" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                            <Banknote className="h-4.5 w-4.5" />
                          </div>
                          <span className="text-sm font-semibold">Cash on Delivery (COD)</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        COD
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary & Place Order Button */}
            <div className="space-y-6 lg:col-span-5">
              <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-base font-semibold uppercase tracking-wider">
                    Order Summary
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {quantity} item{quantity > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Bundle Plan Switcher */}
                <div className="mt-6">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Select Package
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPlan("single")}
                      className={`cursor-pointer rounded-xl border p-3 text-left transition-all ${
                        !isDuo
                          ? "border-accent bg-accent/15 text-foreground shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      <div className="text-xs font-bold uppercase">Single Unit</div>
                      <div className="mt-1 font-mono text-sm font-bold text-foreground">
                        Rs. 3,500
                      </div>
                      <div className="text-[10px] text-muted-foreground">1x Speaker</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectPlan("duo")}
                      className={`cursor-pointer relative rounded-xl border p-3 text-left transition-all ${
                        isDuo
                          ? "border-accent bg-accent/20 text-foreground shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.2)]"
                          : "border-border bg-background text-muted-foreground hover:border-border/80"
                      }`}
                    >
                      <span className="absolute -top-2.5 right-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase text-background">
                        Save Rs. 1,000
                      </span>
                      <div className="text-xs font-bold uppercase text-spectrum">TWS Twin Pack</div>
                      <div className="mt-1 font-mono text-sm font-bold text-foreground">
                        Rs. 6,000
                      </div>
                      <div className="text-[10px] text-muted-foreground">2x Stereo Link</div>
                    </button>
                  </div>
                </div>

                {/* Product Visual Card with Quantity Controller */}
                <div className="mt-6 rounded-xl border border-border bg-background p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
                      <Image
                        src="/deal-drip-logo.png"
                        alt="Deal Drip 15W"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold">
                        {isDuo ? "Deal Drip 15W — TWS Twin Pack" : "Deal Drip 15W — Single Unit"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isDuo
                          ? "2x 15W Wireless Charging Speakers"
                          : "1x 15W Wireless Charging Speaker"}
                      </p>
                      <div className="mt-1 font-mono text-xs font-bold text-foreground">
                        Rs. {isDuo ? "6,000" : "3,500"}
                      </div>
                    </div>
                  </div>

                  {/* Inclusions List */}
                  <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-accent" />
                      <span>
                        {isDuo
                          ? "2x Deal Drip 15W Qi Fast Charging Speakers"
                          : "1x Deal Drip 15W Qi Fast Charging Speaker"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-accent" />
                      <span>
                        {isDuo
                          ? "360° True Wireless Stereo (L/R) Wireless Pairing"
                          : "Ambient 7-Mode Colour Cycling RGB Ring"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-accent" />
                      <span>USB-C High Speed Braided Cables + Official Warranty</span>
                    </div>
                  </div>

                  {/* Quantity modifier */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-xs font-medium text-muted-foreground">Quantity</span>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity - 1)}
                        disabled={quantity <= 1}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs font-bold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= 10}
                        className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Coupon Engine with React Query Mutation */}
                <div className="mt-6">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Promo / Voucher Code
                  </label>
                  {couponCode ? (
                    <div className="mt-2 flex items-center justify-between rounded-xl border border-chart-2/40 bg-chart-2/10 px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-chart-2" />
                        <div>
                          <span className="font-mono text-xs font-bold text-chart-2">
                            {couponCode}
                          </span>
                          <span className="ml-2 text-[10px] text-muted-foreground">
                            {discountPercentage > 0
                              ? `(${discountPercentage}% OFF)`
                              : discountAmount > 0
                              ? `(Rs. ${discountAmount} OFF)`
                              : ""}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-muted-foreground hover:text-destructive"
                        title="Remove coupon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Try DEALDRIP10"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2 font-mono text-xs uppercase text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCouponForm}
                        disabled={validateCouponMutation.isPending || !couponInput.trim()}
                        className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold uppercase text-foreground transition-colors hover:bg-border disabled:opacity-50"
                      >
                        {validateCouponMutation.isPending ? "Checking..." : "Apply"}
                      </button>
                    </div>
                  )}
                  {!couponCode && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyQuickCoupon("DEALDRIP10")}
                        disabled={validateCouponMutation.isPending}
                        className="rounded border border-dashed border-accent/40 bg-accent/5 px-2 py-0.5 text-[10px] text-accent transition-colors hover:bg-accent/15"
                      >
                        🎫 DEALDRIP10 (10% off)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyQuickCoupon("NEPAL500")}
                        disabled={validateCouponMutation.isPending}
                        className="rounded border border-dashed border-chart-2/40 bg-chart-2/5 px-2 py-0.5 text-[10px] text-chart-2 transition-colors hover:bg-chart-2/15"
                      >
                        🎉 NEPAL500 (Rs. 500 off)
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Calculation Breakdown */}
                <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Product Subtotal</span>
                    <span className="font-mono text-foreground">
                      Rs. {subtotal.toLocaleString()}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between font-medium text-chart-2">
                      <span>Discount ({couponCode})</span>
                      <span className="font-mono">-Rs. {discount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Nationwide Shipping</span>
                    <span className="font-mono font-semibold text-chart-2">FREE</span>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-border pt-4">
                    <div>
                      <span className="text-sm font-bold text-foreground">Total Payable</span>
                      <p className="text-[10px] text-muted-foreground">
                        All taxes &amp; VAT included
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-2xl font-bold text-spectrum">
                        Rs. {grandTotal.toLocaleString()}
                      </span>
                      {isDuo && (
                        <p className="text-[10px] font-medium text-chart-2">
                          You saved Rs. 1,000 on Twin Pack!
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Big Place Order Submit Button */}
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-4 text-xs font-bold tracking-[0.2em] text-background uppercase transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {selectedPaymentMethod === "banking_card"
                          ? `Pay via Banking / Cards • Rs. ${grandTotal.toLocaleString()}`
                          : `Place Order • Rs. ${grandTotal.toLocaleString()}`}
                      </span>
                    </>
                  )}
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-chart-2" />
                  <span>
                    Official Deal Drip Nepal • Cash on Delivery Guaranteed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Fonepay QR Simulation Modal */}
      <FonepayQRModal
        isOpen={showFonepayModal}
        onClose={() => setShowFonepayModal(false)}
        onPaymentSuccess={handleFonepaySuccess}
        totalAmount={grandTotal}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Loading Secure Checkout...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
