'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { catalog, getProduct, Product } from '@/data/catalog';

export type CategoryFilter = 'All' | 'Audio' | 'Gaming' | 'Everyday';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreContextType {
  filter: CategoryFilter;
  setFilter: (category: CategoryFilter) => void;
  filteredProducts: Product[];
  bag: Record<string, number>;
  cartItems: CartItem[];
  bagCount: number;
  bagTotal: number;
  addToBag: (id: string, count?: number) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromBag: (id: string) => void;
  clearBag: () => void;
  quickviewProduct: Product | null;
  openQuickview: (product: Product | string) => void;
  closeQuickview: () => void;
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
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const addToBag = useCallback((id: string, count = 1) => {
    const product = getProduct(id);
    if (!product || count < 1 || count > 99) return;

    setBag((prev) => {
      const current = prev[id] || 0;
      const next = Math.min(99, current + count);
      return { ...prev, [id]: next };
    });

    showToast(`${product.name} added to your bag`);
  }, [showToast]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setBag((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: Math.min(99, next) };
    });
  }, []);

  const removeFromBag = useCallback((id: string) => {
    setBag((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const clearBag = useCallback(() => {
    setBag({});
  }, []);

  const openQuickview = useCallback((productOrId: Product | string) => {
    const prod = typeof productOrId === 'string' ? getProduct(productOrId) : productOrId;
    if (prod) {
      setQuickviewProduct(prod);
    }
  }, []);

  const closeQuickview = useCallback(() => {
    setQuickviewProduct(null);
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
    return Object.entries(bag)
      .map(([id, quantity]) => {
        const product = getProduct(id);
        if (!product) return null;
        return { product, quantity };
      })
      .filter((item): item is CartItem => item !== null);
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
      openQuickview,
      closeQuickview,
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
      openQuickview,
      closeQuickview,
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
