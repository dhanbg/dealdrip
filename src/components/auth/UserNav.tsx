"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { User, LogOut, Package, Settings, LogIn } from "lucide-react";
import { toast } from "sonner";

import { useSession, signOut } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthModal } from "./AuthModal";

export function UserNav({ className }: { className?: string }) {
  const { data: session, isPending } = useSession();
  const [modalOpen, setModalOpen] = useState(false);
  const isSigningOutRef = useRef(false);

  const handleSignOut = async () => {
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;

    try {
      await signOut();
      toast.success("Signed out successfully", { id: "auth-signout" });
    } catch (err) {
      toast.error("Failed to sign out", { id: "auth-signout" });
    } finally {
      setTimeout(() => {
        isSigningOutRef.current = false;
      }, 500);
    }
  };

  if (isPending) {
    return (
      <div className={`h-8 w-8 animate-pulse rounded-full bg-muted/40 ${className || ""}`} />
    );
  }

  if (!session?.user) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 rounded-full border-border/80 bg-background/50 px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase text-foreground backdrop-blur-md transition-all hover:border-accent hover:bg-accent/10 hover:text-accent active:scale-95 ${className || ""}`}
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Sign In</span>
        </Button>
        <AuthModal open={modalOpen} onOpenChange={setModalOpen} />
      </>
    );
  }

  const user = session.user;
  const displayName = user.name || user.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 p-1 pr-2.5 backdrop-blur-md transition-all hover:border-accent/80 hover:bg-card/90 focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="User Account Menu"
          >
            <Avatar className="h-7 w-7 border border-border/80">
              <AvatarImage src={user.image || undefined} alt={displayName} />
              <AvatarFallback className="bg-accent/20 text-[10px] font-bold text-accent font-mono">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[100px] truncate text-xs font-medium text-foreground">
              {displayName}
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 border-border/80 bg-card/95 p-1.5 backdrop-blur-xl shadow-xl"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1 p-1">
              <p className="text-xs font-semibold leading-none text-foreground">
                {displayName}
              </p>
              <p className="text-[11px] leading-none text-muted-foreground truncate font-mono">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/60" />

          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                href="/auth/account"
                className="flex cursor-pointer items-center gap-2 text-xs text-foreground/90 hover:text-foreground"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Account Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/checkout"
                className="flex cursor-pointer items-center gap-2 text-xs text-foreground/90 hover:text-foreground"
              >
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span>My Checkout & Cart</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="bg-border/60" />

          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleSignOut();
            }}
            className="flex cursor-pointer items-center gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
