'use client';

import { useEffect } from 'react';
import { catalog, getProduct } from '@/data/catalog';
import { useStore } from '@/context/StoreContext';

export function WebMCPBridge() {
  const { addToBag, openBag, bag, bagTotal } = useStore();

  useEffect(() => {
    // Preserve modelContext agent tool registration if supported
    const context = (window as any).modelContext || (document as any).modelContext;
    if (!context?.registerTool) return;

    const lifecycle = new AbortController();
    const register = (tool: any) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal })
        ).catch(() => {});
      } catch {}
    };

    register({
      name: 'list_products',
      title: 'Browse Deal Drip products',
      description:
        'Read the product catalog and sample prices for this storefront concept.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['All', 'Audio', 'Gaming', 'Everyday'],
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input: any) {
        if (
          input?.category &&
          !['All', 'Audio', 'Gaming', 'Everyday'].includes(input.category)
        ) {
          throw Error('Invalid category');
        }
        return catalog
          .filter(
            (p) =>
              !input?.category ||
              input.category === 'All' ||
              p.category === input.category
          )
          .map(({ id, name, category, price }) => ({
            id,
            name,
            category,
            price,
            currency: 'NPR',
          }));
      },
    });

    register({
      name: 'add_products_to_bag',
      title: 'Add products to bag',
      description:
        'Add selected products and quantities to the visible shopping bag. Does not purchase or submit an order.',
      inputSchema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'integer', minimum: 1, maximum: 99 },
              },
              required: ['productId', 'quantity'],
              additionalProperties: false,
            },
          },
        },
        required: ['items'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute(input: any) {
        if (
          !input ||
          !Array.isArray(input.items) ||
          !input.items.length ||
          input.items.length > 20 ||
          input.items.some(
            (x: any) =>
              !getProduct(x.productId) ||
              !Number.isInteger(x.quantity) ||
              x.quantity < 1 ||
              x.quantity > 99
          )
        ) {
          throw Error('Invalid products or quantities');
        }

        input.items.forEach((x: any) => addToBag(x.productId, x.quantity));
        openBag();

        return {
          items: Object.entries(bag).map(([id, quantity]) => ({ id, quantity })),
          total: bagTotal,
          currency: 'NPR',
          orderSubmitted: false,
        };
      },
    });

    return () => {
      lifecycle.abort();
    };
  }, [addToBag, openBag, bag, bagTotal]);

  return null;
}
