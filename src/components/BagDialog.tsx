'use client';

import React from 'react';
import { CartDrawer } from './CartDrawer';

/**
 * BagDialog re-exports the refined CartDrawer for complete backwards-compatibility.
 */
export function BagDialog() {
  return <CartDrawer />;
}
