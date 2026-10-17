// ==============================================================================
// PRICE TRACKER SK — SMART SHOPPING BASKET OPTIMIZER ENGINE
// ==============================================================================

import { evaluateListingOffer, isLoyaltyCardEnabledForRetailer } from './money';
import type {
  BasketOptimizationResult,
  LoyaltyPreferences,
  MultiStoreAllocation,
  MultiStoreBasketStrategy,
  RetailerSlug,
  ShoppingListItemInput,
  SingleStoreBasketEvaluation,
  StoreBasketLineItem,
} from './types';

const RETAILERS: Array<{ slug: RetailerSlug; name: string; loyaltyProgramName: string }> = [
  { slug: 'lidl', name: 'Lidl Slovakia', loyaltyProgramName: 'Lidl Plus' },
  { slug: 'tesco', name: 'Tesco Slovakia', loyaltyProgramName: 'Clubcard' },
  { slug: 'billa', name: 'BILLA Slovakia', loyaltyProgramName: 'BILLA Bonus' },
];

export interface BasketOptimizationOptions {
  loyaltyPreferences: LoyaltyPreferences;
  maxStores?: number; // 1, 2, or 3 (default 2)
  tripCostPerExtraStoreCents?: number; // e.g. 150 cents = 1,50 € per additional store trip
  excludePurchasedItems?: boolean;
  referenceDate?: Date;
}

/**
 * Calculates single-store and multi-store shopping basket totals, partial subtotals,
 * missing-price items, loyalty-card savings, and trip-cost-adjusted multi-store splits.
 *
 * CRITICAL INTEGRITY RULES:
 * 1. Never treats missing/unverified prices as 0,00 € or claims a complete basket total when any item is missing.
 * 2. Clearly distinguishes completeBasketTotalCents (only non-null when 100% of items are priced at that store)
 *    from knownSubtotalCents (partial subtotal of verified items).
 * 3. Evaluates comparableCommonSubset across stores for items priced everywhere.
 */
export function optimizeShoppingBasket(
  rawItems: ShoppingListItemInput[],
  options: BasketOptimizationOptions
): BasketOptimizationResult {
  const referenceDate = options.referenceDate ?? new Date();
  const maxStores = Math.min(3, Math.max(1, options.maxStores ?? 2));
  const tripCostCents = Math.max(0, Math.round(options.tripCostPerExtraStoreCents ?? 150));

  const activeItems = options.excludePurchasedItems
    ? rawItems.filter((item) => !item.isPurchased && item.quantity > 0)
    : rawItems.filter((item) => item.quantity > 0);

  const totalRequestedItems = activeItems.length;

  // Evaluate each retailer's single-store basket
  const singleStoreByRetailer = {} as Record<RetailerSlug, SingleStoreBasketEvaluation>;

  // Map: itemId -> retailerSlug -> evaluated line item (when priced)
  const itemPriceMatrix = new Map<string, Partial<Record<RetailerSlug, StoreBasketLineItem>>>();

  for (const r of RETAILERS) {
    const pricedLineItems: StoreBasketLineItem[] = [];
    const missingItems: SingleStoreBasketEvaluation['missingItems'] = [];
    let knownSubtotalCents = 0;
    let regularSubtotalCents = 0;
    let totalSavingsCents = 0;
    let loyaltyCardSavingsCents = 0;

    for (const item of activeItems) {
      const qty = Math.max(1, Math.round(item.quantity));
      const itemTitle = item.product?.canonicalName ?? item.customTitle ?? 'Neznáma položka';

      if (!item.productId || !item.product) {
        missingItems.push({
          itemId: item.id,
          productId: null,
          title: itemTitle,
          quantity: qty,
          reason: 'UNCATALOGED_CUSTOM_ITEM',
        });
        continue;
      }

      const listing = item.product.listings.find(
        (l) => l.retailerSlug === r.slug && l.matchStatus !== 'REJECTED'
      );

      if (!listing) {
        missingItems.push({
          itemId: item.id,
          productId: item.productId,
          title: itemTitle,
          quantity: qty,
          reason: 'NO_RETAILER_LISTING',
        });
        continue;
      }

      const evalWithLoyalty = evaluateListingOffer(
        listing,
        options.loyaltyPreferences,
        {
          packageQuantity: item.product.packageQuantity,
          packageUnit: item.product.packageUnit,
        },
        referenceDate
      );

      const evalWithoutLoyalty = evaluateListingOffer(
        listing,
        { includeLidlPlus: false, includeTescoClubcard: false, includeBillaBonus: false },
        {
          packageQuantity: item.product.packageQuantity,
          packageUnit: item.product.packageUnit,
        },
        referenceDate
      );

      if (!evalWithLoyalty.isPriceAvailable || evalWithLoyalty.effectivePriceCents === null) {
        missingItems.push({
          itemId: item.id,
          productId: item.productId,
          title: itemTitle,
          quantity: qty,
          reason: 'PRICE_UNAVAILABLE',
        });
        continue;
      }

      const unitPriceCents = evalWithLoyalty.effectivePriceCents;
      const regularUnitCents =
        evalWithLoyalty.regularPriceCents ?? evalWithoutLoyalty.effectivePriceCents ?? unitPriceCents;

      const lineTotalCents = unitPriceCents * qty;
      const lineRegularTotalCents = Math.max(lineTotalCents, regularUnitCents * qty);
      const lineSavingsCents = Math.max(0, lineRegularTotalCents - lineTotalCents);

      const nonLoyaltyUnitCents = evalWithoutLoyalty.effectivePriceCents ?? regularUnitCents;
      const itemLoyaltySaving =
        evalWithLoyalty.priceType === 'LOYALTY' && nonLoyaltyUnitCents > unitPriceCents
          ? (nonLoyaltyUnitCents - unitPriceCents) * qty
          : 0;

      const lineItem: StoreBasketLineItem = {
        itemId: item.id,
        productId: item.productId,
        title: itemTitle,
        quantity: qty,
        packageLabel: listing.packageLabel,
        unitPriceCents,
        regularUnitPriceCents: regularUnitCents,
        lineTotalCents,
        lineRegularTotalCents,
        lineSavingsCents,
        priceType: evalWithLoyalty.priceType,
        loyaltyProgramName: evalWithLoyalty.loyaltyProgramName,
        sourceUrl: evalWithLoyalty.sourceUrl,
        observedAt: evalWithLoyalty.observedAt,
      };

      pricedLineItems.push(lineItem);
      knownSubtotalCents += lineTotalCents;
      regularSubtotalCents += lineRegularTotalCents;
      totalSavingsCents += lineSavingsCents;
      loyaltyCardSavingsCents += itemLoyaltySaving;

      if (!itemPriceMatrix.has(item.id)) {
        itemPriceMatrix.set(item.id, {});
      }
      itemPriceMatrix.get(item.id)![r.slug] = lineItem;
    }

    const verifiedPricedItems = pricedLineItems.length;
    const missingPriceItemsCount = missingItems.length;

    let basketStatus: SingleStoreBasketEvaluation['basketStatus'] = 'UNAVAILABLE';
    if (totalRequestedItems > 0 && verifiedPricedItems === totalRequestedItems) {
      basketStatus = 'COMPLETE';
    } else if (verifiedPricedItems > 0) {
      basketStatus = 'PARTIAL';
    }

    const coveragePercentage =
      totalRequestedItems > 0 ? Math.round((verifiedPricedItems / totalRequestedItems) * 100) : 0;

    singleStoreByRetailer[r.slug] = {
      retailerSlug: r.slug,
      retailerName: r.name,
      loyaltyProgramName: isLoyaltyCardEnabledForRetailer(r.slug, options.loyaltyPreferences)
        ? r.loyaltyProgramName
        : null,
      basketStatus,
      totalRequestedItems,
      verifiedPricedItems,
      missingPriceItemsCount,
      coveragePercentage,
      knownSubtotalCents,
      completeBasketTotalCents: basketStatus === 'COMPLETE' ? knownSubtotalCents : null,
      regularSubtotalCents,
      totalSavingsCents,
      loyaltyCardSavingsCents,
      pricedLineItems,
      missingItems,
    };
  }

  // 2. Determine cheapest COMPLETE single-store basket (only among stores with 100% verified items)
  const completeStores = Object.values(singleStoreByRetailer).filter(
    (s) => s.basketStatus === 'COMPLETE' && s.completeBasketTotalCents !== null
  );

  let cheapestCompleteSingleStore: BasketOptimizationResult['cheapestCompleteSingleStore'] = null;
  if (completeStores.length > 0) {
    completeStores.sort((a, b) => a.completeBasketTotalCents! - b.completeBasketTotalCents!);
    const cheapest = completeStores[0];
    const mostExpensive = completeStores[completeStores.length - 1];
    const savingsVsMostExpensive =
      mostExpensive.completeBasketTotalCents! - cheapest.completeBasketTotalCents!;
    const savingsPct =
      mostExpensive.completeBasketTotalCents! > 0
        ? Math.round((savingsVsMostExpensive / mostExpensive.completeBasketTotalCents!) * 100)
        : 0;

    cheapestCompleteSingleStore = {
      retailerSlug: cheapest.retailerSlug,
      retailerName: cheapest.retailerName,
      totalCents: cheapest.completeBasketTotalCents!,
      savingsVsMostExpensiveCompleteCents: savingsVsMostExpensive,
      savingsPercentage: savingsPct,
    };
  }

  // 3. Determine best partial single-store (highest coverage, then lowest subtotal)
  const pricedStores = Object.values(singleStoreByRetailer).filter((s) => s.verifiedPricedItems > 0);
  let bestPartialSingleStore: BasketOptimizationResult['bestPartialSingleStore'] = null;
  if (pricedStores.length > 0) {
    pricedStores.sort((a, b) => {
      if (b.verifiedPricedItems !== a.verifiedPricedItems) {
        return b.verifiedPricedItems - a.verifiedPricedItems;
      }
      return a.knownSubtotalCents - b.knownSubtotalCents;
    });
    const best = pricedStores[0];
    bestPartialSingleStore = {
      retailerSlug: best.retailerSlug,
      retailerName: best.retailerName,
      verifiedPricedItems: best.verifiedPricedItems,
      totalRequestedItems: best.totalRequestedItems,
      knownSubtotalCents: best.knownSubtotalCents,
    };
  }

  // 4. Calculate comparable common subset (items priced at ALL 3 stores)
  const commonItemIds = activeItems
    .filter((item) => {
      const m = itemPriceMatrix.get(item.id);
      return Boolean(m?.lidl && m?.tesco && m?.billa);
    })
    .map((i) => i.id);

  const totalsByRetailerCents: Record<RetailerSlug, number | null> = {
    lidl: null,
    tesco: null,
    billa: null,
  };
  let cheapestRetailerOnCommonSubset: RetailerSlug | null = null;
  let maxSavingsOnCommonSubsetCents = 0;

  if (commonItemIds.length > 0) {
    for (const r of RETAILERS) {
      totalsByRetailerCents[r.slug] = commonItemIds.reduce(
        (sum, id) => sum + (itemPriceMatrix.get(id)?.[r.slug]?.lineTotalCents ?? 0),
        0
      );
    }
    const entries = RETAILERS.map((r) => ({
      slug: r.slug,
      total: totalsByRetailerCents[r.slug]!,
    })).sort((a, b) => a.total - b.total);
    cheapestRetailerOnCommonSubset = entries[0].slug;
    maxSavingsOnCommonSubsetCents = entries[entries.length - 1].total - entries[0].total;
  }

  // 5. Multi-store optimization (evaluating all non-empty store subsets of size <= maxStores)
  const allSubsets = getRetailerSubsets(maxStores);
  let bestCandidate: {
    subset: RetailerSlug[];
    coveredCount: number;
    grossTotalCents: number;
    tripPenaltyCents: number;
    netTotalCents: number;
    allocations: Map<RetailerSlug, StoreBasketLineItem[]>;
    unpricedItems: MultiStoreBasketStrategy['unpricedItems'];
  } | null = null;

  for (const subset of allSubsets) {
    const allocations = new Map<RetailerSlug, StoreBasketLineItem[]>();
    const unpricedItems: MultiStoreBasketStrategy['unpricedItems'] = [];
    let grossTotalCents = 0;
    let coveredCount = 0;

    for (const item of activeItems) {
      const row = itemPriceMatrix.get(item.id);
      let bestStoreForItem: RetailerSlug | null = null;
      let bestLineItem: StoreBasketLineItem | null = null;

      for (const storeSlug of subset) {
        const candidateLine = row?.[storeSlug];
        if (!candidateLine || candidateLine.lineTotalCents === null) continue;
        if (
          bestLineItem === null ||
          candidateLine.lineTotalCents < bestLineItem.lineTotalCents!
        ) {
          bestStoreForItem = storeSlug;
          bestLineItem = candidateLine;
        }
      }

      if (bestStoreForItem && bestLineItem) {
        coveredCount++;
        grossTotalCents += bestLineItem.lineTotalCents!;
        if (!allocations.has(bestStoreForItem)) {
          allocations.set(bestStoreForItem, []);
        }
        allocations.get(bestStoreForItem)!.push(bestLineItem);
      } else {
        unpricedItems.push({
          itemId: item.id,
          productId: item.productId,
          title: item.product?.canonicalName ?? item.customTitle ?? 'Neznáma položka',
          quantity: item.quantity,
        });
      }
    }

    const activeStoresInSubset = [...allocations.keys()];
    const storesUsedCount = activeStoresInSubset.length;
    const tripPenaltyCents = storesUsedCount > 1 ? (storesUsedCount - 1) * tripCostCents : 0;
    const netTotalCents = grossTotalCents + tripPenaltyCents;

    if (
      bestCandidate === null ||
      coveredCount > bestCandidate.coveredCount ||
      (coveredCount === bestCandidate.coveredCount && netTotalCents < bestCandidate.netTotalCents) ||
      (coveredCount === bestCandidate.coveredCount &&
        netTotalCents === bestCandidate.netTotalCents &&
        storesUsedCount < bestCandidate.allocations.size)
    ) {
      bestCandidate = {
        subset: activeStoresInSubset,
        coveredCount,
        grossTotalCents,
        tripPenaltyCents,
        netTotalCents,
        allocations,
        unpricedItems,
      };
    }
  }

  const finalAllocations: MultiStoreAllocation[] = [];
  if (bestCandidate) {
    for (const r of RETAILERS) {
      const assigned = bestCandidate.allocations.get(r.slug);
      if (assigned && assigned.length > 0) {
        finalAllocations.push({
          retailerSlug: r.slug,
          retailerName: r.name,
          assignedItems: assigned,
          storeSubtotalCents: assigned.reduce((s, i) => s + (i.lineTotalCents ?? 0), 0),
          storeSavingsCents: assigned.reduce((s, i) => s + i.lineSavingsCents, 0),
        });
      }
    }
  }

  // Compare multi-store against the best single-store with equal coverage
  const singleStoresWithSameCoverage = Object.values(singleStoreByRetailer)
    .filter((s) => s.verifiedPricedItems === (bestCandidate?.coveredCount ?? 0) && s.verifiedPricedItems > 0)
    .sort((a, b) => a.knownSubtotalCents - b.knownSubtotalCents);

  const bestComparableSingle = singleStoresWithSameCoverage[0] ?? null;

  const savingsGross =
    bestComparableSingle && bestCandidate
      ? Math.max(0, bestComparableSingle.knownSubtotalCents - bestCandidate.grossTotalCents)
      : null;

  const savingsNet =
    bestComparableSingle && bestCandidate
      ? bestComparableSingle.knownSubtotalCents - bestCandidate.netTotalCents
      : null;

  const explanationNotes: string[] = [
    'Matematicky najlacnejšia kombinácia obchodov nezohľadňuje individuálnu vzdialenosť predajní, dopravné náklady nad rámec nastaveného poplatku za presun ani okamžitú skladovú dostupnosť v konkrétnej prevádzke.',
  ];

  if (bestCandidate && bestCandidate.unpricedItems.length > 0) {
    explanationNotes.push(
      `Upozornenie: ${bestCandidate.unpricedItems.length} položiek v zozname nemá overenú cenu v vybraných obchodoch, preto je výsledná suma čiastočným medzisúčtom.`
    );
  }

  const multiStoreStrategy: MultiStoreBasketStrategy = {
    maxStoresAllowed: maxStores,
    storesUsedCount: finalAllocations.length,
    tripCostPerExtraStoreCents: tripCostCents,
    totalTripPenaltyCents: bestCandidate?.tripPenaltyCents ?? 0,
    itemsGrossTotalCents: bestCandidate?.grossTotalCents ?? 0,
    netEffectiveTotalCents: bestCandidate?.netTotalCents ?? 0,
    verifiedPricedItems: bestCandidate?.coveredCount ?? 0,
    totalRequestedItems,
    isCompleteCoverage:
      totalRequestedItems > 0 && (bestCandidate?.coveredCount ?? 0) === totalRequestedItems,
    allocations: finalAllocations,
    unpricedItems: bestCandidate?.unpricedItems ?? [],
    savingsVsBestSingleStoreGrossCents: savingsGross,
    savingsVsBestSingleStoreNetCents: savingsNet,
    isMultiStoreWorthwhileAfterTripCost:
      finalAllocations.length > 1 && savingsNet !== null && savingsNet > 0,
    explanationNotes,
  };

  return {
    evaluatedAt: referenceDate.toISOString(),
    loyaltyPreferences: options.loyaltyPreferences,
    singleStoreByRetailer,
    cheapestCompleteSingleStore,
    bestPartialSingleStore,
    comparableCommonSubset: {
      commonItemCount: commonItemIds.length,
      totalsByRetailerCents,
      cheapestRetailerOnCommonSubset,
      maxSavingsOnCommonSubsetCents,
    },
    multiStoreStrategy,
  };
}

function getRetailerSubsets(maxStores: number): RetailerSlug[][] {
  const slugs: RetailerSlug[] = ['lidl', 'tesco', 'billa'];
  const subsets: RetailerSlug[][] = [];

  // Size 1
  for (const s of slugs) {
    subsets.push([s]);
  }
  // Size 2
  if (maxStores >= 2) {
    subsets.push(['lidl', 'tesco'], ['lidl', 'billa'], ['tesco', 'billa']);
  }
  // Size 3
  if (maxStores >= 3) {
    subsets.push(['lidl', 'tesco', 'billa']);
  }
  return subsets;
}
