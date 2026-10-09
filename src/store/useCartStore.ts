import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { catalog, getProduct, getPreviewUrl, Product } from '@/data/catalog';
import { CartItem } from '@/types/cart';

interface CartState {
  items: Record<string, CartItem>;
  isDrawerOpen: boolean;
  isHydrated: boolean;

  // Actions
  addItem: (productOrId: Product | string, count?: number, variantId?: string) => void;
  updateQuantity: (cartKey: string, nextQty: number) => void;
  incrementQuantity: (cartKey: string) => void;
  decrementQuantity: (cartKey: string) => void;
  removeItem: (cartKey: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      isDrawerOpen: false,
      isHydrated: false,

      setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

      addItem: (productOrId, count = 1, variantId) => {
        const product =
          typeof productOrId === 'string' ? getProduct(productOrId) : productOrId;
        if (!product) return;

        const safeCount = Math.max(1, Math.min(99, count));
        const resolvedVariantId =
          variantId ||
          (product.variants && product.variants.length > 0
            ? product.defaultVariant || product.variants[0].id
            : undefined);

        const cartKey = resolvedVariantId
          ? `${product.id}:${resolvedVariantId}`
          : product.id;

        const variantObj = product.variants?.find((v) => v.id === resolvedVariantId);
        const variantName = variantObj?.name;
        const color = variantObj?.color || product.color;
        const thumbnail = getPreviewUrl(product, resolvedVariantId);

        set((state) => {
          const existing = state.items[cartKey];
          const currentQty = existing ? existing.quantity : 0;
          const nextQty = Math.min(99, currentQty + safeCount);

          const updatedItem: CartItem = {
            id: cartKey,
            productId: product.id,
            slug: product.id,
            name: product.name,
            thumbnail,
            variantId: resolvedVariantId,
            variantName,
            color,
            quantity: nextQty,
            price: product.price,
            currency: 'NPR',
          };

          return {
            items: {
              ...state.items,
              [cartKey]: updatedItem,
            },
          };
        });

        const finishLabel = variantName ? ` (${variantName})` : '';
        toast.success(`${product.name}${finishLabel} added to your bag`);
      },

      updateQuantity: (cartKey, nextQty) => {
        set((state) => {
          const item = state.items[cartKey];
          if (!item) return state;

          // Quantity rules: Minimum 1. Decrementing does not auto-delete.
          const clamped = Math.max(1, Math.min(99, nextQty));
          return {
            items: {
              ...state.items,
              [cartKey]: {
                ...item,
                quantity: clamped,
              },
            },
          };
        });
      },

      incrementQuantity: (cartKey) => {
        const item = get().items[cartKey];
        if (item) {
          get().updateQuantity(cartKey, item.quantity + 1);
        }
      },

      decrementQuantity: (cartKey) => {
        const item = get().items[cartKey];
        if (item && item.quantity > 1) {
          get().updateQuantity(cartKey, item.quantity - 1);
        }
      },

      removeItem: (cartKey) => {
        const item = get().items[cartKey];
        const itemName = item?.name || 'Item';
        const finishLabel = item?.variantName ? ` (${item.variantName})` : '';

        set((state) => {
          const updated = { ...state.items };
          delete updated[cartKey];
          return { items: updated };
        });

        toast.info(`${itemName}${finishLabel} removed from cart`);
      },

      clearCart: () => {
        set({ items: {} });
      },
    }),
    {
      name: 'dealdrip_cart_storage_v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist cart items, not transient UI states like drawer open
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

// Helpers and selectors
export const selectCartItemsList = (state: CartState): CartItem[] => {
  return Object.values(state.items);
};

export const selectCartTotalCount = (state: CartState): number => {
  return Object.values(state.items).reduce((sum, item) => sum + item.quantity, 0);
};

export const selectCartSubtotal = (state: CartState): number => {
  return Object.values(state.items).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
};
