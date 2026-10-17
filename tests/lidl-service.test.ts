// ==============================================================================
// PRICE TRACKER SK — OFFICIAL LIDL SERVICE TESTS
// ==============================================================================

import { describe, expect, it } from 'vitest';
import {
  getLidlImageAttribution,
  fetchLidlSkGridboxes,
  fetchLidlComGridboxes,
  resolveLidlProductImage,
} from '../src/lib/services/lidl-service';

describe('Official Lidl Service (lidl.sk & lidl.com)', () => {
  describe('getLidlImageAttribution', () => {
    it('returns official Lidl attribution notice', () => {
      const attribution = getLidlImageAttribution();
      expect(attribution).toContain('lidl.sk / lidl.com');
      expect(attribution).toContain('Lidl Stiftung & Co. KG');
    });
  });

  describe('fetchLidlSkGridboxes & fetchLidlComGridboxes', () => {
    it('handles empty ERP lists cleanly without network requests', async () => {
      expect(await fetchLidlSkGridboxes([])).toEqual([]);
      expect(await fetchLidlComGridboxes([])).toEqual([]);
    });

    it('rejects invalid or blank ERP strings without throwing', async () => {
      expect(await fetchLidlSkGridboxes(['   ', ''])).toEqual([]);
    });
  });

  describe('resolveLidlProductImage (Resolution & Caching)', () => {
    it('resolves verified official Slovak Lidl photograph for ERP 11141712 (Mleté mäso MIX)', async () => {
      const result = await resolveLidlProductImage({
        externalId: '11141712',
        title: 'Mleté mäso MIX 500 g balenie',
        brand: 'Mäsiarova čerstvá porcia',
      });

      expect(result).not.toBeNull();
      if (result) {
        expect(result.erpNumber).toBe('11141712');
        expect(result.source).toBe('lidl.sk');
        expect(result.imageUrl).toMatch(/^https:\/\/www\.lidl\.sk\/assets\/gcp[a-zA-Z0-9]+\.(png|jpeg|jpg)/);
        expect(result.attribution).toContain('Lidl Stiftung & Co. KG');
      }
    });

    it('resolves verified official Lidl photograph for ERP 11094410 (Combino Špagety) from lidl.com', async () => {
      const result = await resolveLidlProductImage({
        externalId: '11094410',
        title: 'Combino Špagety semolinové 500 g',
        brand: 'Combino',
      });

      expect(result).not.toBeNull();
      if (result) {
        expect(result.erpNumber).toBe('11094410');
        expect(result.source).toBe('lidl.com');
        expect(result.imageUrl).toMatch(/^https:\/\/www\.lidl\.com\/assets\/gcp[a-zA-Z0-9]+\.(png|jpeg|jpg)/);
      }
    });

    it('returns null and negative-caches non-existent ERP without throwing', async () => {
      const result = await resolveLidlProductImage({
        externalId: '9999999999999',
        title: 'Neexistujúci testovací produkt',
        brand: null,
      });

      expect(result).toBeNull();
    });
  });
});
