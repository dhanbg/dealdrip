"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Phone,
  Mail,
  Printer,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import { CartState } from "@/lib/cart-context";

export interface OrderDetails {
  orderId: string;
  date: string;
  customerName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: string;
  cart: CartState;
  subtotal: number;
  discount: number;
  total: number;
}

interface OrderSuccessViewProps {
  order: OrderDetails;
  onReset: () => void;
}

export function OrderSuccessView({ order, onReset }: OrderSuccessViewProps) {
  const [copied, setCopied] = useState(false);

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isDuo = order.cart.plan === "duo";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      {/* Top Banner Celebration */}
      <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-b from-accent/10 via-card to-background p-8 text-center shadow-2xl md:p-12">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/20 text-accent ring-8 ring-accent/10 animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-accent uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          Order Placed Successfully
        </div>

        <h1 className="mt-4 text-3xl font-bold md:text-5xl">
          Thank you, <span className="text-spectrum">{order.customerName.split(" ")[0]}</span>!
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          We&apos;ve received your order and our fulfillment team in Kathmandu is preparing your Deal
          Drip package.
        </p>

        {/* Order Reference Badge */}
        <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-border bg-secondary/60 px-5 py-2.5 backdrop-blur-md">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Order ID:</span>
          <span className="font-mono text-sm font-bold text-foreground">{order.orderId}</span>
          <button
            onClick={copyOrderId}
            className="flex items-center gap-1 text-xs text-accent hover:underline"
            title="Copy Order ID"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Live Order Timeline */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="text-base font-semibold tracking-wide uppercase text-muted-foreground">
          Delivery Status Timeline
        </h2>
        <div className="mt-6 grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-background shadow">
              <Check className="h-5 w-5 stroke-[3]" />
            </div>
            <span className="mt-2 text-xs font-semibold text-foreground">Confirmed</span>
            <span className="text-[10px] text-muted-foreground">Just Now</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-accent/20 text-accent animate-pulse">
              <Package className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs font-semibold text-foreground">Processing</span>
            <span className="text-[10px] text-muted-foreground">In Warehouse</span>
          </div>

          <div className="flex flex-col items-center opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs text-muted-foreground">Dispatched</span>
            <span className="text-[10px] text-muted-foreground">Via Courier</span>
          </div>

          <div className="flex flex-col items-center opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="mt-2 text-xs text-muted-foreground">Delivered</span>
            <span className="text-[10px] text-muted-foreground">2-4 Business Days</span>
          </div>
        </div>
      </div>

      {/* Itemized Receipt */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-lg font-semibold">Order Summary & Receipt</h2>
          <span className="text-xs text-muted-foreground">{order.date}</span>
        </div>

        <div className="mt-6 space-y-4">
          {/* Main Product */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-secondary flex items-center justify-center">
                <Image
                  src="/deal-drip-logo.png"
                  alt="Deal Drip"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {isDuo
                    ? "Deal Drip 15W — TWS Twin Pack (2x Speakers)"
                    : "Deal Drip 15W — Single Bedside Unit"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {order.cart.quantity} × Rs. {isDuo ? "6,000" : "3,500"}
                </p>
              </div>
            </div>
            <span className="text-sm font-mono font-medium">
              Rs. {(isDuo ? 6000 : 3500) * order.cart.quantity}
            </span>
          </div>

          {/* Price Breakdown */}
          <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-foreground">Rs. {order.subtotal.toLocaleString()}</span>
            </div>

            {order.discount > 0 && (
              <div className="flex justify-between text-chart-2 font-medium">
                <span>Discount ({order.cart.couponCode})</span>
                <span className="font-mono">- Rs. {order.discount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-mono text-chart-2 font-semibold">FREE (Nationwide Nepal)</span>
            </div>

            <div className="flex justify-between border-t border-border pt-3 text-base font-bold text-foreground">
              <span>Total Paid / Due</span>
              <span className="text-spectrum font-display text-lg">Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer & Delivery Information Card */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            Delivery Address
          </h3>
          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{order.customerName}</p>
            <p>{order.address}</p>
            <p>
              {order.city}, {order.province}
            </p>
            {order.notes && <p className="italic text-muted-foreground/80 mt-2">&ldquo;{order.notes}&rdquo;</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Payment & Contact
          </h3>
          <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-accent" />
              <span>{order.phone}</span>
            </div>
            {order.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-accent" />
                <span>{order.email}</span>
              </div>
            )}
            <div className="mt-3 inline-block rounded bg-secondary px-2.5 py-1 font-mono text-[11px] text-foreground">
              Payment: {order.paymentMethod}
            </div>
          </div>
        </div>
      </div>

      {/* Help & Actions */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-xs font-semibold tracking-wider text-foreground uppercase transition-colors hover:bg-border"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>

          <a
            href="https://wa.me/9779800000000?text=Hi%20Deal%20Drip,%20inquiring%20about%20my%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-chart-2/40 bg-chart-2/10 px-4 py-2.5 text-xs font-semibold tracking-wider text-chart-2 uppercase transition-colors hover:bg-chart-2/20"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Support
          </a>
        </div>

        <Link
          href="/"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-3 text-xs font-semibold tracking-wider text-background uppercase transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Back to Product Showcase</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
