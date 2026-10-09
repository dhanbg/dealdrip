'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.info('Signed out of Deal Drip.');
      router.push('/');
      router.refresh();
    } catch {
      toast.error('Failed to sign out.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="cart-clear-all-btn"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      <LogOut size={15} />
      <span>Sign out</span>
    </button>
  );
}
