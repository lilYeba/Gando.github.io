// ==============================================================================
// PRICE TRACKER SK — PRICE ALERT THRESHOLD & NOTIFICATION DEDUPLICATION ENGINE
// ==============================================================================

import crypto from 'node:crypto';
import { evaluateListingOffer, formatEurCents } from './money';
import type { LoyaltyPreferences, RetailerProductListing, RetailerSlug } from './types';

export interface PriceAlertRule {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  targetPriceCents: number;
  notifyOnAnyPromotion: boolean;
  includeLoyaltyPrices: boolean;
  retailerFilter: RetailerSlug | null;
  isActive: boolean;
}

export interface TriggeredNotificationCandidate {
  alertId: string;
  userId: string;
  productId: string;
  retailerId: string;
  retailerSlug: RetailerSlug;
  title: string;
  message: string;
  observedPriceCents: number;
  deduplicationKey: string;
}

/**
 * Evaluates a user's price alert rule against a product's retailer listings.
 * Generates a deterministic deduplicationKey so the same price observation
 * never triggers duplicate notifications.
 */
export function evaluatePriceAlertAgainstListings(
  rule: PriceAlertRule,
  listings: RetailerProductListing[],
  existingDeduplicationKeys: Set<string>,
  referenceDate: Date = new Date()
): TriggeredNotificationCandidate[] {
  if (!rule.isActive || rule.targetPriceCents <= 0) {
    return [];
  }

  const loyaltyPrefs: LoyaltyPreferences = {
    includeLidlPlus: rule.includeLoyaltyPrices,
    includeTescoClubcard: rule.includeLoyaltyPrices,
    includeBillaBonus: rule.includeLoyaltyPrices,
  };

  const candidates: TriggeredNotificationCandidate[] = [];

  for (const listing of listings) {
    if (rule.retailerFilter && listing.retailerSlug !== rule.retailerFilter) {
      continue;
    }

    const evalOffer = evaluateListingOffer(listing, loyaltyPrefs, undefined, referenceDate);
    if (!evalOffer.isPriceAvailable || evalOffer.effectivePriceCents === null) {
      continue;
    }

    const priceHit = evalOffer.effectivePriceCents <= rule.targetPriceCents;
    const promoHit =
      rule.notifyOnAnyPromotion &&
      (evalOffer.priceType === 'PROMO' || evalOffer.priceType === 'LOYALTY');

    if (!priceHit && !promoHit) {
      continue;
    }

    const obsId = listing.latestObservation?.id ?? evalOffer.observedAt ?? 'latest';
    const deduplicationKey = crypto
      .createHash('sha256')
      .update(`${rule.id}|${listing.id}|${obsId}|${evalOffer.effectivePriceCents}`)
      .digest('hex');

    if (existingDeduplicationKeys.has(deduplicationKey)) {
      continue;
    }

    const loyaltyNote =
      evalOffer.priceType === 'LOYALTY' && evalOffer.loyaltyProgramName
        ? ` (s kartou ${evalOffer.loyaltyProgramName})`
        : '';

    const title = priceHit
      ? `Cena klesla na ${formatEurCents(evalOffer.effectivePriceCents)} v ${listing.retailerName}`
      : `Nová akcia: ${rule.productName} v ${listing.retailerName}`;

    const message = priceHit
      ? `Produkt ${rule.productName} je teraz dostupný v ${listing.retailerName} za overenú cenu ${formatEurCents(
          evalOffer.effectivePriceCents
        )}${loyaltyNote}, čo je pod vaším limitom ${formatEurCents(rule.targetPriceCents)}.`
      : `Produkt ${rule.productName} je v akcii v ${listing.retailerName} za ${formatEurCents(
          evalOffer.effectivePriceCents
        )}${loyaltyNote}.`;

    candidates.push({
      alertId: rule.id,
      userId: rule.userId,
      productId: rule.productId,
      retailerId: listing.retailerId,
      retailerSlug: listing.retailerSlug,
      title,
      message,
      observedPriceCents: evalOffer.effectivePriceCents,
      deduplicationKey,
    });
  }

  return candidates;
}
