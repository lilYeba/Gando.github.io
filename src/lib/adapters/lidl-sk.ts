// ==============================================================================
// PRICE TRACKER SK — LIDL SLOVAKIA ADAPTER (SSR data-grid-data JSON Parser)
// ==============================================================================

import { z } from 'zod';
import {
  calculateUnitPriceCents,
  eurosToCents,
  parsePackageSpecification,
  parseRetailerBasePriceText,
} from '../domain/money';
import type { AdapterErrorRecord, AdapterIngestionReport, NormalizedRetailerOffer } from './types';

const LidlGridboxSchema = z.object({
  productId: z.union([z.number(), z.string()]),
  erpNumber: z.string().optional(),
  fullTitle: z.string().min(1),
  canonicalUrl: z.string().optional(),
  category: z.string().optional(),
  ians: z.array(z.string()).optional(),
  image: z.string().optional(),
  brand: z
    .object({
      name: z.string().optional(),
    })
    .optional(),
  keyfacts: z
    .object({
      wonCategoryPrimary: z.string().optional(),
    })
    .optional(),
  price: z
    .object({
      price: z.number().optional(),
      oldPrice: z.number().optional(),
      packaging: z
        .object({
          text: z.string().optional(),
        })
        .optional(),
      basePrice: z
        .object({
          text: z.string().optional(),
        })
        .optional(),
      discount: z
        .object({
          deletedPrice: z.number().optional(),
          percentageDiscount: z.number().optional(),
          bargainHintText: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  lidlPlus: z
    .array(
      z.object({
        lidlPlusText: z.string().optional(),
        highlightText: z.string().optional(),
        price: z
          .object({
            price: z.number().optional(),
            oldPrice: z.number().optional(),
            discount: z
              .object({
                deletedPrice: z.number().optional(),
                percentageDiscount: z.number().optional(),
              })
              .optional(),
          })
          .optional(),
      })
    )
    .optional(),
  storeStartDate: z.number().optional(),
  storeEndDate: z.number().optional(),
});

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/**
 * Parses Lidl Slovakia HTML containing `data-grid-data="..."` attributes
 * into validated, normalized retailer offers.
 */
export function parseLidlSkHtmlToOffers(
  html: string,
  pageUrl: string = 'https://www.lidl.sk/c/jedlo-a-napoje/s10068374',
  observedAt: string = new Date().toISOString()
): {
  itemsDiscovered: number;
  offers: NormalizedRetailerOffer[];
  errors: AdapterErrorRecord[];
} {
  const matches = [...html.matchAll(/data-grid-data="([^"]+)"/g)];
  const offers: NormalizedRetailerOffer[] = [];
  const errors: AdapterErrorRecord[] = [];
  const seenIds = new Set<string>();

  for (const m of matches) {
    const rawDecoded = decodeHtmlEntities(m[1]);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawDecoded);
    } catch (err) {
      errors.push({
        externalIdentifier: null,
        errorCode: 'LIDL_JSON_PARSE_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Invalid JSON in data-grid-data',
        rawPayloadSnippet: rawDecoded.slice(0, 200),
      });
      continue;
    }

    const validation = LidlGridboxSchema.safeParse(parsedJson);
    if (!validation.success) {
      errors.push({
        externalIdentifier: null,
        errorCode: 'LIDL_SCHEMA_VALIDATION_ERROR',
        errorMessage: validation.error.issues.map((i) => i.message).join('; '),
        rawPayloadSnippet: rawDecoded.slice(0, 200),
      });
      continue;
    }

    const item = validation.data;
    const externalId = String(item.erpNumber ?? item.productId);
    if (seenIds.has(externalId)) {
      continue;
    }
    seenIds.add(externalId);

    const packagingText = item.price?.packaging?.text ?? item.fullTitle;
    const parsedPkg = parsePackageSpecification(packagingText) ??
      parsePackageSpecification(item.fullTitle) ?? {
        rawText: packagingText || '1 ks',
        quantity: 1,
        unit: 'ks' as const,
        multipackCount: 1,
        normalizedQuantity: 1,
        normalizedUnit: 'ks' as const,
      };

    const rawPriceCents = eurosToCents(item.price?.price);
    const oldPriceCents = eurosToCents(
      item.price?.oldPrice ?? item.price?.discount?.deletedPrice
    );

    const lidlPlusEntry = item.lidlPlus?.[0];
    const lidlPlusPriceCents = eurosToCents(lidlPlusEntry?.price?.price);
    const lidlPlusOldCents = eurosToCents(
      lidlPlusEntry?.price?.oldPrice ?? lidlPlusEntry?.price?.discount?.deletedPrice
    );

    let regularPriceCents: number | null = null;
    let promoPriceCents: number | null = null;
    let loyaltyPriceCents: number | null = null;

    if (lidlPlusPriceCents !== null) {
      loyaltyPriceCents = lidlPlusPriceCents;
      regularPriceCents = lidlPlusOldCents ?? oldPriceCents ?? rawPriceCents ?? lidlPlusPriceCents;
      if (rawPriceCents !== null && oldPriceCents !== null && rawPriceCents < oldPriceCents) {
        promoPriceCents = rawPriceCents;
      }
    } else if (rawPriceCents !== null) {
      if (oldPriceCents !== null && oldPriceCents > rawPriceCents) {
        regularPriceCents = oldPriceCents;
        promoPriceCents = rawPriceCents;
      } else {
        regularPriceCents = rawPriceCents;
      }
    }

    const effectiveCents = loyaltyPriceCents ?? promoPriceCents ?? regularPriceCents;
    const parsedBasePrice = parseRetailerBasePriceText(item.price?.basePrice?.text);
    const computedUnit = calculateUnitPriceCents(
      effectiveCents,
      parsedPkg.quantity,
      parsedPkg.unit
    );

    const validFrom = item.storeStartDate
      ? new Date(item.storeStartDate * 1000).toISOString()
      : null;
    const validTo = item.storeEndDate ? new Date(item.storeEndDate * 1000).toISOString() : null;

    const cleanBrand =
      item.brand?.name && item.brand.name !== '-' ? item.brand.name.trim() : null;

    const sourceUrl = item.canonicalUrl
      ? item.canonicalUrl.startsWith('http')
        ? item.canonicalUrl
        : `https://www.lidl.sk${item.canonicalUrl}`
      : pageUrl;

    const minQtyMatch = lidlPlusEntry?.highlightText?.match(/od\s+(\d+)\s*kus/i);

    offers.push({
      retailerSlug: 'lidl',
      externalId,
      externalSku: item.erpNumber ?? externalId,
      barcode: item.ians?.[0] ?? null,
      title: item.fullTitle.trim(),
      brand: cleanBrand,
      categoryHint: item.keyfacts?.wonCategoryPrimary ?? item.category ?? null,
      packageLabel: item.price?.packaging?.text ?? `${parsedPkg.quantity} ${parsedPkg.unit}`,
      packageQuantity: parsedPkg.quantity,
      packageUnit: parsedPkg.unit,
      normalizedQuantity: parsedPkg.normalizedQuantity,
      normalizedUnit: parsedBasePrice?.baseUnit ?? computedUnit?.baseUnit ?? parsedPkg.normalizedUnit,
      regularPriceCents,
      promoPriceCents,
      loyaltyPriceCents,
      unitPriceCents: parsedBasePrice?.unitPriceCents ?? computedUnit?.unitPriceCents ?? null,
      lowest30DayPriceCents: null,
      requiresLoyaltyCard: Boolean(lidlPlusEntry && loyaltyPriceCents !== null),
      loyaltyProgramName: lidlPlusEntry ? 'Lidl Plus' : null,
      conditionLabel: lidlPlusEntry
        ? [lidlPlusEntry.lidlPlusText, lidlPlusEntry.highlightText].filter(Boolean).join(' • ')
        : null,
      minQuantity: minQtyMatch ? parseInt(minQtyMatch[1], 10) : null,
      validFrom,
      validTo,
      sourceUrl,
      imageUrl: item.image ?? null,
      availabilityStatus: 'LEAFLET_OFFER',
      sourceType: 'LIVE_SSR_ADAPTER',
      observedAt,
    });
  }

  return {
    itemsDiscovered: matches.length,
    offers,
    errors,
  };
}

/**
 * Fetches live Lidl Slovakia category pages permitted by robots.txt.
 */
export async function fetchLiveLidlSkOffers(
  categoryUrls: string[] = ['https://www.lidl.sk/c/jedlo-a-napoje/s10068374']
): Promise<AdapterIngestionReport> {
  const startedAt = new Date().toISOString();
  const allOffers: NormalizedRetailerOffer[] = [];
  const allErrors: AdapterErrorRecord[] = [];
  let totalDiscovered = 0;
  const seenIds = new Set<string>();

  for (const url of categoryUrls) {
    // Enforce robots.txt compliance: never fetch /search?q= or ?offset=
    if (url.includes('search?q=') || url.includes('offset=')) {
      allErrors.push({
        externalIdentifier: url,
        errorCode: 'LIDL_ROBOTS_TXT_BLOCKED_URL',
        errorMessage: `Skipped disallowed URL pattern per Lidl robots.txt: ${url}`,
      });
      continue;
    }

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
          errorMessage: `Lidl SK returned HTTP ${response.status} for ${url}`,
        });
        continue;
      }

      const html = await response.text();
      const parsed = parseLidlSkHtmlToOffers(html, url, startedAt);
      totalDiscovered += parsed.itemsDiscovered;
      allErrors.push(...parsed.errors);

      for (const offer of parsed.offers) {
        if (!seenIds.has(offer.externalId)) {
          seenIds.add(offer.externalId);
          allOffers.push(offer);
        }
      }
    } catch (err) {
      allErrors.push({
        externalIdentifier: url,
        errorCode: 'LIDL_NETWORK_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Network error fetching Lidl SK',
      });
    }
  }

  return {
    retailerSlug: 'lidl',
    sourceType: 'LIVE_SSR_ADAPTER',
    endpointUrl: categoryUrls[0] ?? 'https://www.lidl.sk/c/jedlo-a-napoje/s10068374',
    startedAt,
    completedAt: new Date().toISOString(),
    itemsDiscovered: totalDiscovered,
    offersNormalized: allOffers,
    errors: allErrors,
    notes: [
      'Extrahované z verejných SSR kategórií lidl.sk (data-grid-data JSON) v súlade s robots.txt.',
    ],
  };
}
