import { describe, it, expect, beforeEach } from 'vitest';
import { getDatabase } from '../src/lib/db/repository';
import {
  initImageVerificationTable,
  recordImageVerification,
} from '../src/lib/services/image-verifier';

describe('Product Image Verification System', () => {
  beforeEach(() => {
    initImageVerificationTable();
  });

  it('initializes the product_image_verifications table with expected schema', () => {
    const db = getDatabase();
    const tableInfo = db.prepare("PRAGMA table_info('product_image_verifications')").all() as any[];
    const columnNames = tableInfo.map((c) => c.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('target_type');
    expect(columnNames).toContain('target_id');
    expect(columnNames).toContain('product_name');
    expect(columnNames).toContain('image_url');
    expect(columnNames).toContain('image_source');
    expect(columnNames).toContain('verification_status');
  });

  it('records verification entries and updates on conflict', () => {
    const record = {
      id: 'test-kofola-audit',
      targetType: 'PRODUCT' as const,
      targetId: 'prod-kofola-15l',
      barcode: '8586011070116',
      productName: 'Kofola Original 1.5L',
      brand: 'Kofola',
      packageSize: '1.5 l',
      storeSlug: 'canonical' as const,
      imageUrl: 'https://images.openfoodfacts.org/images/products/858/601/107/0116/front_en.26.400.jpg',
      imageSource: 'open_food_facts' as const,
      verificationStatus: 'VERIFIED_GENUINE_FOOD_PHOTO' as const,
      verificationNotes: 'Verified authentic Slovak packaging photo.',
      verifiedAt: new Date().toISOString(),
    };

    recordImageVerification(record);

    const db = getDatabase();
    const row = db
      .prepare('SELECT * FROM product_image_verifications WHERE id = ?')
      .get(record.id) as any;

    expect(row).toBeDefined();
    expect(row.product_name).toBe('Kofola Original 1.5L');
    expect(row.verification_status).toBe('VERIFIED_GENUINE_FOOD_PHOTO');
    expect(row.image_url).toBe(record.imageUrl);
  });

  it('guarantees canonical products are purged of mismatched images', () => {
    const db = getDatabase();

    // 1. Kofola must never show ketchup
    const kofola = db
      .prepare("SELECT image_url FROM products WHERE brand = 'Kofola' LIMIT 1")
      .get() as any;
    expect(kofola?.image_url).not.toContain('gcpa252420a296f40079d463c0b2a567043');
    expect(kofola?.image_url).toMatch(/openfoodfacts|prod-kofola/);

    // 2. Rajo Tvaroh must never show blue cheese
    const tvaroh = db
      .prepare("SELECT image_url FROM products WHERE id = 'prod-rajo-tvaroh-250g'")
      .get() as any;
    if (tvaroh?.image_url) {
      expect(tvaroh.image_url).not.toContain('gcpc9eab63723094012b74b187757ce7cea');
    } else {
      expect(tvaroh?.image_url).toBeNull();
    }

    // 3. Tami Maslo must never show Irish butter
    const maslo = db
      .prepare("SELECT image_url FROM products WHERE id = 'prod-tami-maslo-250g'")
      .get() as any;
    expect(maslo?.image_url).not.toContain('gcp220bf8322a2b410a881d4c3bdf310edc');

    // 4. Rajo Mlieko must never show US gallon jug
    const mlieko = db
      .prepare("SELECT image_url FROM products WHERE id = 'prod-rajo-mlieko-15-1l'")
      .get() as any;
    expect(mlieko?.image_url).not.toContain('gcpad2ac86a817f4c65a095ead01cf41d4d');

    // 5. Fresh butchered meat has verified studio packshot
    const kare = db
      .prepare("SELECT image_url FROM products WHERE id = 'prod-bravcove-kare-1kg'")
      .get() as any;
    expect(kare?.image_url).toBe('/images/products/prod-bravcove-kare-1kg.jpg');

    // 6. Fresh bakery roll has verified studio packshot
    const rozok = db
      .prepare("SELECT image_url FROM products WHERE id LIKE '%rohlik%' LIMIT 1")
      .get() as any;
    expect(rozok?.image_url).toMatch(/\/images\/products\/prod-.*rohlik/);
  });
});
