// ==============================================================================
// PRICE TRACKER SK — WORKFLOWS & DOMAIN EDGE CASES TEST SUITE
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetDatabaseForTesting,
  getAllProducts,
  getProductBySlugOrId,
  queryProducts,
  getShoppingLists,
  createShoppingList,
  addShoppingListItem,
  updateShoppingListItem,
  removeShoppingListItem,
  optimizeShoppingListById,
  createPriceAlert,
  getPriceAlerts,
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  getPendingMatchCandidates,
  resolvePendingMatchCandidate,
  getUserPreferences,
  updateUserPreferences,
  DEFAULT_USER_ID,
} from '../src/lib/db/repository';
import { formatEur, eurosToCents, centsToEuros } from '../src/lib/domain/money';

describe('Price Tracker SK — End-to-End Workflows & Edge Cases', () => {
  beforeEach(() => {
    resetDatabaseForTesting(':memory:');
  });

  describe('Money & Decimal-Safe EUR Calculations', () => {
    it('converts decimal and string EUR representations safely into integer cents', () => {
      expect(eurosToCents(1.99)).toBe(199);
      expect(eurosToCents('1,99')).toBe(199);
      expect(eurosToCents(' 2,49 € ')).toBe(249);
      expect(eurosToCents('0.00')).toBeNull();
      expect(eurosToCents(-5)).toBeNull();
      expect(eurosToCents(null)).toBeNull();
      expect(eurosToCents(undefined)).toBeNull();
    });

    it('formats integer cents according to Slovak currency convention with non-breaking space', () => {
      expect(formatEur(199)).toBe('1,99\u00A0€');
      expect(formatEur(1050)).toBe('10,50\u00A0€');
      expect(formatEur(125000)).toBe('1\u00A0250,00\u00A0€');
      expect(formatEur(null)).toBe('Cena nedostupná');
      expect(formatEur(undefined)).toBe('Cena nedostupná');
    });

    it('converts integer cents back to EUR decimals accurately', () => {
      expect(centsToEuros(199)).toBe(1.99);
      expect(centsToEuros(249)).toBe(2.49);
      expect(centsToEuros(null)).toBeNull();
    });
  });

  describe('Shopping Basket Optimizer Edge Cases', () => {
    it('evaluates complete basket total when 100% of items are priced in a store', () => {
      // 'list-rodinny-nakup' has 100% verified prices across all 3 stores
      const result = optimizeShoppingListById('list-rodinny-nakup', {
        loyalty: { includeLidlPlus: true, includeTescoClubcard: true, includeBillaBonus: true },
        maxStoresAllowed: 2,
        tripCostPerExtraStoreCents: 150,
      });

      expect(result).toBeDefined();
      expect(result.cheapestCompleteSingleStore).not.toBeNull();
      expect(result.cheapestCompleteSingleStore?.totalCents).toBeGreaterThan(0);
      expect(result.cheapestCompleteSingleStore?.savingsVsMostExpensiveCompleteCents).toBeGreaterThan(0);

      const lidlEval = result.singleStoreByRetailer.lidl;
      const tescoEval = result.singleStoreByRetailer.tesco;
      const billaEval = result.singleStoreByRetailer.billa;

      expect(lidlEval.basketStatus).toBe('COMPLETE');
      expect(tescoEval.basketStatus).toBe('COMPLETE');
      expect(billaEval.basketStatus).toBe('COMPLETE');

      expect(lidlEval.completeBasketTotalCents).not.toBeNull();
      expect(tescoEval.completeBasketTotalCents).not.toBeNull();
      expect(billaEval.completeBasketTotalCents).not.toBeNull();
    });

    it('identifies partial subtotal and marks completeBasketTotalCents as null when items are missing', () => {
      // 'list-vikendove-pecenie' includes uncataloged items and unpriced items
      const result = optimizeShoppingListById('list-vikendove-pecenie', {
        loyalty: { includeLidlPlus: true, includeTescoClubcard: true, includeBillaBonus: true },
        maxStoresAllowed: 2,
        tripCostPerExtraStoreCents: 150,
      });

      expect(result.cheapestCompleteSingleStore).toBeNull(); // No single store has 100% coverage
      expect(result.bestPartialSingleStore).not.toBeNull();

      // At least one store has missing items
      const hasMissingItems = (['lidl', 'tesco', 'billa'] as const).some(
        (slug) => result.singleStoreByRetailer[slug].missingPriceItemsCount > 0
      );
      expect(hasMissingItems).toBe(true);

      // Verify that missing items are properly categorized
      for (const slug of ['lidl', 'tesco', 'billa'] as const) {
        const storeEval = result.singleStoreByRetailer[slug];
        if (storeEval.missingPriceItemsCount > 0) {
          expect(storeEval.completeBasketTotalCents).toBeNull();
          expect(storeEval.knownSubtotalCents).toBeGreaterThan(0);
          expect(storeEval.missingItems.length).toBe(storeEval.missingPriceItemsCount);
        }
      }
    });

    it('computes comparable common subset strictly on products verified in all three stores', () => {
      const result = optimizeShoppingListById('list-vikendove-pecenie');
      expect(result.comparableCommonSubset).toBeDefined();
      expect(result.comparableCommonSubset.commonItemCount).toBeGreaterThan(0);

      // Common subset totals should be non-null for all 3 stores
      expect(result.comparableCommonSubset.totalsByRetailerCents.lidl).not.toBeNull();
      expect(result.comparableCommonSubset.totalsByRetailerCents.tesco).not.toBeNull();
      expect(result.comparableCommonSubset.totalsByRetailerCents.billa).not.toBeNull();
      expect(result.comparableCommonSubset.cheapestRetailerOnCommonSubset).toBeDefined();
    });

    it('evaluates multi-store trip penalty and determines if split shopping is worthwhile', () => {
      // Test with 0 trip cost: multi-store should always be mathematically optimal or equal
      const freeTripOpt = optimizeShoppingListById('list-rodinny-nakup', {
        maxStoresAllowed: 3,
        tripCostPerExtraStoreCents: 0,
      });
      expect(freeTripOpt.multiStoreStrategy.totalTripPenaltyCents).toBe(0);
      expect(freeTripOpt.multiStoreStrategy.isMultiStoreWorthwhileAfterTripCost).toBe(true);

      // Test with high trip cost (e.g. 5,00 € per extra trip): multi-store split penalty outweighs minor item savings
      const expensiveTripOpt = optimizeShoppingListById('list-rodinny-nakup', {
        maxStoresAllowed: 2,
        tripCostPerExtraStoreCents: 500,
      });
      if (expensiveTripOpt.multiStoreStrategy.storesUsedCount > 1) {
        expect(expensiveTripOpt.multiStoreStrategy.totalTripPenaltyCents).toBe(500);
      }
    });
  });

  describe('Price Alerts & Notification Engine', () => {
    it('creates price alert, detects current best price, and fires in-app notification when triggered', () => {
      const all = getAllProducts();
      const butter = all.find((p) => p.slug.includes('maslo'))!;
      expect(butter).toBeDefined();

      // Create alert with target price higher than current minimum (should trigger immediately)
      const alert = createPriceAlert(
        {
          productId: butter.id,
          targetPriceCents: 250, // 2,50 € target while current price is ~1,79 € - 1,89 €
          notifyOnAnyPromotion: true,
          includeLoyaltyPrices: true,
          retailerFilter: null,
        },
        DEFAULT_USER_ID
      );

      expect(alert.id).toBeDefined();
      expect(alert.isCurrentlyTriggered).toBe(true);

      const alerts = getPriceAlerts(DEFAULT_USER_ID);
      expect(alerts.some((a) => a.id === alert.id)).toBe(true);

      // Check notification generation
      const notifications = getNotifications(DEFAULT_USER_ID);
      expect(notifications.length).toBeGreaterThan(0);

      const alertNotification = notifications.find((n) => n.alertId === alert.id);
      expect(alertNotification).toBeDefined();
      expect(alertNotification?.isRead).toBe(false);

      // Mark notification as read
      markNotificationAsRead(alertNotification!.id, DEFAULT_USER_ID);
      const updatedNotifs = getNotifications(DEFAULT_USER_ID);
      const readNotif = updatedNotifs.find((n) => n.id === alertNotification!.id);
      expect(readNotif?.isRead).toBe(true);

      // Delete notification
      deleteNotification(alertNotification!.id, DEFAULT_USER_ID);
      const afterDelete = getNotifications(DEFAULT_USER_ID);
      expect(afterDelete.some((n) => n.id === alertNotification!.id)).toBe(false);
    });
  });

  describe('User Preferences & Session Persistence', () => {
    it('reads and updates user preferences correctly', () => {
      const initial = getUserPreferences(DEFAULT_USER_ID);
      expect(initial.userId).toBe(DEFAULT_USER_ID);
      expect(initial.language).toBe('sk');

      const updated = updateUserPreferences(
        {
          language: 'en',
          theme: 'dark',
          reducedMotion: true,
          includeLidlPlus: false,
          includeTescoClubcard: true,
          includeBillaBonus: true,
          defaultMaxStores: 3,
          defaultTripCostCents: 250,
        },
        DEFAULT_USER_ID
      );

      expect(updated.language).toBe('en');
      expect(updated.theme).toBe('dark');
      expect(updated.reducedMotion).toBe(true);
      expect(updated.includeLidlPlus).toBe(false);
      expect(updated.defaultMaxStores).toBe(3);
      expect(updated.defaultTripCostCents).toBe(250);

      // Read again to verify persistence in SQLite
      const reRead = getUserPreferences(DEFAULT_USER_ID);
      expect(reRead.language).toBe('en');
      expect(reRead.theme).toBe('dark');
    });
  });

  describe('Product Match Review Queue', () => {
    it('holds ambiguous package discrepancies in PENDING_REVIEW and allows APPROVE or REJECT resolution', () => {
      const pending = getPendingMatchCandidates();
      expect(pending.length).toBeGreaterThan(0);

      const candidate = pending[0];
      expect(candidate.matchStatus).toBe('PENDING_REVIEW');
      expect(candidate.evaluation.hasSameNormalizedPackageSize).toBe(false);
      expect(candidate.evaluation.reasons.length).toBeGreaterThan(0);

      // Test APPROVE resolution
      const afterApprove = resolvePendingMatchCandidate(candidate.listingId, 'APPROVE');
      expect(afterApprove.some((c) => c.listingId === candidate.listingId)).toBe(false);
    });
  });
});
