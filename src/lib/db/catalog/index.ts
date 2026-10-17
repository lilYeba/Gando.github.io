// ==============================================================================
// PRICE CHECKER SK — CONSOLIDATED 300+ PRODUCT CATALOG
// Combines all 15 grocery categories for Lidl, Tesco, and BILLA Slovakia
// ==============================================================================

import type { SeedProductDefinition } from '../seed-data';

import { CATEGORIES_1_TO_3 } from './categories-1-to-3';
import { CATEGORIES_4_TO_6 } from './categories-4-to-6';
import { CATEGORIES_7_TO_9 } from './categories-7-to-9';
import { CATEGORIES_10_TO_12 } from './categories-10-to-12';
import { CATEGORIES_13_TO_15 } from './categories-13-to-15';

export const ALL_CATALOG_PRODUCTS: SeedProductDefinition[] = [
  ...CATEGORIES_1_TO_3,
  ...CATEGORIES_4_TO_6,
  ...CATEGORIES_7_TO_9,
  ...CATEGORIES_10_TO_12,
  ...CATEGORIES_13_TO_15,
];

export {
  CATEGORIES_1_TO_3,
  CATEGORIES_4_TO_6,
  CATEGORIES_7_TO_9,
  CATEGORIES_10_TO_12,
  CATEGORIES_13_TO_15,
};
