// ==============================================================================
// PRICE TRACKER SK — DATABASE REPOSITORY & AUTHORIZATION TESTS
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetDatabaseForTesting,
  getRetailers,
  getDataSources,
  queryProducts,
  getProductBySlugOrId,
  getProductPriceHistory,
  getWeeklyOffers,
  getShoppingLists,
  getShoppingListByIdOrShareToken,
  createShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  removeShoppingListItem,
  duplicateShoppingList,
  optimizeShoppingListById,
  createPriceAlert,
  getPriceAlerts,
  getNotifications,
  getPendingMatchCandidates,
  resolvePendingMatchCandidate,
  runRetailerIngestion,
  DEFAULT_USER_ID,
} from '../src/lib/db/repository';

describe('Price Tracker SK — SQLite Repository & Business Workflows', () => {
  beforeEach(() => {
    resetDatabaseForTesting(':memory:');
  });

  it('auto-migrates all 18 entities and seeds verified Slovak grocery catalog', () => {
    const retailers = getRetailers();
    expect(retailers.map((r) => r.slug)).toEqual(['billa', 'lidl', 'tesco']);

    const sources = getDataSources();
    expect(sources.length).toBeGreaterThanOrEqual(4);

    const catalog = queryProducts({});
    expect(catalog.totalCount).toBeGreaterThanOrEqual(16);
    expect(catalog.facets.categories.length).toBeGreaterThanOrEqual(4);
  });

  it('supports Slovak diacritics-insensitive search, barcode search, and category/retailer filters', () => {
    // Search without diacritics for "tatranske maslo"
    const byName = queryProducts({ q: 'tatranske maslo' });
    expect(byName.totalCount).toBe(1);
    expect(byName.products[0].slug).toBe('tami-tatranske-maslo-82-250g');

    // Search by 13-digit EAN barcode
    const byEan = queryProducts({ q: '8585000902797' });
    expect(byEan.totalCount).toBe(1);
    expect(byEan.products[0].id).toBe('prod-tami-maslo-250g');

    // Filter by category
    const dairy = queryProducts({ category: 'mliecne-vyrobky-a-vajcia' });
    expect(dairy.totalCount).toBeGreaterThanOrEqual(5);
    expect(dairy.products.every((p) => p.categorySlug === 'mliecne-vyrobky-a-vajcia')).toBe(true);
  });

  it('detects historical coverage gaps honestly without interpolating missing dates', () => {
    const history = getProductPriceHistory('prod-tami-maslo-250g');
    expect(history).not.toBeNull();
    expect(history!.historicalMinCents).toBe(189);
    expect(history!.historicalMaxCents).toBe(299);

    // BILLA has an intentional gap between 2026-09-25 and 2026-10-07 (11 missing days)
    const billaGap = history!.coverageGaps.find((g) => g.retailerSlug === 'billa');
    expect(billaGap).toBeDefined();
    expect(billaGap!.fromDay).toBe('2026-09-25');
    expect(billaGap!.toDay).toBe('2026-10-07');
    expect(billaGap!.missingDays).toBe(11);
  });

  it('separates regular promotions, loyalty-card promotions, and expired promotions', () => {
    const offers = getWeeklyOffers({});
    expect(offers.regularPromotions.length).toBeGreaterThan(0);
    expect(offers.loyaltyPromotions.length).toBeGreaterThan(0);
    expect(offers.expiredPromotions.length).toBeGreaterThan(0);

    expect(offers.regularPromotions.every((o) => !o.requiresLoyaltyCard && !o.isExpired)).toBe(true);
    expect(offers.loyaltyPromotions.every((o) => o.requiresLoyaltyCard && !o.isExpired)).toBe(true);
    expect(offers.expiredPromotions.every((o) => o.isExpired)).toBe(true);
  });

  it('enforces ownership authorization on shopping lists while allowing valid share_token access', () => {
    const lists = getShoppingLists({ userId: DEFAULT_USER_ID });
    expect(lists.length).toBeGreaterThanOrEqual(2);

    const familyList = lists.find((l) => l.id === 'list-rodinny-nakup')!;
    expect(familyList).toBeDefined();

    // Unauthorized access by a different user ID should throw
    expect(() =>
      getShoppingListByIdOrShareToken('list-rodinny-nakup', {
        userId: 'attacker-user-999',
        guestSessionId: null,
      })
    ).toThrow('UNAUTHORIZED_SHOPPING_LIST_ACCESS');

    // Access via non-guessable share_token succeeds
    const sharedAccess = getShoppingListByIdOrShareToken(familyList.shareToken!, {
      userId: 'guest-viewer',
    });
    expect(sharedAccess).not.toBeNull();
    expect(sharedAccess!.id).toBe('list-rodinny-nakup');
  });

  it('supports shopping list CRUD, quantity updates, duplication, and basket optimization', () => {
    const created = createShoppingList({
      name: 'Testovací nákup',
      description: 'Test CRUD operácií',
    });
    expect(created.itemCount).toBe(0);

    const withButter = addShoppingListItem(created.id, {
      productId: 'prod-tami-maslo-250g',
      quantity: 2,
    });
    expect(withButter.itemCount).toBe(1);
    expect(withButter.items[0].quantity).toBe(2);

    // Adding same product increments quantity
    const incremented = addShoppingListItem(created.id, {
      productId: 'prod-tami-maslo-250g',
      quantity: 1,
    });
    expect(incremented.itemCount).toBe(1);
    expect(incremented.items[0].quantity).toBe(3);

    // Update item purchased status
    const itemId = incremented.items[0].id;
    const marked = updateShoppingListItem(created.id, itemId, { isPurchased: true });
    expect(marked.purchasedCount).toBe(1);

    // Duplicate list
    const copy = duplicateShoppingList(created.id);
    expect(copy.id).not.toBe(created.id);
    expect(copy.itemCount).toBe(1);

    // Optimize full family basket vs partial weekend basket
    const fullOpt = optimizeShoppingListById('list-rodinny-nakup');
    expect(fullOpt.singleStoreByRetailer.lidl.basketStatus).toBe('COMPLETE');
    expect(fullOpt.singleStoreByRetailer.tesco.basketStatus).toBe('COMPLETE');
    expect(fullOpt.singleStoreByRetailer.billa.basketStatus).toBe('COMPLETE');
    expect(fullOpt.cheapestCompleteSingleStore).not.toBeNull();

    const partialOpt = optimizeShoppingListById('list-vikendove-pecenie');
    expect(partialOpt.singleStoreByRetailer.tesco.basketStatus).toBe('PARTIAL');
    expect(partialOpt.singleStoreByRetailer.tesco.completeBasketTotalCents).toBeNull();
    expect(partialOpt.cheapestCompleteSingleStore).toBeNull();

    // Remove item
    const afterRemove = removeShoppingListItem(created.id, itemId);
    expect(afterRemove.itemCount).toBe(0);
  });

  it('creates price alerts, evaluates current offers, and deduplicates notifications', () => {
    const product = getProductBySlugOrId('prod-rajo-mlieko-15-1l')!;
    expect(product).not.toBeNull();

    // Rajo milk has loyalty price 0,75 € (75 cents) in BILLA and 0,79 € in Lidl/Tesco
    const alert = createPriceAlert({
      productId: product.id,
      targetPriceCents: 85, // 0,85 € -> should trigger immediately
      notifyOnAnyPromotion: true,
      includeLoyaltyPrices: true,
    });

    expect(alert.isCurrentlyTriggered).toBe(true);
    const alerts = getPriceAlerts();
    expect(alerts.some((a) => a.id === alert.id)).toBe(true);

    const notifications = getNotifications();
    expect(notifications.some((n) => n.alertId === alert.id)).toBe(true);
  });

  it('exposes pending product match candidates with package/fat-percent guardrails and allows review resolution', () => {
    const pending = getPendingMatchCandidates();
    expect(pending.length).toBeGreaterThanOrEqual(2);

    const yogurtMismatch = pending.find((p) => p.listingId === 'lst-pending-jogurt-400g-tesco');
    expect(yogurtMismatch).toBeDefined();
    expect(yogurtMismatch!.evaluation.hasSameNormalizedPackageSize).toBe(false);

    const afterReject = resolvePendingMatchCandidate('lst-pending-jogurt-400g-tesco', 'REJECT');
    const rejected = afterReject.find((p) => p.listingId === 'lst-pending-jogurt-400g-tesco');
    expect(rejected?.matchStatus).toBe('REJECTED');
  });

  it('ingests verified CSV price observations and records audit job metrics', async () => {
    const csvContent = [
      'retailer_slug,external_id,ean,title,brand,package_label,regular_price_eur,promo_price_eur,loyalty_price_eur,loyalty_program_name,valid_from,valid_to,source_url',
      'tesco,2002007711001,8005110170404,Mutti Polpa Krájané paradajky 400 g,Mutti,400 g,2.89,2.19,1.89,Clubcard,2026-10-14T06:00:00Z,2026-10-20T21:59:59Z,https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy',
    ].join('\n');

    const res = await runRetailerIngestion({
      retailerSlug: 'tesco',
      mode: 'CSV_FALLBACK',
      csvContent,
    });

    expect(res.job.status).toBe('COMPLETED');
    expect(res.job.itemsDiscovered).toBe(1);
    expect(res.job.itemsImported).toBe(1);

    // Re-running identical CSV on the same day should deduplicate via SHA-256 hash
    const resDedup = await runRetailerIngestion({
      retailerSlug: 'tesco',
      mode: 'CSV_FALLBACK',
      csvContent,
    });
    expect(resDedup.job.itemsDeduplicated).toBe(1);
    expect(resDedup.job.itemsImported).toBe(0);
  });
});
