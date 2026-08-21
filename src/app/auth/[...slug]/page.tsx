"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { AuthView, AccountView } from "@neondatabase/auth-ui";

export default function AuthSlugPage() {
  const params = useParams();
  const slug = params?.slug;
  const pathSegment = Array.isArray(slug) ? slug[0] : slug || "sign-in";

  const isAccountView = pathSegment === "account" || pathSegment === "profile" || pathSegment === "settings";

  // Map route segment to AuthView view prop
  let view: "SIGN_IN" | "SIGN_UP" | "FORGOT_PASSWORD" | "RESET_PASSWORD" = "SIGN_IN";
  if (pathSegment === "sign-up" || pathSegment === "signup" || pathSegment === "register") {
    view = "SIGN_UP";
  } else if (pathSegment === "forgot-password" || pathSegment === "forgot") {
    view = "FORGOT_PASSWORD";
  } else if (pathSegment === "reset-password" || pathSegment === "reset") {
    view = "RESET_PASSWORD";
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 selection:bg-accent selection:text-accent-foreground">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-accent/15 via-primary/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute bottom-0 right-10 w-[400px] h-[250px] bg-accent/10 blur-3xl opacity-40" />
      </div>

      {/* Top Header / Back Button */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Store</span>
        </Link>

        <div className="flex items-center gap-2">
          <Image
            src="/deal-drip-logo.png"
            alt="Deal Drip"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span className="font-display text-xs font-bold tracking-[0.2em] uppercase text-foreground">
            Deal Drip
          </span>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/70 bg-card/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            {isAccountView
              ? "Account Settings"
              : view === "SIGN_UP"
              ? "Create Deal Drip Account"
              : view === "FORGOT_PASSWORD"
              ? "Reset Password"
              : "Welcome Back"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {isAccountView
              ? "Manage your profile, security, and linked sessions"
              : "Secure authentication powered by Neon PostgreSQL"}
          </p>
        </div>

        {isAccountView ? (
          <div className="neon-account-wrapper">
            <AccountView pathname="/auth" />
          </div>
        ) : (
          <div className="neon-auth-wrapper">
            <AuthView
              view={view}
              pathname="/auth"
              redirectTo="/"
            />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-mono">
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span>Neon Serverless Auth • 256-bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
}
