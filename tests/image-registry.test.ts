import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase, getAllProducts } from '../src/lib/db/repository';
import {
  initImageRegistryTable,
  registerProductImage,
  getRegisteredImageForProduct,
  getAllImageRegistryEntries,
  getImageRegistryMetrics,
} from '../src/lib/services/image-registry';

describe('Centralized Product Image Registry', () => {
  beforeEach(() => {
    initImageRegistryTable();
  });

  it('initializes the product_image_registry table with required schema', () => {
    const db = getDatabase();
    const tableInfo = db.prepare("PRAGMA table_info('product_image_registry')").all() as any[];
    const columnNames = tableInfo.map((c) => c.name);

    expect(columnNames).toContain('product_id');
    expect(columnNames).toContain('product_name');
    expect(columnNames).toContain('package_size');
    expect(columnNames).toContain('barcode');
    expect(columnNames).toContain('image_url');
    expect(columnNames).toContain('local_image_path');
    expect(columnNames).toContain('original_source_url');
    expect(columnNames).toContain('source_website');
    expect(columnNames).toContain('verification_status');
    expect(columnNames).toContain('attribution');
    expect(columnNames).toContain('is_reused_across_retailers');
  });

  it('registers and retrieves a canonical product image record', () => {
    const now = new Date().toISOString();
    registerProductImage({
      productId: 'prod-tami-maslo-250g',
      productName: 'Tatranské maslo 82 % 250 g',
      brand: 'Tami',
      packageSize: '250 g',
      barcode: '8585000902797',
      imageUrl: '/images/products/prod-tami-maslo-250g.jpg',
      localImagePath: '/images/products/prod-tami-maslo-250g.jpg',
      originalSourceUrl: 'https://images.openfoodfacts.org/images/products/858/500/090/2797/front_en.3.400.jpg',
      sourceWebsite: 'open_food_facts',
      verificationStatus: 'VERIFIED_GENUINE_PHOTO',
      lastCheckedAt: now,
      attribution: 'Open Food Facts (ODbL)',
      isReusedAcrossRetailers: true,
    });

    const entry = getRegisteredImageForProduct('prod-tami-maslo-250g');
    expect(entry).not.toBeNull();
    expect(entry!.productName).toBe('Tatranské maslo 82 % 250 g');
    expect(entry!.imageUrl).toBe('/images/products/prod-tami-maslo-250g.jpg');
    expect(entry!.verificationStatus).toBe('VERIFIED_GENUINE_PHOTO');
    expect(entry!.isReusedAcrossRetailers).toBe(true);
  });

  it('guarantees identical products reuse the same verified image across all store offers', () => {
    const products = getAllProducts();
    const tamiMaslo = products.find((p) => p.id === 'prod-tami-maslo-250g');

    expect(tamiMaslo).toBeDefined();
    expect(tamiMaslo!.imageUrl).toBeTruthy();

    // Check all retailer listings for tami maslo
    expect(tamiMaslo!.listings.length).toBeGreaterThanOrEqual(2);
    for (const listing of tamiMaslo!.listings) {
      expect(listing.imageUrl).toBe(tamiMaslo!.imageUrl);
    }
  });

  it('returns clean metrics with zero broken URLs and zero duplicate cross-product assignments', () => {
    const metrics = getImageRegistryMetrics();
    expect(metrics.totalProducts).toBeGreaterThanOrEqual(300);
    expect(metrics.brokenUrls).toBe(0);
    expect(metrics.duplicateAssignments).toBe(0);
    expect(metrics.neutralPlaceholder).toBeGreaterThanOrEqual(0);
    expect(metrics.verifiedGenuinePhoto + metrics.verifiedOfficialCatalog).toBeGreaterThanOrEqual(300);
  });
});
