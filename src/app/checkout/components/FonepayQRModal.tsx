"use client";

import React, { useState } from "react";
import Image from "next/image";
import { QrCode, CheckCircle, Smartphone, CreditCard, AlertCircle, X, ShieldCheck } from "lucide-react";

interface FonepayQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  totalAmount: number;
}

export function FonepayQRModal({
  isOpen,
  onClose,
  onPaymentSuccess,
  totalAmount,
}: FonepayQRModalProps) {
  const [verifying, setVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onPaymentSuccess();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 p-2">
            <Image
              src="/npx-logo.png"
              alt="NPX"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
          </div>
          <h2 className="mt-3 text-xl font-bold">NPX Unified Gateway</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Mobile Banking (50+ Banks) • Visa / MasterCard • ConnectIPS
          </p>
        </div>

        {/* Dynamic QR Display Box */}
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-6">
          <div className="relative flex h-52 w-52 items-center justify-center rounded-xl bg-white p-3 shadow-inner">
            {/* SVG NPX QR Code representation */}
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="white" />
              {/* Corner 1 */}
              <rect x="10" y="10" width="26" height="26" fill="black" />
              <rect x="14" y="14" width="18" height="18" fill="white" />
              <rect x="18" y="18" width="10" height="10" fill="black" />
              {/* Corner 2 */}
              <rect x="64" y="10" width="26" height="26" fill="black" />
              <rect x="68" y="14" width="18" height="18" fill="white" />
              <rect x="72" y="18" width="10" height="10" fill="black" />
              {/* Corner 3 */}
              <rect x="10" y="64" width="26" height="26" fill="black" />
              <rect x="14" y="68" width="18" height="18" fill="white" />
              <rect x="18" y="72" width="10" height="10" fill="black" />
              {/* Data pattern simulation */}
              <rect x="42" y="12" width="6" height="6" fill="black" />
              <rect x="52" y="12" width="6" height="12" fill="black" />
              <rect x="42" y="24" width="12" height="6" fill="black" />
              <rect x="12" y="42" width="6" height="12" fill="black" />
              <rect x="24" y="42" width="12" height="6" fill="black" />
              <rect x="42" y="42" width="16" height="16" fill="#00BCD4" />
              <rect x="64" y="42" width="10" height="6" fill="black" />
              <rect x="80" y="42" width="8" height="12" fill="black" />
              <rect x="64" y="54" width="6" height="18" fill="black" />
              <rect x="76" y="60" width="12" height="6" fill="black" />
              <rect x="42" y="64" width="16" height="6" fill="black" />
              <rect x="42" y="76" width="6" height="12" fill="black" />
              <rect x="54" y="82" width="12" height="6" fill="black" />
              <rect x="76" y="76" width="12" height="12" fill="black" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded bg-[#00BCD4] px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                NPX
              </span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-muted-foreground">Payable Amount</span>
            <div className="font-display text-2xl font-bold text-foreground">
              Rs. {totalAmount.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Merchant: <strong className="text-foreground">Deal Drip Nepal Pvt. Ltd.</strong>
            </p>
          </div>
        </div>

        {/* Steps & Supported Methods */}
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-accent shrink-0" />
            <span>Scan with Global IME, NIC Asia, Nabil, Prabhu &amp; all mobile banking apps</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-chart-2 shrink-0" />
            <span>Visa, MasterCard &amp; SCT card payments supported via unified gateway</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-chart-2 shrink-0" />
            <span>Amount is pre-filled. Confirm payment to complete order.</span>
          </div>
        </div>

        {/* Confirm Payment Simulation Button */}
        <button
          onClick={handleSimulatePayment}
          disabled={verifying}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-xs font-semibold tracking-wider text-background uppercase transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {verifying ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              <span>Verifying Gateway Transaction...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>I Have Completed Payment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

