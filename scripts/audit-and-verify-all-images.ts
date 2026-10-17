import https from 'node:https';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/pricetracker.sqlite');

function testUrl(url: string | null): Promise<{ status: number; ok: boolean; contentType?: string }> {
  if (!url) return Promise.resolve({ status: 0, ok: false });
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(
        url,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 5000,
        },
        (res) => {
          resolve({
            status: res.statusCode || 0,
            ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400,
            contentType: res.headers['content-type'],
          });
        }
      );
      req.on('error', () => resolve({ status: 0, ok: false }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 0, ok: false });
      });
      req.end();
    } catch {
      resolve({ status: 0, ok: false });
    }
  });
}

async function auditAllImages() {
  const products = db.prepare('SELECT id, slug, canonical_name, brand, package_quantity, package_unit, image_url FROM products ORDER BY id').all() as any[];

  console.log(`Auditing ${products.length} products and their image URLs...`);

  for (const p of products) {
    const res = await testUrl(p.image_url);
    console.log(`\nProduct: [${p.id}] "${p.canonical_name}" (${p.brand || 'No brand'}) - ${p.package_quantity} ${p.package_unit}`);
    console.log(`  Canonical Img: ${p.image_url ? (res.ok ? '✓ HTTP ' + res.status : '✗ FAILED ' + res.status) : 'NONE'}`);
    console.log(`  URL: ${p.image_url}`);

    const listings = db.prepare('SELECT id, retailer_id, retailer_title, retailer_brand, image_url FROM retailer_product_listings WHERE product_id = ?').all(p.id) as any[];
    for (const l of listings) {
      const lRes = await testUrl(l.image_url);
      console.log(`    Listing [${l.retailer_id}] "${l.retailer_title}" => ${l.image_url ? (lRes.ok ? '✓ HTTP ' + lRes.status : '✗ FAILED ' + lRes.status) : 'NONE'}`);
      if (l.image_url) console.log(`      L-URL: ${l.image_url}`);
    }
  }
}

auditAllImages();
