// ==============================================================================
// PRICE TRACKER SK — PRODUCT MATCHING, BARCODE VALIDATION & DEDUPLICATION
// ==============================================================================

import { normalizeQuantityAndUnit } from './money';
import type { MatchStatus, MatchType } from './types';

const PRIVATE_LABEL_BRANDS = new Set([
  'pilos',
  'pikok',
  'milbona',
  'combino',
  'chef select',
  'kania',
  'belbake',
  'alesto',
  'freeway',
  'saguaro',
  'clever',
  'billa',
  'billa bio',
  'billa premium',
  'bon via',
  'chute slovenska',
  'masiarov vyber',
  'mäsiarov výber',
  'mäsiarova čerstvá porcia',
  'masiarova cerstva porcia',
  'tesco',
  'tesco finest',
  'stockwell',
  'hearty food',
  'creamfields',
  'eastmans',
]);

/**
 * Removes Slovak diacritics, punctuation, and normalizes whitespace.
 */
export function normalizeSlovakText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%.,\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes a product name while stripping package dimensions and noise words.
 */
export function extractSemanticTokens(title: string, brand?: string | null): string[] {
  const normBrand = normalizeSlovakText(brand);
  const normTitle = normalizeSlovakText(title)
    // Strip package tokens like 500g, 1kg, 1.5l, 10ks
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|dg|ml|cl|dl|l|ks|kus|bal)\b/g, ' ')
    .replace(/\b(?:balenie|cena|za|cca|ca|xxl|pack)\b/g, ' ');

  const stopWords = new Set(['s', 'so', 'v', 'vo', 'na', 'do', 'pre', 'z', 'zo', 'a', 'aj', 'od', 'bez']);
  const brandTokens = new Set(normBrand ? normBrand.split(' ') : []);

  return normTitle
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !stopWords.has(t) && !brandTokens.has(t));
}

/**
 * Validates whether a barcode is a standard 8, 12, 13, or 14-digit GTIN/EAN
 * (excluding internal weighted prefixes like 00000000... or 21...).
 */
export function isStandardGtinBarcode(barcode: string | null | undefined): boolean {
  if (!barcode) return false;
  const digits = barcode.trim();
  if (!/^\d{8,14}$/.test(digits)) return false;
  if (digits.startsWith('00000') || (digits.length === 13 && digits.startsWith('2'))) {
    // Internal storePLU or variable-weight barcode, not cross-retailer GTIN
    return false;
  }
  return true;
}

export function isPrivateLabelBrand(brand: string | null | undefined): boolean {
  if (!brand) return false;
  return PRIVATE_LABEL_BRANDS.has(normalizeSlovakText(brand));
}

export interface ProductCandidateInput {
  title: string;
  brand?: string | null;
  barcode?: string | null;
  packageQuantity: number;
  packageUnit: string;
  categorySlug?: string | null;
  variantDescriptor?: string | null;
}

export interface ProductMatchResult {
  matchType: MatchType;
  confidence: number; // 0.000 to 1.000
  matchStatus: MatchStatus;
  hasSameNormalizedPackageSize: boolean;
  reasons: string[];
}

/**
 * Evaluates whether two product listings represent:
 * - EXACT_MATCH: Same branded product & identical package size (e.g. Rajo Mňam 145 g at Tesco & BILLA)
 * - EQUIVALENT_PRODUCT: Equivalent staple with identical package size & spec across private labels
 *   (e.g. Pilos Maslo 82% 250g vs Clever Maslo 82% 250g vs Tesco Maslo 82% 250g)
 * - SIMILAR_PRODUCT: Same product family or different package size (e.g. 400 g vs 500 g) — NEVER treated as identical!
 * - NO_MATCH: Unrelated products.
 *
 * Uncertain matches (0.60 <= confidence < 0.90) are marked PENDING_REVIEW rather than silently merged.
 */
export function evaluateProductMatch(
  a: ProductCandidateInput,
  b: ProductCandidateInput
): ProductMatchResult {
  const reasons: string[] = [];

  const normA = normalizeQuantityAndUnit(a.packageQuantity, a.packageUnit);
  const normB = normalizeQuantityAndUnit(b.packageQuantity, b.packageUnit);

  if (!normA || !normB || normA.normalizedUnit !== normB.normalizedUnit) {
    return {
      matchType: 'NO_MATCH',
      confidence: 0,
      matchStatus: 'REJECTED',
      hasSameNormalizedPackageSize: false,
      reasons: ['Nekompatibilné merné jednotky balenia'],
    };
  }

  const quantityDiffRatio =
    Math.abs(normA.normalizedQuantity - normB.normalizedQuantity) /
    Math.max(normA.normalizedQuantity, normB.normalizedQuantity);
  const hasSameNormalizedPackageSize = quantityDiffRatio <= 0.001;

  // 1. Deterministic GTIN/EAN barcode match
  if (
    isStandardGtinBarcode(a.barcode) &&
    isStandardGtinBarcode(b.barcode) &&
    a.barcode!.trim() === b.barcode!.trim()
  ) {
    if (hasSameNormalizedPackageSize) {
      reasons.push(`Presná zhoda GTIN/EAN čiarového kódu (${a.barcode!.trim()}) a veľkosti balenia`);
      return {
        matchType: 'EXACT_MATCH',
        confidence: 1.0,
        matchStatus: 'VERIFIED',
        hasSameNormalizedPackageSize: true,
        reasons,
      };
    } else {
      reasons.push(
        `Zhoda EAN kódu, ale rozdielna veľkosť balenia (${a.packageQuantity} ${a.packageUnit} vs ${b.packageQuantity} ${b.packageUnit})`
      );
      return {
        matchType: 'SIMILAR_PRODUCT',
        confidence: 0.75,
        matchStatus: 'PENDING_REVIEW',
        hasSameNormalizedPackageSize: false,
        reasons,
      };
    }
  }

  // 2. Semantic token & attribute comparison
  const tokensA = extractSemanticTokens(a.title, a.brand);
  const tokensB = extractSemanticTokens(b.title, b.brand);
  if (tokensA.length === 0 || tokensB.length === 0) {
    return {
      matchType: 'NO_MATCH',
      confidence: 0,
      matchStatus: 'REJECTED',
      hasSameNormalizedPackageSize,
      reasons: ['Nedostatok textových tokenov na porovnanie'],
    };
  }

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  const intersection = [...setA].filter((x) => setB.has(x));
  const unionSize = new Set([...setA, ...setB]).size;
  const jaccard = unionSize > 0 ? intersection.length / unionSize : 0;
  const overlapMin =
    Math.min(setA.size, setB.size) > 0
      ? intersection.length / Math.min(setA.size, setB.size)
      : 0;

  const tokenSimilarity = jaccard * 0.55 + overlapMin * 0.45;

  // Check fat percentage or variant attribute (e.g. 1,5% vs 3,5% must not be merged!)
  const pctA = normalizeSlovakText(a.title).match(/(\d+(?:[.,]\d+)?)\s*%/);
  const pctB = normalizeSlovakText(b.title).match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (pctA && pctB && pctA[1].replace(',', '.') !== pctB[1].replace(',', '.')) {
    reasons.push(`Rozdielny obsah tuku/koncentrácie (${pctA[0]} vs ${pctB[0]})`);
    return {
      matchType: 'SIMILAR_PRODUCT',
      confidence: Number((tokenSimilarity * 0.5).toFixed(3)),
      matchStatus: 'REJECTED',
      hasSameNormalizedPackageSize,
      reasons,
    };
  }

  // CRITICAL GUARDRAIL: A 400 g package must NEVER be treated as identical (EXACT_MATCH or EQUIVALENT_PRODUCT)
  // to a 500 g package simply because the names look similar.
  if (!hasSameNormalizedPackageSize) {
    if (tokenSimilarity >= 0.65) {
      reasons.push(
        `Podobný produkt, ale odlišná veľkosť balenia (${a.packageQuantity} ${a.packageUnit} vs ${b.packageQuantity} ${b.packageUnit}). Porovnávajte výhradne podľa jednotkovej ceny.`
      );
      return {
        matchType: 'SIMILAR_PRODUCT',
        confidence: Number(Math.min(0.78, tokenSimilarity * 0.8).toFixed(3)),
        matchStatus: 'PENDING_REVIEW',
        hasSameNormalizedPackageSize: false,
        reasons,
      };
    }
    return {
      matchType: 'NO_MATCH',
      confidence: Number((tokenSimilarity * 0.4).toFixed(3)),
      matchStatus: 'REJECTED',
      hasSameNormalizedPackageSize: false,
      reasons: ['Odlišné balenie a nízka textová podobnosť'],
    };
  }

  // Same normalized package size: check brand relationship
  const brandA = normalizeSlovakText(a.brand);
  const brandB = normalizeSlovakText(b.brand);
  const sameBrand = Boolean(brandA && brandB && brandA === brandB);
  const bothPrivateOrGeneric =
    (!brandA || isPrivateLabelBrand(brandA)) && (!brandB || isPrivateLabelBrand(brandB));

  if (sameBrand && tokenSimilarity >= 0.75) {
    const conf = Number(Math.min(0.98, 0.85 + tokenSimilarity * 0.15).toFixed(3));
    reasons.push(`Rovnaká značka (${a.brand}), rovnaké balenie a vysoká zhoda názvu`);
    return {
      matchType: 'EXACT_MATCH',
      confidence: conf,
      matchStatus: conf >= 0.9 ? 'VERIFIED' : 'PENDING_REVIEW',
      hasSameNormalizedPackageSize: true,
      reasons,
    };
  }

  if (bothPrivateOrGeneric && tokenSimilarity >= 0.8) {
    const conf = Number(Math.min(0.94, 0.82 + tokenSimilarity * 0.12).toFixed(3));
    reasons.push('Ekvivalentný základný produkt privátnych značiek s identickou gramážou/objemom');
    return {
      matchType: 'EQUIVALENT_PRODUCT',
      confidence: conf,
      matchStatus: conf >= 0.9 ? 'VERIFIED' : 'PENDING_REVIEW',
      hasSameNormalizedPackageSize: true,
      reasons,
    };
  }

  if (tokenSimilarity >= 0.6) {
    const conf = Number((0.6 + tokenSimilarity * 0.25).toFixed(3));
    reasons.push('Čiastočná zhoda názvu a balenia — vyžaduje kontrolu v prehľade párovania');
    return {
      matchType: sameBrand ? 'EXACT_MATCH' : 'EQUIVALENT_PRODUCT',
      confidence: conf,
      matchStatus: 'PENDING_REVIEW',
      hasSameNormalizedPackageSize: true,
      reasons,
    };
  }

  return {
    matchType: 'NO_MATCH',
    confidence: Number((tokenSimilarity * 0.5).toFixed(3)),
    matchStatus: 'REJECTED',
    hasSameNormalizedPackageSize: true,
    reasons: ['Nízka miera zhody názvu produktu'],
  };
}

/**
 * Generates a deterministic SHA-256 deduplication hash for a price observation
 * so repeated imports on the same day are idempotent and never create duplicate rows.
 */
export function computeObservationDeduplicationHash(params: {
  listingId: string;
  observationDay: string; // YYYY-MM-DD
  regularPriceCents: number | null;
  promoPriceCents: number | null;
  loyaltyPriceCents: number | null;
}): string {
  const payload = [
    params.listingId,
    params.observationDay,
    params.regularPriceCents ?? 'null',
    params.promoPriceCents ?? 'null',
    params.loyaltyPriceCents ?? 'null',
  ].join('|');

  try {
    const nodeCrypto =
      typeof window === 'undefined'
        ? (globalThis as any).process?.versions?.node
          ? require('crypto')
          : null
        : null;
    if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
      return nodeCrypto.createHash('sha256').update(payload).digest('hex');
    }
  } catch {
    // fallback to pure hash below
  }

  // Pure deterministic 64-character hex fallback
  let h1 = 0xdeadbeef,
    h2 = 0x41c64e6d;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex =
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0');
  return hex.repeat(4).slice(0, 64);
}
