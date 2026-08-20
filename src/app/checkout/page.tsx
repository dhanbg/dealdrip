"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Check,
  Sparkles,
  Truck,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Clock,
  Trash2,
  Plus,
  Minus,
  Building2,
} from "lucide-react";
import { useCart, ProductPlan } from "@/lib/cart-context";
import { toast } from "sonner";
import { OrderSuccessView, OrderDetails } from "./components/OrderSuccessView";
import { FonepayQRModal } from "./components/FonepayQRModal";
import { dealDripApi } from "@/lib/api-client";

const PROVINCES = [
  "Bagmati Province",
  "Gandaki Province",
  "Koshi Province",
  "Lumbini Province",
  "Madhesh Province",
  "Karnali Province",
  "Sudurpashchim Province",
];

const POPULAR_CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Chitwan (Bharatpur)",
  "Biratnagar",
  "Dharan",
  "Butwal",
  "Hetauda",
  "Itahari",
  "Birgunj",
  "Nepalgunj",
  "Dhangadhi",
  "Birtamode",
];

type PaymentMethodType = "cod" | "esewa" | "banking_card";
type CardOrQrSubtype = "qr" | "card";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const {
    cart,
    setPlan,
    setQuantity,
    applyCoupon,
    removeCoupon,
    subtotal,
    discount,
    grandTotal,
    resetCart,
  } = useCart();

  // Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [province, setProvince] = useState("Bagmati Province");
  const [city, setCity] = useState("Kathmandu");
  const [customCity, setCustomCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // 3 Payment Methods: COD, eSewa, and unified Local Banks + Visa/Mastercard
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("cod");
  const [bankingSubtype, setBankingSubtype] = useState<CardOrQrSubtype>("qr");

  // Card details state (for card payment simulation inside unified gateway)
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Coupon state
  const [couponInput, setCouponInput] = useState("");

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderDetails | null>(null);
  const [showFonepayModal, setShowFonepayModal] = useState(false);

  // Sync plan from URL search params on initial mount only
  const initializedPlanRef = React.useRef(false);
  useEffect(() => {
    if (!initializedPlanRef.current) {
      const planParam = searchParams.get("plan");
      if (planParam === "single" || planParam === "duo") {
        setPlan(planParam as ProductPlan);
      }
      initializedPlanRef.current = true;
    }
  }, [searchParams, setPlan]);

  const handleSelectPlan = (newPlan: ProductPlan) => {
    setPlan(newPlan);
    // Update URL query param quietly without page reload
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("plan", newPlan);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    if (res.success) {
      toast.success(res.message);
      setCouponInput("");
    } else {
      toast.error(res.message);
    }
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number (e.g. 98XXXXXXXX)");
      return false;
    }
    const finalCity = city === "Other" ? customCity.trim() : city;
    if (!finalCity) {
      toast.error("Please specify your city or district");
      return false;
    }
    if (!address.trim() || address.length < 5) {
      toast.error("Please enter a detailed street address or landmark");
      return false;
    }
    if (paymentMethod === "banking_card" && bankingSubtype === "card") {
      if (!cardNumber || !cardExpiry || !cardCvc) {
        toast.error("Please fill in your card number, expiry, and CVV");
        return false;
      }
    }
    return true;
  };

  const handlePlaceOrder = () => {
    if (!validateForm()) return;

    if (paymentMethod === "banking_card" && bankingSubtype === "qr") {
      setShowFonepayModal(true);
      return;
    }

    processOrderSubmission();
  };

  const processOrderSubmission = async () => {
    setIsSubmitting(true);

    const finalCity = city === "Other" ? customCity : city;

    let paymentLabel = "Cash on Delivery (COD)";
    if (paymentMethod === "esewa") {
      paymentLabel = "eSewa Mobile Wallet";
    } else if (paymentMethod === "banking_card") {
      paymentLabel =
        bankingSubtype === "qr"
          ? "Local Mobile Banking (Fonepay QR)"
          : "Visa / Mastercard Credit-Debit Card";
    }

    const payload = {
      customerName: fullName,
      phone,
      email: email || undefined,
      province,
      city: finalCity,
      address,
      notes: notes || undefined,
      paymentMethod: paymentLabel,
      cart: {
        plan: cart.plan,
        quantity: cart.quantity,
        couponCode: cart.couponCode || undefined,
        discountAmount: cart.discountAmount,
        discountPercentage: cart.discountPercentage,
      },
      subtotal,
      discount,
      total: grandTotal,
    };

    const res = await dealDripApi.createOrder(payload);

    const orderData: OrderDetails = {
      orderId: res.data?.orderId || `DD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      date:
        res.data?.date ||
        new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      customerName: fullName,
      phone,
      email: email || "Not provided",
      province,
      city: finalCity,
      address,
      notes,
      paymentMethod: paymentLabel,
      cart: { ...cart },
      subtotal,
      discount,
      total: grandTotal,
    };

    try {
      const prevOrders = JSON.parse(localStorage.getItem("deal_drip_orders") || "[]");
      localStorage.setItem("deal_drip_orders", JSON.stringify([orderData, ...prevOrders]));
    } catch (e) {
      console.error(e);
    }

    setIsSubmitting(false);
    setShowFonepayModal(false);
    setCompletedOrder(orderData);

    if (res.isBackend) {
      toast.success("Order Synced to Deal Drip API Server & Dispatched!");
    } else {
      toast.success("Order Placed Successfully! We are dispatching your Deal Drip package.");
    }
  };

  if (completedOrder) {
    return <OrderSuccessView order={completedOrder} onReset={resetCart} />;
  }

  const isDuo = cart.plan === "duo";

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      {/* Checkout Navbar */}
      <header className="border-b border-border/80 bg-background/80 px-4 py-4 backdrop-blur-md md:px-12 sticky top-0 z-30">
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

          <div className="flex items-center gap-1.5 rounded-full border border-chart-2/40 bg-chart-2/10 px-3 py-1 text-[11px] font-semibold text-chart-2 uppercase">
            <Lock className="h-3 w-3" />
            <span>256-Bit SSL Encrypted</span>
          </div>
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
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
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
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98XXXXXXXX"
                      className="w-full rounded-xl border border-border bg-background py-3 pr-4 pl-16 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    For delivery coordination &amp; rider call.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aarav@example.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    For printable invoice and dispatch receipt.
                  </p>
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
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p} className="bg-card text-foreground">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    City / District <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
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
                </div>

                {city === "Other" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      Enter City / District Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="e.g. Banepa, Damak, Tansen..."
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Street Address &amp; Nearest Landmark <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Ward 4, House 21, Opp. Bhatbhateni Supermarket, Naxal"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">
                    Delivery Instructions / Landmark Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Call before delivery / Leave with security guard"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
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

            {/* Step 3: Payment Method (Exactly 3 options) */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-background">
                  3
                </div>
                <h2 className="text-base font-semibold uppercase tracking-wider">
                  Payment Method
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {/* 1. Cash on Delivery (COD) */}
                <div
                  onClick={() => setPaymentMethod("cod")}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
                    paymentMethod === "cod"
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.15)]"
                      : "border-border bg-background hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          paymentMethod === "cod"
                            ? "border-accent bg-accent text-background"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "cod" && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Banknote className="h-5 w-5 text-chart-2" />
                        <div>
                          <span className="text-sm font-semibold">Cash on Delivery (COD)</span>
                          <p className="text-xs text-muted-foreground">
                            Pay cash or scan QR upon parcel arrival at your doorstep. Zero upfront risk.
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-chart-2/20 px-2.5 py-1 text-[11px] font-bold text-chart-2 uppercase">
                      Most Popular
                    </span>
                  </div>
                </div>

                {/* 2. eSewa Mobile Wallet */}
                <div
                  onClick={() => setPaymentMethod("esewa")}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
                    paymentMethod === "esewa"
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.15)]"
                      : "border-border bg-background hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          paymentMethod === "esewa"
                            ? "border-accent bg-accent text-background"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "esewa" && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#60BB46] text-xs font-black text-white">
                          e
                        </div>
                        <div>
                          <span className="text-sm font-semibold">eSewa Mobile Wallet</span>
                          <p className="text-xs text-muted-foreground">
                            Pay directly via eSewa digital wallet balance or QR transfer.
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-[#60BB46]">
                      eSewa Pay
                    </span>
                  </div>
                </div>

                {/* 3. Unified Gateway: Local Banks & Visa / Master Card */}
                <div
                  onClick={() => setPaymentMethod("banking_card")}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition-all ${
                    paymentMethod === "banking_card"
                      ? "border-accent bg-accent/10 shadow-[0_0_20px_oklch(0.72_0.19_190_/_0.15)]"
                      : "border-border bg-background hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          paymentMethod === "banking_card"
                            ? "border-accent bg-accent text-background"
                            : "border-muted-foreground"
                        }`}
                      >
                        {paymentMethod === "banking_card" && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1 text-accent">
                          <Building2 className="h-5 w-5" />
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold">
                            Local Banks &amp; Visa / MasterCard
                          </span>
                          <p className="text-xs text-muted-foreground">
                            Pay with any Nepali Bank App (Fonepay QR) or Visa / MasterCard / SCT Card.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        Fonepay QR
                      </span>
                      <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono text-foreground">
                        Cards
                      </span>
                    </div>
                  </div>

                  {/* Sub-selector inside Unified Gateway */}
                  {paymentMethod === "banking_card" && (
                    <div className="mt-5 border-t border-border/60 pt-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBankingSubtype("qr")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                            bankingSubtype === "qr"
                              ? "border-accent bg-accent/20 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <QrCode className="h-4 w-4 text-destructive" />
                          <span>Mobile Banking QR (50+ Banks)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBankingSubtype("card")}
                          className={`flex flex-1 items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                            bankingSubtype === "card"
                              ? "border-accent bg-accent/20 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CreditCard className="h-4 w-4 text-accent" />
                          <span>Visa / MasterCard</span>
                        </button>
                      </div>

                      {bankingSubtype === "qr" && (
                        <div className="mt-3 rounded-xl border border-border bg-background p-3.5 text-xs text-muted-foreground">
                          <p className="font-medium text-foreground">
                            📲 Scan instantly with Global IME, NIC Asia, Nabil, Prabhu, Siddhartha, Sanima &amp; all mobile banking apps.
                          </p>
                          <p className="mt-1 text-[11px]">
                            A dynamic payment QR code with the exact amount will open when you click &quot;Place Order&quot;.
                          </p>
                        </div>
                      )}

                      {bankingSubtype === "card" && (
                        <div className="mt-3 rounded-xl border border-border bg-background p-4 space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Card Number</label>
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              placeholder="4123 •••• •••• 9841"
                              maxLength={19}
                              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Expiry (MM/YY)</label>
                              <input
                                type="text"
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="12/28"
                                maxLength={5}
                                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">CVC / CVV</label>
                              <input
                                type="password"
                                value={cardCvc}
                                onChange={(e) => setCardCvc(e.target.value)}
                                placeholder="•••"
                                maxLength={4}
                                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-mono focus:border-accent focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                  {cart.quantity} item{cart.quantity > 1 ? "s" : ""}
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
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-secondary flex items-center justify-center shrink-0">
                    <Image
                      src="/deal-drip-logo.png"
                      alt="Deal Drip 15W"
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
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
                <div className="mt-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground space-y-1">
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
                      onClick={() => setQuantity(cart.quantity - 1)}
                      disabled={cart.quantity <= 1}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-bold">
                      {cart.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(cart.quantity + 1)}
                      disabled={cart.quantity >= 10}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Coupon Engine */}
              <div className="mt-6">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Promo / Voucher Code
                </label>
                {cart.couponCode ? (
                  <div className="mt-2 flex items-center justify-between rounded-xl border border-chart-2/40 bg-chart-2/10 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-chart-2" />
                      <div>
                        <span className="font-mono text-xs font-bold text-chart-2">
                          {cart.couponCode}
                        </span>
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          {cart.discountPercentage > 0
                            ? `(${cart.discountPercentage}% OFF)`
                            : cart.discountAmount > 0
                            ? `(Rs. ${cart.discountAmount} OFF)`
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
                  <form onSubmit={handleApplyCoupon} className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Try DEALDRIP10"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs uppercase font-mono text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground uppercase transition-colors hover:bg-border"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {!cart.couponCode && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyCoupon("DEALDRIP10")}
                      className="rounded border border-dashed border-accent/40 bg-accent/5 px-2 py-0.5 text-[10px] text-accent hover:bg-accent/15"
                    >
                      🎫 DEALDRIP10 (10% off)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyCoupon("NEPAL500")}
                      className="rounded border border-dashed border-chart-2/40 bg-chart-2/5 px-2 py-0.5 text-[10px] text-chart-2 hover:bg-chart-2/15"
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
                  <span className="font-mono text-foreground">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-chart-2 font-medium">
                    <span>Discount ({cart.couponCode})</span>
                    <span className="font-mono">-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Nationwide Shipping</span>
                  <span className="font-mono text-chart-2 font-semibold">FREE</span>
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

              {/* Big Place Order Button */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-4 text-xs font-bold tracking-[0.2em] text-background uppercase transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>
                      {paymentMethod === "banking_card" && bankingSubtype === "qr"
                        ? `Scan QR & Pay Rs. ${grandTotal.toLocaleString()}`
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
      </main>

      {/* Fonepay QR Simulation Modal */}
      <FonepayQRModal
        isOpen={showFonepayModal}
        onClose={() => setShowFonepayModal(false)}
        onPaymentSuccess={processOrderSubmission}
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
