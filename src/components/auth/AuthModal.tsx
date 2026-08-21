"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AuthView } from "@neondatabase/auth-ui";

interface AuthModalProps {
  children?: React.ReactNode;
  defaultView?: "signIn" | "signUp";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AuthModal({
  children,
  defaultView = "signIn",
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: AuthModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-md border-border/60 bg-card/95 p-6 backdrop-blur-xl shadow-2xl sm:rounded-2xl">
        <DialogHeader className="flex flex-col items-center text-center pb-2">
          <div className="flex items-center gap-2 mb-1">
            <Image
              src="/deal-drip-logo.png"
              alt="Deal Drip Logo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="font-display text-sm font-bold tracking-[0.2em] uppercase text-foreground">
              Deal Drip Auth
            </span>
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            {defaultView === "signUp" ? "Create your Account" : "Welcome Back"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Powered by Neon Auth & PostgreSQL
          </p>
        </DialogHeader>

        <div className="neon-auth-container mt-2">
          <AuthView
            view={defaultView === "signUp" ? "SIGN_UP" : "SIGN_IN"}
            redirectTo="/"
            pathname="/auth"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
