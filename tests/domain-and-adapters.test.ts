// ==============================================================================
// PRICE TRACKER SK — COMPREHENSIVE DOMAIN & ADAPTER TEST SUITE
// (Uses realistic Slovak grocery test fixtures clearly labeled as TEST_FIXTURE)
// ==============================================================================

import { describe, expect, it } from 'vitest';
import {
  calculateUnitPriceCents,
  calculateVerifiedDiscount,
  centsToEuros,
  eurosToCents,
  evaluateListingOffer,
  formatEurCents,
  isPromotionExpired,
  normalizeQuantityAndUnit,
  parsePackageSpecification,
  parseRetailerBasePriceText,
} from '../src/lib/domain/money';
import {
  computeObservationDeduplicationHash,
  evaluateProductMatch,
  isStandardGtinBarcode,
} from '../src/lib/domain/matching';
import { optimizeShoppingBasket } from '../src/lib/domain/basket-optimizer';
import { evaluatePriceAlertAgainstListings } from '../src/lib/domain/alerts';
import { parseLidlSkHtmlToOffers } from '../src/lib/adapters/lidl-sk';
import { parseBillaSkHtmlToOffers } from '../src/lib/adapters/billa-sk';
import { parseVerifiedPriceCsv } from '../src/lib/adapters/tesco-sk';
import type { ProductWithOffers, RetailerProductListing } from '../src/lib/domain/types';

describe('1. Price Normalization & Formatting (money.ts)', () => {
  it('converts EUR strings and numbers to exact integer cents without floating-point drift', () => {
    expect(eurosToCents(1.99)).toBe(199);
    expect(eurosToCents('1,99 €')).toBe(199);
    expect(eurosToCents('11,90')).toBe(1190);
    expect(eurosToCents(0.29)).toBe(29);
    expect(eurosToCents(null)).toBeNull();
    expect(eurosToCents(0)).toBeNull();
    expect(eurosToCents(-2.5)).toBeNull();
    expect(eurosToCents('Nedostupné')).toBeNull();
    expect(centsToEuros(199)).toBe(1.99);
  });

  it('never formats missing prices as 0,00 €', () => {
    expect(formatEurCents(null)).toBe('Cena nedostupná');
    expect(formatEurCents(undefined)).toBe('Cena nedostupná');
    expect(formatEurCents(249)).toBe('2,49\u00A0€');
  });
});

describe('2. Unit-Price Calculations & Package Normalization', () => {
  it('normalizes grams, milliliters, and multipacks into standard kg/l/ks units', () => {
    const pkg500g = parsePackageSpecification('500 g balenie');
    expect(pkg500g?.normalizedQuantity).toBe(0.5);
    expect(pkg500g?.normalizedUnit).toBe('kg');

    const multipack = parsePackageSpecification('12 x 100 g = 1200 g');
    expect(multipack?.quantity).toBe(1200);
    expect(multipack?.normalizedQuantity).toBe(1.2);
    expect(multipack?.normalizedUnit).toBe('kg');

    const liquidPack = parsePackageSpecification('2x1,239 L');
    expect(liquidPack?.normalizedQuantity).toBeCloseTo(2.478, 3);
    expect(liquidPack?.normalizedUnit).toBe('l');
  });

  it('computes accurate unit prices per kg and per l', () => {
    // 2.99 EUR for 500 g Mleté mäso -> 5.98 EUR / kg (598 cents)
    const unit = calculateUnitPriceCents(299, 500, 'g');
    expect(unit).toEqual({ unitPriceCents: 598, baseUnit: 'kg' });

    // 1.99 EUR for 190 g Bánovecký pološtiepok -> 10.47 EUR / kg (1047 cents)
    const cheeseUnit = calculateUnitPriceCents(199, 190, 'g');
    expect(cheeseUnit).toEqual({ unitPriceCents: 1047, baseUnit: 'kg' });

    // Lidl basePrice text "100 g = 0,61" -> 6.10 EUR / kg (610 cents)
    const lidlBase = parseRetailerBasePriceText('100 g = 0,61');
    expect(lidlBase).toEqual({ unitPriceCents: 610, baseUnit: 'kg' });
  });
});

describe('3. Discount Calculations & Promotion Expiration', () => {
  it('calculates discounts only when both reference and promotional prices are valid and promo < regular', () => {
    expect(calculateVerifiedDiscount(359, 299)).toEqual({
      absoluteSavingsCents: 60,
      discountPercentage: 17,
    });
    expect(calculateVerifiedDiscount(null, 299)).toBeNull();
    expect(calculateVerifiedDiscount(299, null)).toBeNull();
    expect(calculateVerifiedDiscount(299, 299)).toBeNull();
    expect(calculateVerifiedDiscount(250, 299)).toBeNull();
  });

  it('correctly detects expired promotions and falls back to regular price', () => {
    const refNow = new Date('2026-10-16T12:00:00Z');
    expect(isPromotionExpired('2026-10-10T23:59:59Z', refNow)).toBe(true);
    expect(isPromotionExpired('2026-10-20T23:59:59Z', refNow)).toBe(false);

    const expiredListing: RetailerProductListing = {
      id: 'test-listing-expired',
      retailerId: 'ret-lidl',
      retailerSlug: 'lidl',
      retailerName: 'Lidl Slovakia',
      productId: 'prod-butter',
      externalId: 'TEST-100',
      externalSku: 'TEST-100',
      externalBarcode: null,
      retailerTitle: 'TEST_FIXTURE Maslo 82% 250 g',
      retailerBrand: 'Pilos',
      packageLabel: '250 g',
      packageQuantity: 250,
      packageUnit: 'g',
      sourceUrl: 'https://www.lidl.sk/p/test',
      imageUrl: null,
      matchType: 'EXACT_MATCH',
      matchConfidence: 1.0,
      matchStatus: 'VERIFIED',
      availabilityStatus: 'VERIFIED_IN_STOCK',
      lastVerifiedAt: '2026-10-09T10:00:00Z',
      activePromotion: null,
      latestObservation: {
        id: 'obs-exp-1',
        listingId: 'test-listing-expired',
        dataSourceId: 'ds-lidl',
        importJobId: null,
        currency: 'EUR',
        regularPriceCents: 279,
        promoPriceCents: 189,
        loyaltyPriceCents: 169,
        effectivePriceCents: 169,
        unitPriceCents: 676,
        loyaltyUnitPriceCents: 676,
        baseUnit: 'kg',
        lowest30DayPriceCents: 189,
        isPromotional: true,
        requiresLoyaltyCard: true,
        loyaltyProgramName: 'Lidl Plus',
        discountPercentage: 39,
        observedAt: '2026-10-05T10:00:00Z',
        observationDay: '2026-10-05',
        validFrom: '2026-10-05T00:00:00Z',
        validTo: '2026-10-11T23:59:59Z', // Expired before 2026-10-16!
        sourceUrl: 'https://www.lidl.sk/p/test',
        deduplicationHash: 'hash-1',
      },
    };

    const evaluated = evaluateListingOffer(
      expiredListing,
      { includeLidlPlus: true, includeTescoClubcard: true, includeBillaBonus: true },
      { packageQuantity: 250, packageUnit: 'g' },
      refNow
    );

    expect(evaluated.isPromotionExpired).toBe(true);
    expect(evaluated.effectivePriceCents).toBe(279); // Reverts to regular price
    expect(evaluated.priceType).toBe('REGULAR');
  });
});

describe('4. Product Matching & Package Size Guardrails (matching.ts)', () => {
  it('matches identical GTIN/EAN-13 barcodes with identical package size as deterministic EXACT_MATCH', () => {
    expect(isStandardGtinBarcode('8595241507071')).toBe(true);
    const match = evaluateProductMatch(
      {
        title: 'Giana guľatozrnná ryža 1 kg',
        brand: 'Giana',
        barcode: '8595241507071',
        packageQuantity: 1000,
        packageUnit: 'g',
      },
      {
        title: 'GIANA RYŽA GUĽATOZRNNÁ 1KG',
        brand: 'Giana',
        barcode: '8595241507071',
        packageQuantity: 1,
        packageUnit: 'kg',
      }
    );
    expect(match.matchType).toBe('EXACT_MATCH');
    expect(match.confidence).toBe(1.0);
    expect(match.matchStatus).toBe('VERIFIED');
  });

  it('NEVER treats a 400 g package as identical (EXACT_MATCH or EQUIVALENT_PRODUCT) to a 500 g package', () => {
    const match = evaluateProductMatch(
      {
        title: 'Biely smotanový jogurt 400 g',
        brand: 'Pilos',
        packageQuantity: 400,
        packageUnit: 'g',
      },
      {
        title: 'Biely smotanový jogurt 500 g',
        brand: 'Clever',
        packageQuantity: 500,
        packageUnit: 'g',
      }
    );
    expect(match.hasSameNormalizedPackageSize).toBe(false);
    expect(match.matchType).toBe('SIMILAR_PRODUCT');
    expect(match.matchType).not.toBe('EXACT_MATCH');
    expect(match.matchType).not.toBe('EQUIVALENT_PRODUCT');
    expect(match.matchStatus).toBe('PENDING_REVIEW');
  });

  it('never merges products with different fat percentages (1,5% vs 3,5% milk)', () => {
    const match = evaluateProductMatch(
      {
        title: 'Trvanlivé mlieko 1,5% 1 l',
        brand: 'Rajo',
        packageQuantity: 1,
        packageUnit: 'l',
      },
      {
        title: 'Trvanlivé mlieko 3,5% 1 l',
        brand: 'Rajo',
        packageQuantity: 1,
        packageUnit: 'l',
      }
    );
    expect(match.matchStatus).toBe('REJECTED');
  });

  it('produces deterministic deduplication hashes for idempotent price imports', () => {
    const h1 = computeObservationDeduplicationHash({
      listingId: 'listing-1',
      observationDay: '2026-10-16',
      regularPriceCents: 299,
      promoPriceCents: 199,
      loyaltyPriceCents: null,
    });
    const h2 = computeObservationDeduplicationHash({
      listingId: 'listing-1',
      observationDay: '2026-10-16',
      regularPriceCents: 299,
      promoPriceCents: 199,
      loyaltyPriceCents: null,
    });
    const h3 = computeObservationDeduplicationHash({
      listingId: 'listing-1',
      observationDay: '2026-10-16',
      regularPriceCents: 299,
      promoPriceCents: 179,
      loyaltyPriceCents: null,
    });
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
  });
});

describe('5. Shopping Basket Optimizer, Missing Prices, Loyalty Toggles & Multi-Store Split', () => {
  function makeMockProduct(
    id: string,
    name: string,
    prices: Partial<
      Record<
        'lidl' | 'tesco' | 'billa',
        { regular: number | null; promo?: number | null; loyalty?: number | null }
      >
    >
  ): ProductWithOffers {
    const listings: RetailerProductListing[] = (['lidl', 'tesco', 'billa'] as const)
      .filter((slug) => slug in prices)
      .map((slug) => {
        const p = prices[slug]!;
        const loyaltyName =
          slug === 'lidl' ? 'Lidl Plus' : slug === 'tesco' ? 'Clubcard' : 'BILLA Bonus';
        return {
          id: `listing-${id}-${slug}`,
          retailerId: `ret-${slug}`,
          retailerSlug: slug,
          retailerName: slug.toUpperCase(),
          productId: id,
          externalId: `ext-${id}-${slug}`,
          externalSku: `sku-${id}-${slug}`,
          externalBarcode: null,
          retailerTitle: `TEST_FIXTURE ${name}`,
          retailerBrand: 'TestBrand',
          packageLabel: '1 kg',
          packageQuantity: 1,
          packageUnit: 'kg',
          sourceUrl: `https://www.${slug}.sk/test`,
          imageUrl: null,
          matchType: 'EXACT_MATCH',
          matchConfidence: 1.0,
          matchStatus: 'VERIFIED',
          availabilityStatus: 'VERIFIED_IN_STOCK',
          lastVerifiedAt: '2026-10-16T10:00:00Z',
          activePromotion: null,
          latestObservation: {
            id: `obs-${id}-${slug}`,
            listingId: `listing-${id}-${slug}`,
            dataSourceId: `ds-${slug}`,
            importJobId: null,
            currency: 'EUR',
            regularPriceCents: p.regular,
            promoPriceCents: p.promo ?? null,
            loyaltyPriceCents: p.loyalty ?? null,
            effectivePriceCents: p.loyalty ?? p.promo ?? p.regular,
            unitPriceCents: p.loyalty ?? p.promo ?? p.regular,
            loyaltyUnitPriceCents: p.loyalty ?? null,
            baseUnit: 'kg',
            lowest30DayPriceCents: null,
            isPromotional: Boolean(p.promo || p.loyalty),
            requiresLoyaltyCard: Boolean(p.loyalty),
            loyaltyProgramName: p.loyalty ? loyaltyName : null,
            discountPercentage: null,
            observedAt: '2026-10-16T10:00:00Z',
            observationDay: '2026-10-16',
            validFrom: '2026-10-14T00:00:00Z',
            validTo: '2026-10-22T23:59:59Z',
            sourceUrl: `https://www.${slug}.sk/test`,
            deduplicationHash: `hash-${id}-${slug}`,
          },
        };
      });

    return {
      id,
      slug: id,
      canonicalName: `TEST_FIXTURE ${name}`,
      brand: 'TestBrand',
      categorySlug: 'mliecne-a-vajcia',
      categoryName: 'Mliečne výrobky a vajcia',
      subcategoryName: null,
      packageQuantity: 1,
      packageUnit: 'kg',
      normalizedQuantity: 1,
      normalizedUnit: 'kg',
      variantDescriptor: null,
      imageUrl: null,
      description: null,
      isEssentialStaple: true,
      identifiers: [],
      variants: [],
      listings,
      historicalMinCents: null,
      historicalMaxCents: null,
      lastUpdatedAt: '2026-10-16T10:00:00Z',
    };
  }

  it('never treats missing prices as 0,00 € and distinguishes COMPLETE vs PARTIAL baskets', () => {
    const p1 = makeMockProduct('p1', 'Maslo 250g', {
      lidl: { regular: 279, promo: 199 },
      billa: { regular: 289, promo: 219 },
      tesco: { regular: 279, loyalty: 189 },
    });
    const p2 = makeMockProduct('p2', 'Mlieko 1l', {
      lidl: { regular: 109 },
      billa: { regular: 119 },
      // Tesco has NO verified price for p2!
      tesco: { regular: null },
    });

    const result = optimizeShoppingBasket(
      [
        { id: 'item-1', productId: 'p1', customTitle: null, quantity: 2, isPurchased: false, product: p1 },
        { id: 'item-2', productId: 'p2', customTitle: null, quantity: 1, isPurchased: false, product: p2 },
      ],
      {
        loyaltyPreferences: {
          includeLidlPlus: true,
          includeTescoClubcard: true,
          includeBillaBonus: true,
        },
        maxStores: 2,
        tripCostPerExtraStoreCents: 150,
        referenceDate: new Date('2026-10-16T12:00:00Z'),
      }
    );

    // Lidl has 2/2 items priced -> COMPLETE (2 * 199 + 1 * 109 = 507 cents)
    expect(result.singleStoreByRetailer.lidl.basketStatus).toBe('COMPLETE');
    expect(result.singleStoreByRetailer.lidl.completeBasketTotalCents).toBe(507);

    // BILLA has 2/2 items priced -> COMPLETE (2 * 219 + 1 * 119 = 557 cents)
    expect(result.singleStoreByRetailer.billa.basketStatus).toBe('COMPLETE');
    expect(result.singleStoreByRetailer.billa.completeBasketTotalCents).toBe(557);

    // Tesco has 1/2 items priced (378 cents) -> PARTIAL! Must NOT have a completeBasketTotalCents!
    expect(result.singleStoreByRetailer.tesco.basketStatus).toBe('PARTIAL');
    expect(result.singleStoreByRetailer.tesco.completeBasketTotalCents).toBeNull();
    expect(result.singleStoreByRetailer.tesco.knownSubtotalCents).toBe(378);
    expect(result.singleStoreByRetailer.tesco.missingItems).toHaveLength(1);

    // Even though Tesco's partial subtotal (378) < Lidl's complete total (507),
    // Lidl MUST win cheapestCompleteSingleStore because Tesco is missing item 2!
    expect(result.cheapestCompleteSingleStore?.retailerSlug).toBe('lidl');
    expect(result.cheapestCompleteSingleStore?.totalCents).toBe(507);
  });

  it('respects loyalty-card toggles and trip-cost penalties in multi-store optimization', () => {
    const p1 = makeMockProduct('p1', 'Káva zrnková 1kg', {
      lidl: { regular: 1499, loyalty: 999 }, // 5.00 EUR cheaper with Lidl Plus
      billa: { regular: 1499 },
      tesco: { regular: 1499 },
    });
    const p2 = makeMockProduct('p2', 'Olivový olej 500ml', {
      lidl: { regular: 899 },
      billa: { regular: 899, loyalty: 499 }, // 4.00 EUR cheaper with BILLA Bonus
      tesco: { regular: 899 },
    });

    // With loyalty cards enabled and trip cost = 150 cents (1,50 €):
    // Single-store Lidl = 999 + 899 = 1898 cents
    // Multi-store (Lidl + BILLA) = 999 + 499 = 1498 gross + 150 trip penalty = 1648 net -> saves 250 cents net!
    const withLoyalty = optimizeShoppingBasket(
      [
        { id: 'i1', productId: 'p1', customTitle: null, quantity: 1, isPurchased: false, product: p1 },
        { id: 'i2', productId: 'p2', customTitle: null, quantity: 1, isPurchased: false, product: p2 },
      ],
      {
        loyaltyPreferences: {
          includeLidlPlus: true,
          includeTescoClubcard: true,
          includeBillaBonus: true,
        },
        maxStores: 2,
        tripCostPerExtraStoreCents: 150,
        referenceDate: new Date('2026-10-16T12:00:00Z'),
      }
    );

    expect(withLoyalty.multiStoreStrategy.storesUsedCount).toBe(2);
    expect(withLoyalty.multiStoreStrategy.itemsGrossTotalCents).toBe(1498);
    expect(withLoyalty.multiStoreStrategy.netEffectiveTotalCents).toBe(1648);
    expect(withLoyalty.multiStoreStrategy.isMultiStoreWorthwhileAfterTripCost).toBe(true);

    // Without loyalty cards, both items cost 1499 + 899 = 2398 everywhere -> 1 store used
    const withoutLoyalty = optimizeShoppingBasket(
      [
        { id: 'i1', productId: 'p1', customTitle: null, quantity: 1, isPurchased: false, product: p1 },
        { id: 'i2', productId: 'p2', customTitle: null, quantity: 1, isPurchased: false, product: p2 },
      ],
      {
        loyaltyPreferences: {
          includeLidlPlus: false,
          includeTescoClubcard: false,
          includeBillaBonus: false,
        },
        maxStores: 2,
        tripCostPerExtraStoreCents: 150,
        referenceDate: new Date('2026-10-16T12:00:00Z'),
      }
    );

    expect(withoutLoyalty.multiStoreStrategy.storesUsedCount).toBe(1);
    expect(withoutLoyalty.multiStoreStrategy.itemsGrossTotalCents).toBe(2398);
  });
});

describe('6. Price Alerts & Notification Deduplication (alerts.ts)', () => {
  it('triggers alerts below threshold and prevents duplicate notifications via deduplicationKey', () => {
    const listing: RetailerProductListing = {
      id: 'l-alert-1',
      retailerId: 'ret-billa',
      retailerSlug: 'billa',
      retailerName: 'BILLA Slovakia',
      productId: 'prod-cheese',
      externalId: '84-219893',
      externalSku: '84-219893',
      externalBarcode: null,
      retailerTitle: 'TEST_FIXTURE Bánovecký pološtiepok 190g',
      retailerBrand: 'Milsy',
      packageLabel: '190 g',
      packageQuantity: 190,
      packageUnit: 'g',
      sourceUrl: 'https://www.billa.sk/produkt/test',
      imageUrl: null,
      matchType: 'EXACT_MATCH',
      matchConfidence: 1.0,
      matchStatus: 'VERIFIED',
      availabilityStatus: 'LEAFLET_OFFER',
      lastVerifiedAt: '2026-10-16T10:00:00Z',
      activePromotion: null,
      latestObservation: {
        id: 'obs-cheese-1',
        listingId: 'l-alert-1',
        dataSourceId: 'ds-billa',
        importJobId: null,
        currency: 'EUR',
        regularPriceCents: 299,
        promoPriceCents: 199,
        loyaltyPriceCents: null,
        effectivePriceCents: 199,
        unitPriceCents: 1047,
        loyaltyUnitPriceCents: null,
        baseUnit: 'kg',
        lowest30DayPriceCents: 199,
        isPromotional: true,
        requiresLoyaltyCard: false,
        loyaltyProgramName: null,
        discountPercentage: 33,
        observedAt: '2026-10-16T10:00:00Z',
        observationDay: '2026-10-16',
        validFrom: '2026-10-14T00:00:00Z',
        validTo: '2026-10-20T23:59:59Z',
        sourceUrl: 'https://www.billa.sk/produkt/test',
        deduplicationHash: 'hash-cheese',
      },
    };

    const existingKeys = new Set<string>();
    const rule = {
      id: 'alert-1',
      userId: 'user-1',
      productId: 'prod-cheese',
      productName: 'Bánovecký pološtiepok 190 g',
      targetPriceCents: 220,
      notifyOnAnyPromotion: true,
      includeLoyaltyPrices: true,
      retailerFilter: null,
      isActive: true,
    };

    const firstRun = evaluatePriceAlertAgainstListings(
      rule,
      [listing],
      existingKeys,
      new Date('2026-10-16T12:00:00Z')
    );
    expect(firstRun).toHaveLength(1);
    expect(firstRun[0].observedPriceCents).toBe(199);

    existingKeys.add(firstRun[0].deduplicationKey);
    const secondRun = evaluatePriceAlertAgainstListings(
      rule,
      [listing],
      existingKeys,
      new Date('2026-10-16T12:05:00Z')
    );
    expect(secondRun).toHaveLength(0); // Deduplicated!
  });
});

describe('7. Retailer Adapters Parsing & Validation', () => {
  it('parses Lidl Slovakia SSR data-grid-data JSON attributes accurately', () => {
    const sampleLidlHtml = `
      <div data-grid-data="{&quot;productId&quot;:11141712,&quot;erpNumber&quot;:&quot;11141712&quot;,&quot;fullTitle&quot;:&quot;Mleté mäso MIX&quot;,&quot;canonicalUrl&quot;:&quot;/p/mlete-maso-mix/p11141712&quot;,&quot;price&quot;:{&quot;price&quot;:2.99,&quot;oldPrice&quot;:3.59,&quot;packaging&quot;:{&quot;text&quot;:&quot;500 g balenie&quot;},&quot;basePrice&quot;:{&quot;text&quot;:&quot;1 kg = 5,98&quot;}},&quot;storeStartDate&quot;:1792015200,&quot;storeEndDate&quot;:1792360799}"></div>
    `;
    const res = parseLidlSkHtmlToOffers(sampleLidlHtml);
    expect(res.errors).toHaveLength(0);
    expect(res.offers).toHaveLength(1);
    expect(res.offers[0].externalId).toBe('11141712');
    expect(res.offers[0].regularPriceCents).toBe(359);
    expect(res.offers[0].promoPriceCents).toBe(299);
    expect(res.offers[0].unitPriceCents).toBe(598);
    expect(res.offers[0].packageQuantity).toBe(500);
    expect(res.offers[0].packageUnit).toBe('g');
  });

  it('parses BILLA Slovakia SSR __NUXT_DATA__ Commercetools payload accurately', () => {
    const mockNuxtArray = [
      {
        productId: 1,
        sku: 2,
        slug: 3,
        name: 4,
        amount: 5,
        volumeLabelShort: 6,
        price: 7,
      },
      'uuid-123',
      '84-219893',
      'banovecky-poloostiepok-neudeny-190g-84219893',
      'Bánovecký pološtiepok neúdený 190g',
      '190',
      'g',
      {
        crossed: 8,
        lowestPrice: 9,
        regular: 10,
      },
      299,
      199,
      {
        value: 9,
        perStandardizedQuantity: 11,
        tags: 12,
      },
      1047,
      ['SO'],
    ];
    const html = `<html><body><script id="__NUXT_DATA__" type="application/json">${JSON.stringify(
      mockNuxtArray
    )}</script></body></html>`;
    const res = parseBillaSkHtmlToOffers(html);
    expect(res.errors).toHaveLength(0);
    expect(res.offers).toHaveLength(1);
    expect(res.offers[0].externalId).toBe('84-219893');
    expect(res.offers[0].regularPriceCents).toBe(299);
    expect(res.offers[0].promoPriceCents).toBe(199);
    expect(res.offers[0].unitPriceCents).toBe(1047);
    expect(res.offers[0].lowest30DayPriceCents).toBe(199);
  });

  it('parses verified leaflet CSV rows and reports malformed rows honestly', () => {
    const csv = [
      'retailer_slug,external_id,ean,title,brand,package_label,regular_price_eur,promo_price_eur,loyalty_price_eur,loyalty_program_name,valid_from,valid_to,source_url',
      'tesco,2002017142931,8595241507071,Giana guľatozrnná ryža 1 kg,Giana,1 kg,2.29,1.79,1.49,Clubcard,2026-10-14T06:00:00Z,2026-10-20T21:59:59Z,https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy',
      'invalid_store,123,,Bad Row,Brand,1 kg,1.00,,,,,,',
    ].join('\n');

    const res = parseVerifiedPriceCsv(csv);
    expect(res.offers).toHaveLength(1);
    expect(res.errors).toHaveLength(1);
    expect(res.offers[0].barcode).toBe('8595241507071');
    expect(res.offers[0].regularPriceCents).toBe(229);
    expect(res.offers[0].promoPriceCents).toBe(179);
    expect(res.offers[0].loyaltyPriceCents).toBe(149);
    expect(res.offers[0].loyaltyProgramName).toBe('Clubcard');
  });
});
