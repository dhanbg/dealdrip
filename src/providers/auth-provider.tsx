"use client";

import React, { useEffect, useState } from "react";
import { AuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <AuthUIProvider
      authClient={authClient}
      social={{
        providers: ["google"],
      }}
    >
      {children}
    </AuthUIProvider>
  );
}
