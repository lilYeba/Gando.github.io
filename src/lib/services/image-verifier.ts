// ==============================================================================
// PRICE TRACKER SK — PRODUCT IMAGE VERIFICATION SYSTEM
// Enforces strict visual integrity, prevents mismatched/amateur images,
// and ensures only authentic, verified photographs are presented to users.
// ==============================================================================

import { getDatabase } from '../db/repository';

export type VerificationStatus =
  | 'VERIFIED_OFFICIAL_CATALOG'   // Official store catalog (lidl.sk, lidl.com, tesco.sk, billa.sk)
  | 'VERIFIED_GENUINE_FOOD_PHOTO'  // Verified authentic packaging from Open Food Facts / manufacturer
  | 'REJECTED_MISMATCH'            // Wrong product, wrong flavor, wrong size, or mismatched packaging
  | 'REJECTED_AMATEUR'             // Hand-held / tilted / poor-quality amateur snapshot
  | 'UNVERIFIED_PLACEHOLDER';      // Fresh/loose item or unverified image -> display neutral placeholder

export type ImageSourceType =
  | 'lidl.sk'
  | 'lidl.com'
  | 'tesco.sk'
  | 'billa.sk'
  | 'open_food_facts'
  | 'none';

export interface ProductImageVerificationRecord {
  id: string;
  targetType: 'PRODUCT' | 'LISTING';
  targetId: string;
  barcode: string | null;
  productName: string;
  brand: string | null;
  packageSize: string;
  storeSlug: 'canonical' | 'lidl' | 'tesco' | 'billa';
  imageUrl: string | null;
  imageSource: ImageSourceType;
  verificationStatus: VerificationStatus;
  verificationNotes: string;
  verifiedAt: string;
}

/**
 * Initializes the image verification table in SQLite if it does not already exist.
 */
export function initImageVerificationTable(): void {
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_image_verifications (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      barcode TEXT,
      product_name TEXT NOT NULL,
      brand TEXT,
      package_size TEXT NOT NULL,
      store_slug TEXT NOT NULL,
      image_url TEXT,
      image_source TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      verification_notes TEXT NOT NULL,
      verified_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_img_verif_target ON product_image_verifications(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_img_verif_status ON product_image_verifications(verification_status);
  `);
}

/**
 * Records or updates a verification audit result for a product or listing image.
 */
export function recordImageVerification(record: ProductImageVerificationRecord): void {
  const db = getDatabase();
  initImageVerificationTable();

  db.prepare(`
    INSERT INTO product_image_verifications (
      id, target_type, target_id, barcode, product_name, brand,
      package_size, store_slug, image_url, image_source,
      verification_status, verification_notes, verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      image_url = excluded.image_url,
      image_source = excluded.image_source,
      verification_status = excluded.verification_status,
      verification_notes = excluded.verification_notes,
      verified_at = excluded.verified_at
  `).run(
    record.id,
    record.targetType,
    record.targetId,
    record.barcode,
    record.productName,
    record.brand,
    record.packageSize,
    record.storeSlug,
    record.imageUrl,
    record.imageSource,
    record.verificationStatus,
    record.verificationNotes,
    record.verifiedAt
  );
}

/**
 * Retrieves the verification record for a given product or listing.
 */
export function getImageVerification(
  targetType: 'PRODUCT' | 'LISTING',
  targetId: string
): ProductImageVerificationRecord | null {
  try {
    const db = getDatabase();
    initImageVerificationTable();

    const row = db
      .prepare('SELECT * FROM product_image_verifications WHERE target_type = ? AND target_id = ?')
      .get(targetType, targetId) as any;

    if (!row) return null;

    return {
      id: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      barcode: row.barcode,
      productName: row.product_name,
      brand: row.brand,
      packageSize: row.package_size,
      storeSlug: row.store_slug,
      imageUrl: row.image_url,
      imageSource: row.image_source,
      verificationStatus: row.verification_status,
      verificationNotes: row.verification_notes,
      verifiedAt: row.verified_at,
    };
  } catch {
    return null;
  }
}

/**
 * Returns a summary of the current catalog verification state.
 */
export function getImageVerificationSummary(): {
  totalAudited: number;
  verifiedOfficialCatalog: number;
  verifiedGenuineFoodPhoto: number;
  rejectedMismatch: number;
  rejectedAmateur: number;
  unverifiedPlaceholder: number;
} {
  const db = getDatabase();
  initImageVerificationTable();

  const rows = db.prepare('SELECT verification_status, COUNT(*) as count FROM product_image_verifications GROUP BY verification_status').all() as any[];

  const summary = {
    totalAudited: 0,
    verifiedOfficialCatalog: 0,
    verifiedGenuineFoodPhoto: 0,
    rejectedMismatch: 0,
    rejectedAmateur: 0,
    unverifiedPlaceholder: 0,
  };

  for (const r of rows) {
    summary.totalAudited += Number(r.count);
    if (r.verification_status === 'VERIFIED_OFFICIAL_CATALOG') {
      summary.verifiedOfficialCatalog = Number(r.count);
    } else if (r.verification_status === 'VERIFIED_GENUINE_FOOD_PHOTO') {
      summary.verifiedGenuineFoodPhoto = Number(r.count);
    } else if (r.verification_status === 'REJECTED_MISMATCH') {
      summary.rejectedMismatch = Number(r.count);
    } else if (r.verification_status === 'REJECTED_AMATEUR') {
      summary.rejectedAmateur = Number(r.count);
    } else if (r.verification_status === 'UNVERIFIED_PLACEHOLDER') {
      summary.unverifiedPlaceholder = Number(r.count);
    }
  }

  return summary;
}
