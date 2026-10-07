'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { catalog, getProduct, Product } from '@/data/catalog';

export type CategoryFilter = 'All' | 'Audio' | 'Gaming' | 'Everyday';

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
  variantName?: string;
  cartKey: string;
}

interface StoreContextType {
  filter: CategoryFilter;
  setFilter: (category: CategoryFilter) => void;
  filteredProducts: Product[];
  bag: Record<string, number>;
  cartItems: CartItem[];
  bagCount: number;
  bagTotal: number;
  addToBag: (id: string, count?: number, variantId?: string) => void;
  updateQuantity: (cartKey: string, delta: number) => void;
  removeFromBag: (cartKey: string) => void;
  clearBag: () => void;
  quickviewProduct: Product | null;
  quickviewVariantId: string | null;
  openQuickview: (product: Product | string, variantId?: string) => void;
  closeQuickview: () => void;
  speakerVariant: 'black' | 'white';
  setSpeakerVariant: (variant: 'black' | 'white') => void;
  isBagOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  isCheckoutOpen: boolean;
  openCheckout: () => void;
  closeCheckout: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<CategoryFilter>('All');
  const [bag, setBag] = useState<Record<string, number>>({});
  const [quickviewProduct, setQuickviewProduct] = useState<Product | null>(null);
  const [quickviewVariantId, setQuickviewVariantId] = useState<string | null>(null);
  const [speakerVariant, setSpeakerVariant] = useState<'black' | 'white'>('black');
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const addToBag = useCallback((id: string, count = 1, variantId?: string) => {
    const product = getProduct(id);
    if (!product || count < 1 || count > 99) return;

    const resolvedVariantId =
      variantId || (product.variants ? product.defaultVariant || product.variants[0]?.id : undefined);
    const cartKey = resolvedVariantId ? `${id}:${resolvedVariantId}` : id;

    setBag((prev) => {
      const current = prev[cartKey] || 0;
      const next = Math.min(99, current + count);
      return { ...prev, [cartKey]: next };
    });

    const variantObj = product.variants?.find((v) => v.id === resolvedVariantId);
    const finishLabel = variantObj ? ` (${variantObj.name})` : '';
    showToast(`${product.name}${finishLabel} added to your bag`);
  }, [showToast]);

  const updateQuantity = useCallback((cartKey: string, delta: number) => {
    setBag((prev) => {
      const current = prev[cartKey] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[cartKey];
        return copy;
      }
      return { ...prev, [cartKey]: Math.min(99, next) };
    });
  }, []);

  const removeFromBag = useCallback((cartKey: string) => {
    setBag((prev) => {
      const copy = { ...prev };
      delete copy[cartKey];
      return copy;
    });
  }, []);

  const clearBag = useCallback(() => {
    setBag({});
  }, []);

  const openQuickview = useCallback((productOrId: Product | string, variantId?: string) => {
    const prod = typeof productOrId === 'string' ? getProduct(productOrId) : productOrId;
    if (prod) {
      setQuickviewProduct(prod);
      setQuickviewVariantId(variantId || prod.defaultVariant || null);
    }
  }, []);

  const closeQuickview = useCallback(() => {
    setQuickviewProduct(null);
    setQuickviewVariantId(null);
  }, []);

  const openBag = useCallback(() => setIsBagOpen(true), []);
  const closeBag = useCallback(() => setIsBagOpen(false), []);
  const openCheckout = useCallback(() => setIsCheckoutOpen(true), []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const filteredProducts = useMemo(() => {
    if (filter === 'All') return catalog;
    return catalog.filter((p) => p.category === filter);
  }, [filter]);

  const cartItems = useMemo<CartItem[]>(() => {
    const items: CartItem[] = [];
    for (const [cartKey, quantity] of Object.entries(bag)) {
      const parts = cartKey.split(':');
      const productId = parts[0];
      const variantId = parts[1];
      const product = getProduct(productId);
      if (product) {
        const variantObj = product.variants?.find((v) => v.id === variantId);
        items.push({
          product,
          quantity,
          variantId,
          variantName: variantObj?.name,
          cartKey,
        });
      }
    }
    return items;
  }, [bag]);

  const bagCount = useMemo(() => {
    return Object.values(bag).reduce((sum, q) => sum + q, 0);
  }, [bag]);

  const bagTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cartItems]);

  const value = useMemo(
    () => ({
      filter,
      setFilter,
      filteredProducts,
      bag,
      cartItems,
      bagCount,
      bagTotal,
      addToBag,
      updateQuantity,
      removeFromBag,
      clearBag,
      quickviewProduct,
      quickviewVariantId,
      openQuickview,
      closeQuickview,
      speakerVariant,
      setSpeakerVariant,
      isBagOpen,
      openBag,
      closeBag,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
      toastMessage,
      showToast,
    }),
    [
      filter,
      filteredProducts,
      bag,
      cartItems,
      bagCount,
      bagTotal,
      addToBag,
      updateQuantity,
      removeFromBag,
      clearBag,
      quickviewProduct,
      quickviewVariantId,
      openQuickview,
      closeQuickview,
      speakerVariant,
      setSpeakerVariant,
      isBagOpen,
      openBag,
      closeBag,
      isCheckoutOpen,
      openCheckout,
      closeCheckout,
      toastMessage,
      showToast,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
