// ==============================================================================
// PRICE TRACKER SK — CORE DOMAIN MODELS & TYPES
// ==============================================================================

export type RetailerSlug = 'lidl' | 'tesco' | 'billa';

export type BaseUnit = 'kg' | 'l' | 'ks' | '100g';
export type RawPackageUnit = 'g' | 'kg' | 'dg' | 'ml' | 'dl' | 'cl' | 'l' | 'ks' | 'kus' | 'bal';

export type MatchType = 'EXACT_MATCH' | 'EQUIVALENT_PRODUCT' | 'SIMILAR_PRODUCT' | 'NO_MATCH';
export type MatchStatus = 'VERIFIED' | 'PENDING_REVIEW' | 'REJECTED';
export type AvailabilityStatus = 'VERIFIED_IN_STOCK' | 'LEAFLET_OFFER' | 'UNKNOWN' | 'UNAVAILABLE';
export type DataSourceType =
  | 'LIVE_SSR_ADAPTER'
  | 'LIVE_GRAPHQL_ADAPTER'
  | 'VERIFIED_LEAFLET_CSV'
  | 'MANUAL_ADMIN_ENTRY';

export interface Retailer {
  id: string;
  slug: RetailerSlug;
  name: string;
  countryCode: 'SK';
  websiteUrl: string;
  offersUrl: string;
  loyaltyProgramName: string | null;
  logoBrandColor: string;
  adapterType: string;
  isActive: boolean;
}

export interface ProductIdentifier {
  id: string;
  productId: string;
  identifierType: 'EAN13' | 'EAN8' | 'GTIN' | 'LIDL_ERP' | 'TESCO_TPN' | 'BILLA_SKU';
  identifierValue: string;
  isPrimary: boolean;
  verifiedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  relatedProductId: string | null;
  variantName: string;
  packageQuantity: number;
  packageUnit: string;
  relationshipType: 'FLAVOR' | 'FAT_CONTENT' | 'PACKAGE_SIZE' | 'EQUIVALENT_BRAND';
}

export interface PriceObservation {
  id: string;
  listingId: string;
  dataSourceId: string;
  importJobId: string | null;
  currency: 'EUR';
  regularPriceCents: number | null;
  promoPriceCents: number | null;
  loyaltyPriceCents: number | null;
  effectivePriceCents: number | null;
  unitPriceCents: number | null;
  loyaltyUnitPriceCents: number | null;
  baseUnit: BaseUnit;
  lowest30DayPriceCents: number | null;
  isPromotional: boolean;
  requiresLoyaltyCard: boolean;
  loyaltyProgramName: string | null;
  discountPercentage: number | null;
  observedAt: string;
  observationDay: string; // YYYY-MM-DD
  validFrom: string | null;
  validTo: string | null;
  sourceUrl: string;
  deduplicationHash: string;
}

export interface PromotionCondition {
  id: string;
  promotionId: string;
  conditionType: 'LOYALTY_CARD' | 'MIN_QUANTITY' | 'MAX_QUANTITY' | 'STORE_FORMAT';
  conditionLabel: string;
  minQuantity: number | null;
  maxQuantity: number | null;
  loyaltyCardName: string | null;
}

export interface Promotion {
  id: string;
  retailerId: string;
  listingId: string;
  title: string;
  promotionType: 'REGULAR_PROMO' | 'LOYALTY_CARD_PROMO' | 'MULTIBUY';
  regularPriceCents: number | null;
  promoPriceCents: number;
  discountPercentage: number | null;
  requiresLoyaltyCard: boolean;
  loyaltyProgramName: string | null;
  validFrom: string;
  validTo: string;
  isExpired: boolean;
  leafletName: string | null;
  sourceUrl: string;
  verifiedAt: string;
  conditions: PromotionCondition[];
}

export interface RetailerProductListing {
  id: string;
  retailerId: string;
  retailerSlug: RetailerSlug;
  retailerName: string;
  productId: string;
  externalId: string;
  externalSku: string | null;
  externalBarcode: string | null;
  retailerTitle: string;
  retailerBrand: string | null;
  packageLabel: string;
  packageQuantity: number;
  packageUnit: string;
  sourceUrl: string;
  imageUrl: string | null;
  matchType: MatchType;
  matchConfidence: number;
  matchStatus: MatchStatus;
  availabilityStatus: AvailabilityStatus;
  lastVerifiedAt: string;
  latestObservation: PriceObservation | null;
  activePromotion: Promotion | null;
}

export interface ProductWithOffers {
  id: string;
  slug: string;
  canonicalName: string;
  brand: string | null;
  categorySlug: string;
  categoryName: string;
  subcategoryName: string | null;
  packageQuantity: number;
  packageUnit: string;
  normalizedQuantity: number;
  normalizedUnit: BaseUnit;
  variantDescriptor: string | null;
  imageUrl: string | null;
  description: string | null;
  isEssentialStaple: boolean;
  identifiers: ProductIdentifier[];
  variants: ProductVariant[];
  listings: RetailerProductListing[];
  historicalMinCents: number | null;
  historicalMaxCents: number | null;
  lastUpdatedAt: string | null;
}

export interface LoyaltyPreferences {
  includeLidlPlus: boolean;
  includeTescoClubcard: boolean;
  includeBillaBonus: boolean;
}

export interface EffectiveOfferEvaluation {
  retailerSlug: RetailerSlug;
  retailerName: string;
  listingId: string;
  isPriceAvailable: boolean;
  effectivePriceCents: number | null;
  regularPriceCents: number | null;
  promoPriceCents: number | null;
  loyaltyPriceCents: number | null;
  effectiveUnitPriceCents: number | null;
  baseUnit: BaseUnit;
  priceType: 'REGULAR' | 'PROMO' | 'LOYALTY' | 'UNAVAILABLE';
  loyaltyProgramName: string | null;
  verifiedDiscountPercent: number | null;
  absoluteSavingsCents: number | null;
  isPromotionExpired: boolean;
  validTo: string | null;
  observedAt: string | null;
  sourceUrl: string;
  dataSourceName: string;
  availabilityStatus: AvailabilityStatus;
  packageQuantity: number;
  packageUnit: string;
  hasPackageSizeMismatch: boolean;
}

export interface ShoppingListItemInput {
  id: string;
  productId: string | null;
  customTitle: string | null;
  quantity: number;
  isPurchased: boolean;
  product?: ProductWithOffers | null;
}

export interface StoreBasketLineItem {
  itemId: string;
  productId: string | null;
  title: string;
  quantity: number;
  packageLabel: string | null;
  unitPriceCents: number | null;
  regularUnitPriceCents: number | null;
  lineTotalCents: number | null;
  lineRegularTotalCents: number | null;
  lineSavingsCents: number;
  priceType: 'REGULAR' | 'PROMO' | 'LOYALTY' | 'UNAVAILABLE';
  loyaltyProgramName: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
}

export interface SingleStoreBasketEvaluation {
  retailerSlug: RetailerSlug;
  retailerName: string;
  loyaltyProgramName: string | null;
  basketStatus: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE';
  totalRequestedItems: number;
  verifiedPricedItems: number;
  missingPriceItemsCount: number;
  coveragePercentage: number;
  knownSubtotalCents: number;
  completeBasketTotalCents: number | null; // Non-null ONLY when basketStatus === 'COMPLETE'
  regularSubtotalCents: number;
  totalSavingsCents: number;
  loyaltyCardSavingsCents: number;
  pricedLineItems: StoreBasketLineItem[];
  missingItems: Array<{
    itemId: string;
    productId: string | null;
    title: string;
    quantity: number;
    reason: 'UNCATALOGED_CUSTOM_ITEM' | 'NO_RETAILER_LISTING' | 'PRICE_UNAVAILABLE';
  }>;
}

export interface MultiStoreAllocation {
  retailerSlug: RetailerSlug;
  retailerName: string;
  assignedItems: StoreBasketLineItem[];
  storeSubtotalCents: number;
  storeSavingsCents: number;
}

export interface MultiStoreBasketStrategy {
  maxStoresAllowed: number;
  storesUsedCount: number;
  tripCostPerExtraStoreCents: number;
  totalTripPenaltyCents: number;
  itemsGrossTotalCents: number;
  netEffectiveTotalCents: number; // itemsGrossTotalCents + totalTripPenaltyCents
  verifiedPricedItems: number;
  totalRequestedItems: number;
  isCompleteCoverage: boolean;
  allocations: MultiStoreAllocation[];
  unpricedItems: Array<{
    itemId: string;
    productId: string | null;
    title: string;
    quantity: number;
  }>;
  savingsVsBestSingleStoreGrossCents: number | null;
  savingsVsBestSingleStoreNetCents: number | null; // After subtracting extra trip costs
  isMultiStoreWorthwhileAfterTripCost: boolean;
  explanationNotes: string[];
}

export interface BasketOptimizationResult {
  evaluatedAt: string;
  loyaltyPreferences: LoyaltyPreferences;
  singleStoreByRetailer: Record<RetailerSlug, SingleStoreBasketEvaluation>;
  cheapestCompleteSingleStore: {
    retailerSlug: RetailerSlug;
    retailerName: string;
    totalCents: number;
    savingsVsMostExpensiveCompleteCents: number;
    savingsPercentage: number;
  } | null;
  bestPartialSingleStore: {
    retailerSlug: RetailerSlug;
    retailerName: string;
    verifiedPricedItems: number;
    totalRequestedItems: number;
    knownSubtotalCents: number;
  } | null;
  comparableCommonSubset: {
    commonItemCount: number;
    totalsByRetailerCents: Record<RetailerSlug, number | null>;
    cheapestRetailerOnCommonSubset: RetailerSlug | null;
    maxSavingsOnCommonSubsetCents: number;
  };
  multiStoreStrategy: MultiStoreBasketStrategy;
}
