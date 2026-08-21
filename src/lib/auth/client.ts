"use client";

import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;

export const signInWithGoogle = async (callbackURL: string = "/") => {
  return authClient.signIn.social({
    provider: "google",
    callbackURL,
  });
};
