// ==============================================================================
// PRICE TRACKER SK — DECIMAL-SAFE MONEY, UNIT NORMALIZATION & DISCOUNT ENGINE
// ==============================================================================

import type {
  BaseUnit,
  EffectiveOfferEvaluation,
  LoyaltyPreferences,
  RetailerProductListing,
  RetailerSlug,
} from './types';

/**
 * Converts a EUR decimal number or string (e.g. 1.99 or "1,99") into exact integer cents.
 * Returns null if the input is null, undefined, NaN, or non-positive.
 */
export function eurosToCents(input: number | string | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input <= 0) return null;
    return Math.round(input * 100);
  }
  const cleaned = input
    .trim()
    .replace(/\s+/g, '')
    .replace(/€/g, '')
    .replace(/EUR/gi, '')
    .replace(',', '.');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
}

/**
 * Converts integer cents back to a 2-decimal EUR number (e.g. 199 -> 1.99).
 */
export function centsToEuros(cents: number | null | undefined): number | null {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return null;
  return Math.round(cents) / 100;
}

/**
 * Formats integer cents in Slovak EUR convention (e.g. 199 -> "1,99 €").
 * Never renders missing prices as "0,00 €" — returns fallback label instead.
 */
export function formatEurCents(
  cents: number | null | undefined,
  options?: { unavailableLabel?: string; showPlusSign?: boolean }
): string {
  const unavailableLabel = options?.unavailableLabel ?? 'Cena nedostupná';
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return unavailableLabel;
  }
  const sign = cents < 0 ? '-' : options?.showPlusSign && cents > 0 ? '+' : '';
  const absCents = Math.abs(Math.round(cents));
  const whole = Math.floor(absCents / 100);
  const fraction = String(absCents % 100).padStart(2, '0');
  const formattedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return `${sign}${formattedWhole},${fraction}\u00A0€`;
}

/**
 * Convenient alias for formatEurCents.
 */
export const formatEur = formatEurCents;

/**
 * Formats a normalized unit price in Slovak convention (e.g. "5,98 € / kg").
 */
export function formatUnitPriceCents(
  unitPriceCents: number | null | undefined,
  baseUnit: BaseUnit | string
): string {
  if (unitPriceCents === null || unitPriceCents === undefined || !Number.isFinite(unitPriceCents)) {
    return 'Jednotková cena nedostupná';
  }
  return `${formatEurCents(unitPriceCents)} / ${baseUnit}`;
}

export interface ParsedPackageSpec {
  rawText: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'ks';
  multipackCount: number;
  normalizedQuantity: number;
  normalizedUnit: BaseUnit;
}

/**
 * Parses Slovak/European package strings such as:
 * - "500 g balenie" -> 500 g -> 0.5 kg
 * - "12 x 100 g = 1200 g" -> 1200 g -> 1.2 kg
 * - "4x100g" -> 400 g -> 0.4 kg
 * - "2x1,239 L" -> 2.478 l -> 2.478 l
 * - "0,33 l" -> 0.33 l
 * - "10 ks" -> 10 ks
 * - "cena za 1 kg" -> 1 kg
 */
export function parsePackageSpecification(rawInput: string | null | undefined): ParsedPackageSpec | null {
  if (!rawInput || typeof rawInput !== 'string') return null;
  const text = rawInput.trim();
  if (!text) return null;

  // 1. Check multipack pattern like "12 x 100 g", "4x100g", "2x1,239 L"
  const multipackMatch = text.match(
    /(\d+)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(kg|g|dg|ml|cl|dl|l|ks|kus|kusov|bal)\b/i
  );
  if (multipackMatch) {
    const count = parseInt(multipackMatch[1], 10);
    const singleQty = parseFloat(multipackMatch[2].replace(',', '.'));
    const rawUnit = multipackMatch[3].toLowerCase();
    const totalRaw = count * singleQty;
    const norm = normalizeQuantityAndUnit(totalRaw, rawUnit);
    if (norm) {
      return {
        rawText: text,
        quantity: norm.standardInputQuantity,
        unit: norm.standardInputUnit,
        multipackCount: count,
        normalizedQuantity: norm.normalizedQuantity,
        normalizedUnit: norm.normalizedUnit,
      };
    }
  }

  // 2. Check parenthesized net weight e.g. "125G(115G)" -> prefer drained/net weight or primary weight
  const singleMatch = text.match(
    /(?:cena\s+za\s+|ca\.?\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|dg|ml|cl|dl|l|ks|kus|kusov|bal)\b/i
  );
  if (singleMatch) {
    const qty = parseFloat(singleMatch[1].replace(',', '.'));
    const rawUnit = singleMatch[2].toLowerCase();
    const norm = normalizeQuantityAndUnit(qty, rawUnit);
    if (norm) {
      return {
        rawText: text,
        quantity: norm.standardInputQuantity,
        unit: norm.standardInputUnit,
        multipackCount: 1,
        normalizedQuantity: norm.normalizedQuantity,
        normalizedUnit: norm.normalizedUnit,
      };
    }
  }

  return null;
}

/**
 * Normalizes a quantity and unit to standard base units:
 * - g, dg, kg -> kg
 * - ml, cl, dl, l -> l
 * - ks, kus, bal -> ks
 */
export function normalizeQuantityAndUnit(
  quantity: number,
  rawUnit: string
): {
  standardInputQuantity: number;
  standardInputUnit: 'g' | 'kg' | 'ml' | 'l' | 'ks';
  normalizedQuantity: number;
  normalizedUnit: BaseUnit;
} | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  const u = rawUnit.trim().toLowerCase();

  switch (u) {
    case 'g':
    case 'gr':
      return {
        standardInputQuantity: quantity,
        standardInputUnit: 'g',
        normalizedQuantity: Number((quantity / 1000).toFixed(6)),
        normalizedUnit: 'kg',
      };
    case 'dg':
    case 'dkg':
      return {
        standardInputQuantity: quantity * 10,
        standardInputUnit: 'g',
        normalizedQuantity: Number(((quantity * 10) / 1000).toFixed(6)),
        normalizedUnit: 'kg',
      };
    case 'kg':
      return {
        standardInputQuantity: quantity,
        standardInputUnit: 'kg',
        normalizedQuantity: Number(quantity.toFixed(6)),
        normalizedUnit: 'kg',
      };
    case 'ml':
      return {
        standardInputQuantity: quantity,
        standardInputUnit: 'ml',
        normalizedQuantity: Number((quantity / 1000).toFixed(6)),
        normalizedUnit: 'l',
      };
    case 'cl':
      return {
        standardInputQuantity: quantity * 10,
        standardInputUnit: 'ml',
        normalizedQuantity: Number(((quantity * 10) / 1000).toFixed(6)),
        normalizedUnit: 'l',
      };
    case 'dl':
      return {
        standardInputQuantity: quantity * 100,
        standardInputUnit: 'ml',
        normalizedQuantity: Number(((quantity * 100) / 1000).toFixed(6)),
        normalizedUnit: 'l',
      };
    case 'l':
      return {
        standardInputQuantity: quantity,
        standardInputUnit: 'l',
        normalizedQuantity: Number(quantity.toFixed(6)),
        normalizedUnit: 'l',
      };
    case 'ks':
    case 'kus':
    case 'kusy':
    case 'kusov':
    case 'bal':
      return {
        standardInputQuantity: quantity,
        standardInputUnit: 'ks',
        normalizedQuantity: Number(quantity.toFixed(6)),
        normalizedUnit: 'ks',
      };
    default:
      return null;
  }
}

/**
 * Calculates unit price in cents per normalized unit (kg, l, or ks).
 * Example: 299 cents for 500 g -> 299 / 0.5 = 598 cents / kg (5,98 € / kg).
 */
export function calculateUnitPriceCents(
  priceCents: number | null | undefined,
  packageQuantity: number,
  packageUnit: string
): { unitPriceCents: number; baseUnit: BaseUnit } | null {
  if (priceCents === null || priceCents === undefined || !Number.isFinite(priceCents) || priceCents <= 0) {
    return null;
  }
  const normalized = normalizeQuantityAndUnit(packageQuantity, packageUnit);
  if (!normalized || normalized.normalizedQuantity <= 0) {
    return null;
  }
  const unitPriceCents = Math.round(priceCents / normalized.normalizedQuantity);
  return {
    unitPriceCents,
    baseUnit: normalized.normalizedUnit,
  };
}

/**
 * Parses Lidl's basePrice text (e.g., "1 kg = 5,98" or "100 g = 0,61" or "1 l = 3,61")
 * and normalizes it to cents per kg or l.
 */
export function parseRetailerBasePriceText(
  text: string | null | undefined
): { unitPriceCents: number; baseUnit: BaseUnit } | null {
  if (!text) return null;
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|ks)\s*=\s*(\d+[.,]\d{2})/i);
  if (!m) return null;
  const refQty = parseFloat(m[1].replace(',', '.'));
  const refUnit = m[2].toLowerCase();
  const refPriceCents = eurosToCents(m[3]);
  if (!refPriceCents) return null;
  return calculateUnitPriceCents(refPriceCents, refQty, refUnit);
}

/**
 * Strictly calculates a verified discount ONLY when both the reference (regular) price
 * and promotional/loyalty price are present, positive, and promotional < regular.
 */
export function calculateVerifiedDiscount(
  regularPriceCents: number | null | undefined,
  discountedPriceCents: number | null | undefined
): {
  absoluteSavingsCents: number;
  discountPercentage: number;
} | null {
  if (
    regularPriceCents === null ||
    regularPriceCents === undefined ||
    discountedPriceCents === null ||
    discountedPriceCents === undefined
  ) {
    return null;
  }
  if (
    !Number.isFinite(regularPriceCents) ||
    !Number.isFinite(discountedPriceCents) ||
    regularPriceCents <= 0 ||
    discountedPriceCents <= 0 ||
    discountedPriceCents >= regularPriceCents
  ) {
    return null;
  }
  const absoluteSavingsCents = regularPriceCents - discountedPriceCents;
  const discountPercentage = Math.round((absoluteSavingsCents / regularPriceCents) * 100);
  return {
    absoluteSavingsCents,
    discountPercentage,
  };
}

/**
 * Determines whether a promotion window is expired relative to a reference timestamp.
 */
export function isPromotionExpired(
  validToIso: string | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!validToIso) return false;
  const endMs = Date.parse(validToIso);
  if (Number.isNaN(endMs)) return false;
  return referenceDate.getTime() > endMs;
}

/**
 * Checks whether a retailer's loyalty program is enabled in user preferences.
 */
export function isLoyaltyCardEnabledForRetailer(
  retailerSlug: RetailerSlug,
  prefs: LoyaltyPreferences
): boolean {
  switch (retailerSlug) {
    case 'lidl':
      return prefs.includeLidlPlus;
    case 'tesco':
      return prefs.includeTescoClubcard;
    case 'billa':
      return prefs.includeBillaBonus;
  }
}

/**
 * Computes the effective verified price for a retailer listing given:
 * - Current reference timestamp (to exclude expired promotions)
 * - User loyalty-card preferences (Lidl Plus, Clubcard, BILLA Bonus)
 * - Canonical product package quantity/unit (to detect package-size differences)
 */
export function evaluateListingOffer(
  listing: RetailerProductListing,
  loyaltyPrefs: LoyaltyPreferences,
  canonicalProduct?: { packageQuantity: number; packageUnit: string },
  referenceDate: Date = new Date(),
  dataSourceName: string = 'Overený zdroj'
): EffectiveOfferEvaluation {
  const obs = listing.latestObservation;
  const normListing = normalizeQuantityAndUnit(listing.packageQuantity, listing.packageUnit);
  const normCanonical = canonicalProduct
    ? normalizeQuantityAndUnit(canonicalProduct.packageQuantity, canonicalProduct.packageUnit)
    : null;

  const hasPackageSizeMismatch = Boolean(
    normListing &&
      normCanonical &&
      (normListing.normalizedUnit !== normCanonical.normalizedUnit ||
        Math.abs(normListing.normalizedQuantity - normCanonical.normalizedQuantity) > 0.0005)
  );

  if (!obs) {
    return {
      retailerSlug: listing.retailerSlug,
      retailerName: listing.retailerName,
      listingId: listing.id,
      isPriceAvailable: false,
      effectivePriceCents: null,
      regularPriceCents: null,
      promoPriceCents: null,
      loyaltyPriceCents: null,
      effectiveUnitPriceCents: null,
      baseUnit: normListing?.normalizedUnit ?? 'kg',
      priceType: 'UNAVAILABLE',
      loyaltyProgramName: null,
      verifiedDiscountPercent: null,
      absoluteSavingsCents: null,
      isPromotionExpired: false,
      validTo: null,
      observedAt: null,
      sourceUrl: listing.sourceUrl,
      dataSourceName,
      availabilityStatus: 'UNAVAILABLE',
      packageQuantity: listing.packageQuantity,
      packageUnit: listing.packageUnit,
      hasPackageSizeMismatch,
    };
  }

  const expired = isPromotionExpired(obs.validTo, referenceDate);
  const loyaltyAllowed = isLoyaltyCardEnabledForRetailer(listing.retailerSlug, loyaltyPrefs);

  const regularPriceCents = obs.regularPriceCents;
  const activePromoCents = !expired ? obs.promoPriceCents : null;
  const activeLoyaltyCents = !expired ? obs.loyaltyPriceCents : null;

  let effectivePriceCents: number | null = null;
  let priceType: 'REGULAR' | 'PROMO' | 'LOYALTY' | 'UNAVAILABLE' = 'UNAVAILABLE';

  // Candidate prices available to the user
  if (loyaltyAllowed && activeLoyaltyCents !== null && activeLoyaltyCents > 0) {
    // Compare with activePromoCents or regularPriceCents if lower
    effectivePriceCents = activeLoyaltyCents;
    priceType = 'LOYALTY';
  }
  if (activePromoCents !== null && activePromoCents > 0) {
    if (effectivePriceCents === null || activePromoCents <= effectivePriceCents) {
      effectivePriceCents = activePromoCents;
      priceType = 'PROMO';
    }
  }
  if (effectivePriceCents === null && regularPriceCents !== null && regularPriceCents > 0) {
    effectivePriceCents = regularPriceCents;
    priceType = 'REGULAR';
  }

  if (effectivePriceCents === null) {
    return {
      retailerSlug: listing.retailerSlug,
      retailerName: listing.retailerName,
      listingId: listing.id,
      isPriceAvailable: false,
      effectivePriceCents: null,
      regularPriceCents,
      promoPriceCents: activePromoCents,
      loyaltyPriceCents: activeLoyaltyCents,
      effectiveUnitPriceCents: null,
      baseUnit: obs.baseUnit,
      priceType: 'UNAVAILABLE',
      loyaltyProgramName: obs.loyaltyProgramName,
      verifiedDiscountPercent: null,
      absoluteSavingsCents: null,
      isPromotionExpired: expired,
      validTo: obs.validTo,
      observedAt: obs.observedAt,
      sourceUrl: obs.sourceUrl || listing.sourceUrl,
      dataSourceName,
      availabilityStatus: listing.availabilityStatus,
      packageQuantity: listing.packageQuantity,
      packageUnit: listing.packageUnit,
      hasPackageSizeMismatch,
    };
  }

  const unitCalc = calculateUnitPriceCents(
    effectivePriceCents,
    listing.packageQuantity,
    listing.packageUnit
  );
  const effectiveUnitPriceCents =
    unitCalc?.unitPriceCents ??
    (priceType === 'LOYALTY' && obs.loyaltyUnitPriceCents
      ? obs.loyaltyUnitPriceCents
      : obs.unitPriceCents);

  const verifiedDiscount =
    priceType === 'PROMO' || priceType === 'LOYALTY'
      ? calculateVerifiedDiscount(regularPriceCents, effectivePriceCents)
      : null;

  return {
    retailerSlug: listing.retailerSlug,
    retailerName: listing.retailerName,
    listingId: listing.id,
    isPriceAvailable: true,
    effectivePriceCents,
    regularPriceCents,
    promoPriceCents: activePromoCents,
    loyaltyPriceCents: activeLoyaltyCents,
    effectiveUnitPriceCents,
    baseUnit: unitCalc?.baseUnit ?? obs.baseUnit,
    priceType,
    loyaltyProgramName: priceType === 'LOYALTY' ? obs.loyaltyProgramName : null,
    verifiedDiscountPercent: verifiedDiscount?.discountPercentage ?? null,
    absoluteSavingsCents: verifiedDiscount?.absoluteSavingsCents ?? null,
    isPromotionExpired: expired,
    validTo: obs.validTo,
    observedAt: obs.observedAt,
    sourceUrl: obs.sourceUrl || listing.sourceUrl,
    dataSourceName,
    availabilityStatus: listing.availabilityStatus,
    packageQuantity: listing.packageQuantity,
    packageUnit: listing.packageUnit,
    hasPackageSizeMismatch,
  };
}
