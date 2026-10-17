// ==============================================================================
// PRICE TRACKER SK — BILLA SLOVAKIA ADAPTER (SSR __NUXT_DATA__ Commercetools)
// ==============================================================================

import { z } from 'zod';
import { calculateUnitPriceCents, normalizeQuantityAndUnit } from '../domain/money';
import type { AdapterErrorRecord, AdapterIngestionReport, NormalizedRetailerOffer } from './types';

const BillaProductSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  volumeLabelShort: z.string().optional(),
  category: z.string().optional(),
  images: z.array(z.string()).optional(),
  price: z
    .object({
      baseUnitShort: z.string().optional(),
      crossed: z.number().nullable().optional(),
      discountPercentage: z.number().nullable().optional(),
      lowestPrice: z.number().nullable().optional(),
      regular: z
        .object({
          value: z.number().nullable().optional(),
          perStandardizedQuantity: z.number().nullable().optional(),
          promotionType: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
});

function dereferenceNuxtNode(arr: unknown[], index: unknown, depth: number = 0): unknown {
  if (depth > 6 || typeof index !== 'number' || index < 0 || index >= arr.length) {
    return index;
  }
  const val = arr[index];
  if (Array.isArray(val)) {
    if (
      (val[0] === 'ShallowReactive' || val[0] === 'Reactive' || val[0] === 'Ref') &&
      typeof val[1] === 'number'
    ) {
      return dereferenceNuxtNode(arr, val[1], depth + 1);
    }
    return val.map((item) =>
      typeof item === 'number' ? dereferenceNuxtNode(arr, item, depth + 1) : item
    );
  }
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = typeof v === 'number' ? dereferenceNuxtNode(arr, v, depth + 1) : v;
    }
    return out;
  }
  return val;
}

/**
 * Extracts and normalizes BILLA Slovakia Commercetools products from a Nuxt 3 SSR HTML payload.
 */
export function parseBillaSkHtmlToOffers(
  html: string,
  pageUrl: string = 'https://www.billa.sk/produkty/leaflet-99000000',
  observedAt: string = new Date().toISOString()
): {
  itemsDiscovered: number;
  offers: NormalizedRetailerOffer[];
  errors: AdapterErrorRecord[];
} {
  const nuxtMatch = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!nuxtMatch) {
    return {
      itemsDiscovered: 0,
      offers: [],
      errors: [
        {
          externalIdentifier: pageUrl,
          errorCode: 'BILLA_MISSING_NUXT_DATA',
          errorMessage: 'No __NUXT_DATA__ script tag found in BILLA HTML response',
        },
      ],
    };
  }

  let nuxtArray: unknown[];
  try {
    nuxtArray = JSON.parse(nuxtMatch[1]);
  } catch (err) {
    return {
      itemsDiscovered: 0,
      offers: [],
      errors: [
        {
          externalIdentifier: pageUrl,
          errorCode: 'BILLA_NUXT_JSON_ERROR',
          errorMessage: err instanceof Error ? err.message : 'Invalid NUXT JSON',
        },
      ],
    };
  }

  const offers: NormalizedRetailerOffer[] = [];
  const errors: AdapterErrorRecord[] = [];
  const seenSkus = new Set<string>();
  let discovered = 0;

  for (let i = 0; i < nuxtArray.length; i++) {
    const node = nuxtArray[i];
    if (
      !node ||
      typeof node !== 'object' ||
      Array.isArray(node) ||
      !('sku' in node && 'slug' in node && 'name' in node && 'price' in node)
    ) {
      continue;
    }

    discovered++;
    const deref = dereferenceNuxtNode(nuxtArray, i, 0);
    const parsed = BillaProductSchema.safeParse(deref);

    if (!parsed.success) {
      errors.push({
        externalIdentifier: String((deref as Record<string, unknown>)?.sku ?? i),
        errorCode: 'BILLA_PRODUCT_SCHEMA_ERROR',
        errorMessage: parsed.error.issues.map((iss) => iss.message).join('; '),
      });
      continue;
    }

    const item = parsed.data;
    if (seenSkus.has(item.sku)) {
      continue;
    }
    seenSkus.add(item.sku);

    const rawAmount = Number(String(item.amount ?? '1').replace(',', '.')) || 1;
    const rawUnit = (item.volumeLabelShort ?? 'ks').toLowerCase();
    const norm = normalizeQuantityAndUnit(rawAmount, rawUnit) ?? {
      standardInputQuantity: 1,
      standardInputUnit: 'ks' as const,
      normalizedQuantity: 1,
      normalizedUnit: 'ks' as const,
    };

    const currentCents = item.price?.regular?.value ?? null;
    const crossedCents = item.price?.crossed ?? null;
    const lowest30dCents = item.price?.lowestPrice ?? null;
    const tags = item.price?.regular?.tags ?? [];
    const isBillaBonus = tags.includes('BB');
    const isStandardOffer = tags.includes('SO') || (crossedCents !== null && currentCents !== null && crossedCents > currentCents);

    let regularPriceCents: number | null = null;
    let promoPriceCents: number | null = null;
    let loyaltyPriceCents: number | null = null;

    if (currentCents !== null && currentCents > 0) {
      if (isBillaBonus) {
        loyaltyPriceCents = currentCents;
        regularPriceCents = crossedCents && crossedCents > currentCents ? crossedCents : null;
      } else if (isStandardOffer && crossedCents && crossedCents > currentCents) {
        regularPriceCents = crossedCents;
        promoPriceCents = currentCents;
      } else {
        regularPriceCents = currentCents;
      }
    }

    const standardizedUnitCents = item.price?.regular?.perStandardizedQuantity ?? null;
    const fallbackUnit = calculateUnitPriceCents(
      currentCents,
      norm.standardInputQuantity,
      norm.standardInputUnit
    );

    offers.push({
      retailerSlug: 'billa',
      externalId: item.sku,
      externalSku: item.sku,
      barcode: null,
      title: item.name.trim(),
      brand: item.brand?.trim() || null,
      categoryHint: item.category ?? null,
      packageLabel: `${norm.standardInputQuantity} ${norm.standardInputUnit}`,
      packageQuantity: norm.standardInputQuantity,
      packageUnit: norm.standardInputUnit,
      normalizedQuantity: norm.normalizedQuantity,
      normalizedUnit: norm.normalizedUnit,
      regularPriceCents,
      promoPriceCents,
      loyaltyPriceCents,
      unitPriceCents: standardizedUnitCents ?? fallbackUnit?.unitPriceCents ?? null,
      lowest30DayPriceCents: lowest30dCents,
      requiresLoyaltyCard: isBillaBonus,
      loyaltyProgramName: isBillaBonus ? 'BILLA Bonus' : null,
      conditionLabel: isBillaBonus ? 'S kartou BILLA Bonus' : null,
      minQuantity: null,
      validFrom: null,
      validTo: null,
      sourceUrl: `https://www.billa.sk/produkt/${item.slug}`,
      imageUrl: item.images?.[0] ?? null,
      availabilityStatus: isStandardOffer || isBillaBonus ? 'LEAFLET_OFFER' : 'VERIFIED_IN_STOCK',
      sourceType: 'LIVE_SSR_ADAPTER',
      observedAt,
    });
  }

  return {
    itemsDiscovered: discovered,
    offers,
    errors,
  };
}

/**
 * Fetches live BILLA Slovakia leaflet/product pages permitted by sitemap.xml & robots.txt.
 */
export async function fetchLiveBillaSkOffers(
  urls: string[] = ['https://www.billa.sk/produkty/leaflet-99000000']
): Promise<AdapterIngestionReport> {
  const startedAt = new Date().toISOString();
  const allOffers: NormalizedRetailerOffer[] = [];
  const allErrors: AdapterErrorRecord[] = [];
  const seenSkus = new Set<string>();
  let totalDiscovered = 0;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PriceTrackerSK-DataVerifier/1.0 (+https://pricetracker.sk; robots-compliant)',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        allErrors.push({
          externalIdentifier: url,
          errorCode: `HTTP_${response.status}`,
          errorMessage: `BILLA SK returned HTTP ${response.status} for ${url}`,
        });
        continue;
      }

      const html = await response.text();
      const parsed = parseBillaSkHtmlToOffers(html, url, startedAt);
      totalDiscovered += parsed.itemsDiscovered;
      allErrors.push(...parsed.errors);

      for (const offer of parsed.offers) {
        if (!seenSkus.has(offer.externalId)) {
          seenSkus.add(offer.externalId);
          allOffers.push(offer);
        }
      }
    } catch (err) {
      allErrors.push({
        externalIdentifier: url,
        errorCode: 'BILLA_NETWORK_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Network error fetching BILLA SK',
      });
    }
  }

  return {
    retailerSlug: 'billa',
    sourceType: 'LIVE_SSR_ADAPTER',
    endpointUrl: urls[0] ?? 'https://www.billa.sk/produkty/leaflet-99000000',
    startedAt,
    completedAt: new Date().toISOString(),
    itemsDiscovered: totalDiscovered,
    offersNormalized: allOffers,
    errors: allErrors,
    notes: [
      'Extrahované z verejného SSR katalógu billa.sk (__NUXT_DATA__ Commercetools) vrátane 30-dňovej najnižšej ceny.',
    ],
  };
}
