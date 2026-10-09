'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { catalog, getProduct, Product } from '@/data/catalog';
import {
  useCartStore,
  selectCartItemsList,
  selectCartTotalCount,
  selectCartSubtotal,
} from '@/store/useCartStore';
import { CartItem as StoreCartItem } from '@/types/cart';

export type CategoryFilter = 'All' | 'Audio' | 'Gaming' | 'Everyday';

// Backwards-compatible CartItem shape for existing legacy components
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
  const [quickviewProduct, setQuickviewProduct] = useState<Product | null>(null);
  const [quickviewVariantId, setQuickviewVariantId] = useState<string | null>(null);
  const [speakerVariant, setSpeakerVariant] = useState<'black' | 'white'>('black');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hook into persistent Zustand cart store
  const cartStoreItems = useCartStore((s) => s.items);
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const isHydrated = useCartStore((s) => s.isHydrated);
  const addItem = useCartStore((s) => s.addItem);
  const updateStoreQty = useCartStore((s) => s.updateQuantity);
  const removeStoreItem = useCartStore((s) => s.removeItem);
  const clearStoreCart = useCartStore((s) => s.clearCart);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const closeDrawer = useCartStore((s) => s.closeDrawer);

  // Hydration sync
  const [clientHydrated, setClientHydrated] = useState(false);
  useEffect(() => {
    setClientHydrated(true);
    useCartStore.getState().setHydrated(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const addToBag = useCallback(
    (id: string, count = 1, variantId?: string) => {
      addItem(id, count, variantId);
    },
    [addItem]
  );

  const updateQuantity = useCallback(
    (cartKey: string, delta: number) => {
      const currentItem = cartStoreItems[cartKey];
      if (!currentItem) return;
      const next = currentItem.quantity + delta;
      if (next <= 0) {
        removeStoreItem(cartKey);
      } else {
        updateStoreQty(cartKey, next);
      }
    },
    [cartStoreItems, removeStoreItem, updateStoreQty]
  );

  const removeFromBag = useCallback(
    (cartKey: string) => {
      removeStoreItem(cartKey);
    },
    [removeStoreItem]
  );

  const clearBag = useCallback(() => {
    clearStoreCart();
  }, [clearStoreCart]);

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

  const openBag = useCallback(() => openDrawer(), [openDrawer]);
  const closeBag = useCallback(() => closeDrawer(), [closeDrawer]);
  const openCheckout = useCallback(() => setIsCheckoutOpen(true), []);
  const closeCheckout = useCallback(() => setIsCheckoutOpen(false), []);

  const filteredProducts = useMemo(() => {
    if (filter === 'All') return catalog;
    return catalog.filter((p) => p.category === filter);
  }, [filter]);

  // Derived bag dictionary { [cartKey]: quantity }
  const bag = useMemo(() => {
    if (!clientHydrated) return {};
    const res: Record<string, number> = {};
    for (const [key, item] of Object.entries(cartStoreItems)) {
      res[key] = item.quantity;
    }
    return res;
  }, [cartStoreItems, clientHydrated]);

  // Derived legacy CartItem array
  const cartItems = useMemo<CartItem[]>(() => {
    if (!clientHydrated) return [];
    const items: CartItem[] = [];
    for (const [cartKey, item] of Object.entries(cartStoreItems)) {
      const product = getProduct(item.productId);
      if (product) {
        items.push({
          product,
          quantity: item.quantity,
          variantId: item.variantId,
          variantName: item.variantName,
          cartKey,
        });
      }
    }
    return items;
  }, [cartStoreItems, clientHydrated]);

  const bagCount = useMemo(() => {
    if (!clientHydrated) return 0;
    return Object.values(cartStoreItems).reduce((sum, item) => sum + item.quantity, 0);
  }, [cartStoreItems, clientHydrated]);

  const bagTotal = useMemo(() => {
    if (!clientHydrated) return 0;
    return Object.values(cartStoreItems).reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [cartStoreItems, clientHydrated]);

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
      isBagOpen: isDrawerOpen,
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
      isDrawerOpen,
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
