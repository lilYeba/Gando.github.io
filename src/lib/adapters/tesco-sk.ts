// ==============================================================================
// PRICE TRACKER SK — TESCO SLOVAKIA ADAPTER (Live GraphQL + Verified CSV Fallback)
// ==============================================================================

import { z } from 'zod';
import {
  calculateUnitPriceCents,
  eurosToCents,
  parsePackageSpecification,
} from '../domain/money';
import type { AdapterErrorRecord, AdapterIngestionReport, NormalizedRetailerOffer } from './types';

export const TESCO_LEAFLETS_GRAPHQL_URL =
  'https://api.prod.retail.tesco.com/marketing/leaflets-be/graphql';

const TescoLeafletProductSchema = z.object({
  id: z.union([z.number(), z.string()]),
  promoOfferName: z.string().optional().nullable(),
  isMainProduct: z.boolean().optional().nullable(),
  addToBasketURL: z.string().optional().nullable(),
  product: z.object({
    id: z.union([z.number(), z.string()]).optional().nullable(),
    tpn: z.string().min(1),
    ean: z.string().optional().nullable(),
    productName: z.string().min(1),
    pngFileURL: z.string().optional().nullable(),
    isInGhs: z.boolean().optional().nullable(),
    productPeriods: z
      .array(
        z.object({
          id: z.union([z.number(), z.string()]).optional(),
          periodName: z.string().optional(),
          promoStart: z.string().optional(),
          promoEnd: z.string().optional(),
        })
      )
      .optional()
      .nullable(),
  }),
});

export interface VerifiedPriceCsvRow {
  retailerSlug: 'lidl' | 'tesco' | 'billa';
  externalId: string; // TPN, SKU, or ERP
  ean?: string | null;
  title: string;
  brand?: string | null;
  packageLabel: string;
  regularPriceEur?: string | number | null;
  promoPriceEur?: string | number | null;
  loyaltyPriceEur?: string | number | null;
  loyaltyProgramName?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  sourceUrl?: string | null;
}

/**
 * Parses a CSV text of verified leaflet prices (admin/manual fallback workflow).
 * Format:
 * retailer_slug,external_id,ean,title,brand,package_label,regular_price_eur,promo_price_eur,loyalty_price_eur,loyalty_program_name,valid_from,valid_to,source_url
 */
export function parseVerifiedPriceCsv(
  csvText: string,
  observedAt: string = new Date().toISOString()
): {
  offers: NormalizedRetailerOffer[];
  errors: AdapterErrorRecord[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length <= 1) {
    return { offers: [], errors: [] };
  }

  const offers: NormalizedRetailerOffer[] = [];
  const errors: AdapterErrorRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 7) {
      errors.push({
        externalIdentifier: `row-${i + 1}`,
        errorCode: 'CSV_COLUMN_COUNT_ERROR',
        errorMessage: `Riadok ${i + 1} má menej ako 7 stĺpcov`,
        rawPayloadSnippet: lines[i],
      });
      continue;
    }

    const [
      rawRetailer,
      externalId,
      ean,
      title,
      brand,
      packageLabel,
      regEur,
      promoEur,
      loyaltyEur,
      loyaltyProg,
      validFrom,
      validTo,
      sourceUrl,
    ] = cols;

    const retailerSlug = rawRetailer.toLowerCase() as 'lidl' | 'tesco' | 'billa';
    if (!['lidl', 'tesco', 'billa'].includes(retailerSlug)) {
      errors.push({
        externalIdentifier: externalId || `row-${i + 1}`,
        errorCode: 'CSV_INVALID_RETAILER',
        errorMessage: `Neznámy obchod '${rawRetailer}' na riadku ${i + 1}`,
      });
      continue;
    }

    const parsedPkg = parsePackageSpecification(packageLabel) ??
      parsePackageSpecification(title) ?? {
        rawText: packageLabel || '1 ks',
        quantity: 1,
        unit: 'ks' as const,
        multipackCount: 1,
        normalizedQuantity: 1,
        normalizedUnit: 'ks' as const,
      };

    const regularPriceCents = eurosToCents(regEur);
    const promoPriceCents = eurosToCents(promoEur);
    const loyaltyPriceCents = eurosToCents(loyaltyEur);
    const effectiveCents = loyaltyPriceCents ?? promoPriceCents ?? regularPriceCents;

    if (effectiveCents === null) {
      errors.push({
        externalIdentifier: externalId,
        errorCode: 'CSV_INVALID_PRICE',
        errorMessage: `Chýbajúca alebo neplatná cena na riadku ${i + 1}`,
      });
      continue;
    }

    const unitCalc = calculateUnitPriceCents(
      effectiveCents,
      parsedPkg.quantity,
      parsedPkg.unit
    );

    const defaultLoyaltyName =
      retailerSlug === 'tesco'
        ? 'Clubcard'
        : retailerSlug === 'lidl'
          ? 'Lidl Plus'
          : 'BILLA Bonus';

    offers.push({
      retailerSlug,
      externalId: externalId.trim(),
      externalSku: externalId.trim(),
      barcode: ean?.trim() || null,
      title: title.trim(),
      brand: brand?.trim() || null,
      categoryHint: null,
      packageLabel: packageLabel.trim() || `${parsedPkg.quantity} ${parsedPkg.unit}`,
      packageQuantity: parsedPkg.quantity,
      packageUnit: parsedPkg.unit,
      normalizedQuantity: parsedPkg.normalizedQuantity,
      normalizedUnit: unitCalc?.baseUnit ?? parsedPkg.normalizedUnit,
      regularPriceCents,
      promoPriceCents,
      loyaltyPriceCents,
      unitPriceCents: unitCalc?.unitPriceCents ?? null,
      lowest30DayPriceCents: null,
      requiresLoyaltyCard: loyaltyPriceCents !== null,
      loyaltyProgramName:
        loyaltyPriceCents !== null ? loyaltyProg?.trim() || defaultLoyaltyName : null,
      conditionLabel:
        loyaltyPriceCents !== null
          ? `S kartou ${loyaltyProg?.trim() || defaultLoyaltyName}`
          : null,
      minQuantity: null,
      validFrom: validFrom?.trim() || null,
      validTo: validTo?.trim() || null,
      sourceUrl:
        sourceUrl?.trim() ||
        (retailerSlug === 'tesco'
          ? 'https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy'
          : retailerSlug === 'lidl'
            ? 'https://www.lidl.sk'
            : 'https://www.billa.sk/letaky-a-akcie'),
      imageUrl: null,
      availabilityStatus: 'LEAFLET_OFFER',
      sourceType: 'VERIFIED_LEAFLET_CSV',
      observedAt,
    });
  }

  return { offers, errors };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Fetches live Tesco Slovakia leaflet products, TPNs, and 13-digit EAN barcodes
 * from Tesco's official Apollo GraphQL API (`api.prod.retail.tesco.com/marketing/leaflets-be/graphql`).
 *
 * Since Tesco's GraphQL schema does not include numeric EUR prices on LeafletProduct
 * and `potravinydomov.itesco.sk` blocks automated clients with HTTP 403 WAF,
 * this adapter merges any matching verified leaflet prices (by TPN or EAN) and
 * leaves unverified items with `regularPriceCents: null` (honest unavailable price).
 */
export async function fetchLiveTescoSkLeafletOffers(
  verifiedPriceMap?: Map<
    string,
    {
      regularPriceCents: number | null;
      promoPriceCents: number | null;
      loyaltyPriceCents: number | null;
    }
  >
): Promise<AdapterIngestionReport> {
  const startedAt = new Date().toISOString();
  const errors: AdapterErrorRecord[] = [];
  const offers: NormalizedRetailerOffer[] = [];

  try {
    // Step 1: Query active Slovak leaflets
    const listQuery = `
      query getLeafletList($country: CountryCode!) {
        leaflets(options: { filter: { country: { eq: $country } } }) {
          items {
            id
            slug
            type
            validFrom
            validTo
          }
        }
      }
    `;

    const listRes = await fetch(TESCO_LEAFLETS_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: listQuery, variables: { country: 'sk' } }),
      signal: AbortSignal.timeout(12000),
    });

    if (!listRes.ok) {
      return {
        retailerSlug: 'tesco',
        sourceType: 'LIVE_GRAPHQL_ADAPTER',
        endpointUrl: TESCO_LEAFLETS_GRAPHQL_URL,
        startedAt,
        completedAt: new Date().toISOString(),
        itemsDiscovered: 0,
        offersNormalized: [],
        errors: [
          {
            externalIdentifier: 'leaflets',
            errorCode: `HTTP_${listRes.status}`,
            errorMessage: `Tesco GraphQL returned HTTP ${listRes.status}`,
          },
        ],
        notes: [],
      };
    }

    const listJson = await listRes.json();
    const leaflets: Array<{
      id: number;
      slug: string;
      type: string;
      validFrom: string;
      validTo: string;
    }> = listJson.data?.leaflets?.items ?? [];

    const targetLeaflet =
      leaflets.find((l) => l.type === 'HM') ?? leaflets[0];

    if (!targetLeaflet) {
      return {
        retailerSlug: 'tesco',
        sourceType: 'LIVE_GRAPHQL_ADAPTER',
        endpointUrl: TESCO_LEAFLETS_GRAPHQL_URL,
        startedAt,
        completedAt: new Date().toISOString(),
        itemsDiscovered: 0,
        offersNormalized: [],
        errors: [],
        notes: ['Žiadny aktívny leták nebol vrátený z Tesco GraphQL API.'],
      };
    }

    // Step 2: Query pages and products for the active Slovak leaflet
    const pagesQuery = `
      query getLeafletPages($country: CountryCode!, $slug: String!, $leafletType: LeafletType) {
        leafletBySlug(country: $country, slug: $slug, leafletType: $leafletType) {
          id
          type
          validFrom
          validTo
          pages {
            page
            positions {
              products {
                id
                promoOfferName
                isMainProduct
                addToBasketURL
                product {
                  id
                  tpn
                  ean
                  productName
                  pngFileURL
                  isInGhs
                  productPeriods {
                    id
                    periodName
                    promoStart
                    promoEnd
                  }
                }
              }
            }
          }
        }
      }
    `;

    const pagesRes = await fetch(TESCO_LEAFLETS_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: pagesQuery,
        variables: {
          country: 'sk',
          slug: targetLeaflet.slug,
          leafletType: targetLeaflet.type,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const pagesJson = await pagesRes.json();
    const pages = pagesJson.data?.leafletBySlug?.pages ?? [];
    const rawProducts = pages.flatMap((p: { positions?: Array<{ products?: unknown[] }> }) =>
      (p.positions ?? []).flatMap((pos) => pos.products ?? [])
    );

    const seenTpns = new Set<string>();

    for (const rawProd of rawProducts) {
      const parsed = TescoLeafletProductSchema.safeParse(rawProd);
      if (!parsed.success) {
        continue;
      }
      const p = parsed.data;
      const tpn = p.product.tpn.trim();
      if (seenTpns.has(tpn)) {
        continue;
      }
      seenTpns.add(tpn);

      const title = p.product.productName.trim();
      const parsedPkg = parsePackageSpecification(title) ?? {
        rawText: '1 ks',
        quantity: 1,
        unit: 'ks' as const,
        multipackCount: 1,
        normalizedQuantity: 1,
        normalizedUnit: 'ks' as const,
      };

      const verifiedPrices =
        verifiedPriceMap?.get(tpn) ??
        (p.product.ean ? verifiedPriceMap?.get(p.product.ean.trim()) : undefined);

      const regularPriceCents = verifiedPrices?.regularPriceCents ?? null;
      const promoPriceCents = verifiedPrices?.promoPriceCents ?? null;
      const loyaltyPriceCents = verifiedPrices?.loyaltyPriceCents ?? null;
      const effectiveCents = loyaltyPriceCents ?? promoPriceCents ?? regularPriceCents;

      const unitCalc = calculateUnitPriceCents(
        effectiveCents,
        parsedPkg.quantity,
        parsedPkg.unit
      );

      offers.push({
        retailerSlug: 'tesco',
        externalId: tpn,
        externalSku: tpn,
        barcode: p.product.ean?.trim() || null,
        title,
        brand: p.promoOfferName?.split(' ')[0]?.trim() || null,
        categoryHint: null,
        packageLabel: `${parsedPkg.quantity} ${parsedPkg.unit}`,
        packageQuantity: parsedPkg.quantity,
        packageUnit: parsedPkg.unit,
        normalizedQuantity: parsedPkg.normalizedQuantity,
        normalizedUnit: unitCalc?.baseUnit ?? parsedPkg.normalizedUnit,
        regularPriceCents,
        promoPriceCents,
        loyaltyPriceCents,
        unitPriceCents: unitCalc?.unitPriceCents ?? null,
        lowest30DayPriceCents: null,
        requiresLoyaltyCard: loyaltyPriceCents !== null,
        loyaltyProgramName: loyaltyPriceCents !== null ? 'Clubcard' : null,
        conditionLabel: loyaltyPriceCents !== null ? 'S kartou Clubcard' : null,
        minQuantity: null,
        validFrom: targetLeaflet.validFrom ?? null,
        validTo: targetLeaflet.validTo ?? null,
        sourceUrl:
          p.addToBasketURL ||
          `https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy`,
        imageUrl: p.product.pngFileURL ?? null,
        availabilityStatus: effectiveCents !== null ? 'LEAFLET_OFFER' : 'UNKNOWN',
        sourceType: 'LIVE_GRAPHQL_ADAPTER',
        observedAt: startedAt,
      });
    }

    return {
      retailerSlug: 'tesco',
      sourceType: 'LIVE_GRAPHQL_ADAPTER',
      endpointUrl: TESCO_LEAFLETS_GRAPHQL_URL,
      startedAt,
      completedAt: new Date().toISOString(),
      itemsDiscovered: rawProducts.length,
      offersNormalized: offers,
      errors,
      notes: [
        `Načítaný aktívny leták ${targetLeaflet.slug} (${targetLeaflet.type}) z Tesco GraphQL API (${offers.length} unikátnych TPN/EAN produktov).`,
        'Poznámka k integrite dát: Tesco GraphQL schéma neobsahuje číselné pole ceny a potravinydomov.itesco.sk blokuje automatizované dopyty cez Akamai WAF (HTTP 403). Ceny pre Tesco sú preto spárované len pri overených položkách z letákového CSV importu; ostatné položky majú cenu čestne označenú ako nedostupnú.',
      ],
    };
  } catch (err) {
    return {
      retailerSlug: 'tesco',
      sourceType: 'LIVE_GRAPHQL_ADAPTER',
      endpointUrl: TESCO_LEAFLETS_GRAPHQL_URL,
      startedAt,
      completedAt: new Date().toISOString(),
      itemsDiscovered: 0,
      offersNormalized: [],
      errors: [
        {
          externalIdentifier: 'tesco-graphql',
          errorCode: 'TESCO_NETWORK_ERROR',
          errorMessage: err instanceof Error ? err.message : 'Network error calling Tesco GraphQL',
        },
      ],
      notes: [],
    };
  }
}
