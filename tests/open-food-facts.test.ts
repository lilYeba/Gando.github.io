// ==============================================================================
// PRICE TRACKER SK — OPEN FOOD FACTS INTEGRATION TESTS
// ==============================================================================

import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  normalizeBarcode,
  getOpenFoodFactsAttribution,
  resolveProductPhoto,
  fetchProductByBarcode,
} from '../src/lib/services/open-food-facts';

describe('Open Food Facts API Service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeBarcode', () => {
    it('normalizes standard 13-digit Slovak EAN barcodes', () => {
      expect(normalizeBarcode('8585002510037')).toBe('8585002510037');
      expect(normalizeBarcode('858-500-251-0037')).toBe('8585002510037');
      expect(normalizeBarcode(' 8585002510037 ')).toBe('8585002510037');
    });

    it('normalizes 8-digit and 14-digit GTIN barcodes', () => {
      expect(normalizeBarcode('12345678')).toBe('12345678');
      expect(normalizeBarcode('08585002510037')).toBe('08585002510037');
    });

    it('rejects invalid or too short/long barcode strings', () => {
      expect(normalizeBarcode(null)).toBeNull();
      expect(normalizeBarcode('')).toBeNull();
      expect(normalizeBarcode('12345')).toBeNull(); // < 8
      expect(normalizeBarcode('12345678901234567')).toBeNull(); // > 14
      expect(normalizeBarcode('ABCDEFGH')).toBeNull();
    });
  });

  describe('getOpenFoodFactsAttribution', () => {
    it('returns standard Open Food Facts ODbL attribution notice', () => {
      const attribution = getOpenFoodFactsAttribution();
      expect(attribution).toContain('Open Food Facts');
      expect(attribution).toContain('ODbL');
    });
  });

  describe('fetchProductByBarcode with mocked network responses', () => {
    it('parses valid Open Food Facts API response payload correctly', async () => {
      const mockProduct = {
        code: '8588000003020',
        product_name: 'Liptov Bryndza',
        product_name_sk: 'Liptov Bryndza plnotučná',
        brands: 'Liptov',
        image_front_url: 'https://images.openfoodfacts.net/images/products/858/800/000/3020/front_en.4.400.jpg',
        image_front_small_url: 'https://images.openfoodfacts.net/images/products/858/800/000/3020/front_en.4.200.jpg',
        quantity: '125 g',
        status: 1,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 1, product: mockProduct }),
      } as unknown as Response);

      const product = await fetchProductByBarcode('8588000003020');
      expect(product).not.toBeNull();
      expect(product?.product_name_sk).toBe('Liptov Bryndza plnotučná');
      expect(product?.image_front_url).toContain('front_en.4.400.jpg');
    });

    it('handles HTTP 404 or missing product gracefully without throwing', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as unknown as Response);

      const product = await fetchProductByBarcode('0000000000000');
      expect(product).toBeNull();
    });

    it('handles network timeouts or AbortController errors gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network timeout'));

      const product = await fetchProductByBarcode('8585002510037');
      expect(product).toBeNull();
    });
  });

  describe('resolveProductPhoto (Caching & Resolution)', () => {
    it('resolves verified cached Slovak product photo from SQLite cache', async () => {
      // 8585002510037 is Rajo Mlieko polotučné, synchronized into SQLite cache
      const result = await resolveProductPhoto({
        barcode: '8585002510037',
        productName: 'Trvanlivé mlieko polotučné 1,5 %',
        brand: 'Rajo',
      });

      expect(result).not.toBeNull();
      if (result) {
        expect(result.barcode).toBe('8585002510037');
        expect(result.imageUrl).toMatch(/^https:\/\/images\.openfoodfacts\.(org|net)/);
        expect(result.source).toBe('open_food_facts');
        expect(result.attribution).toContain('ODbL');
      }
    });

    it('returns null and caches negative result for non-existent product', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response);

      const result = await resolveProductPhoto({
        barcode: '0000000000099',
        productName: 'Neexistujúca čerstvá zelenina',
        brand: null,
      });

      expect(result).toBeNull();
    });
  });
});
