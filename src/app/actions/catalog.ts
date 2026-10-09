'use server';

import { searchDbProducts, getDbProducts, getDbProductBySlug, getDbProductsByCategory } from '@/db/queries/catalog';

export async function searchProductsAction(query: string) {
  try {
    const results = await searchDbProducts(query);
    return { success: true, products: results };
  } catch (err: any) {
    return { success: false, error: err.message, products: [] };
  }
}

export async function getProductsAction() {
  try {
    const products = await getDbProducts();
    return { success: true, products };
  } catch (err: any) {
    return { success: false, error: err.message, products: [] };
  }
}
