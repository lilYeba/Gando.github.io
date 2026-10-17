// ==============================================================================
// PRICE TRACKER SK — RETAILER ADAPTER CONTRACTS & NORMALIZED SCHEMA
// ==============================================================================

import type { AvailabilityStatus, BaseUnit, DataSourceType, RetailerSlug } from '../domain/types';

export interface NormalizedRetailerOffer {
  retailerSlug: RetailerSlug;
  externalId: string;
  externalSku: string | null;
  barcode: string | null; // EAN13 / EAN8 / IAN when available
  title: string;
  brand: string | null;
  categoryHint: string | null;
  packageLabel: string;
  packageQuantity: number;
  packageUnit: 'g' | 'kg' | 'ml' | 'l' | 'ks';
  normalizedQuantity: number;
  normalizedUnit: BaseUnit;
  regularPriceCents: number | null;
  promoPriceCents: number | null;
  loyaltyPriceCents: number | null;
  unitPriceCents: number | null;
  lowest30DayPriceCents: number | null;
  requiresLoyaltyCard: boolean;
  loyaltyProgramName: string | null;
  conditionLabel: string | null;
  minQuantity: number | null;
  validFrom: string | null;
  validTo: string | null;
  sourceUrl: string;
  imageUrl: string | null;
  availabilityStatus: AvailabilityStatus;
  sourceType: DataSourceType;
  observedAt: string;
}

export interface AdapterErrorRecord {
  externalIdentifier: string | null;
  errorCode: string;
  errorMessage: string;
  rawPayloadSnippet?: string;
}

export interface AdapterIngestionReport {
  retailerSlug: RetailerSlug;
  sourceType: DataSourceType;
  endpointUrl: string;
  startedAt: string;
  completedAt: string;
  itemsDiscovered: number;
  offersNormalized: NormalizedRetailerOffer[];
  errors: AdapterErrorRecord[];
  notes: string[];
}
