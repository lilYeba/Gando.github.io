import { SEED_PRODUCTS } from '../src/lib/db/seed-data';

interface OffResult {
  slug: string;
  name: string;
  ean: string | null;
  foundByBarcode: boolean;
  foundByName: boolean;
  imageUrl?: string;
  offProductName?: string;
  offBrand?: string;
}

const USER_AGENT = 'PriceTrackerSK/1.0 (https://pricetracker.sk; contact: info@pricetracker.sk)';

async function fetchFromOffByBarcode(barcode: string) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_sk,brands,image_front_url,image_url,status`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 1 && data.product) {
      return data.product;
    }
  } catch (err) {
    // try fallback net domain
    try {
      const fallbackUrl = `https://world.openfoodfacts.net/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_sk,brands,image_front_url,image_url,status`;
      const res2 = await fetch(fallbackUrl, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(4000) });
      if (!res2.ok) return null;
      const data2 = await res2.json();
      if (data2.status === 1 && data2.product) {
        return data2.product;
      }
    } catch {
      return null;
    }
  }
  return null;
}

async function searchOffByBrandOrName(brand: string | null, name: string) {
  const searchTerm = brand ? `${brand} ${name}` : name;
  const url = `https://world.openfoodfacts.net/api/v2/search?search_terms=${encodeURIComponent(searchTerm)}&page_size=5&fields=code,product_name,product_name_sk,brands,image_front_url,image_url`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      // Find one with an image_front_url
      for (const p of data.products) {
        if (p.image_front_url || p.image_url) {
          return p;
        }
      }
      return data.products[0];
    }
  } catch {
    return null;
  }
  return null;
}

async function run() {
  console.log(`Checking Open Food Facts for ${SEED_PRODUCTS.length} catalog products...`);
  const results: OffResult[] = [];

  for (const p of SEED_PRODUCTS) {
    let offProd = null;
    let foundByBarcode = false;
    let foundByName = false;

    if (p.primaryEan) {
      offProd = await fetchFromOffByBarcode(p.primaryEan);
      if (offProd) foundByBarcode = true;
    }

    if (!offProd) {
      offProd = await searchOffByBrandOrName(p.brand, p.canonicalName);
      if (offProd) foundByName = true;
    }

    const img = offProd?.image_front_url || offProd?.image_url;
    results.push({
      slug: p.slug,
      name: p.canonicalName,
      ean: p.primaryEan,
      foundByBarcode,
      foundByName,
      imageUrl: img,
      offProductName: offProd?.product_name || offProd?.product_name_sk,
      offBrand: offProd?.brands
    });

    console.log(`[${foundByBarcode ? 'BARCODE' : foundByName ? 'NAME' : 'NOT FOUND'}] ${p.canonicalName} (${p.brand ?? 'No brand'}) -> ${img ? 'IMG: ' + img.substring(0, 50) + '...' : 'NO IMAGE'}`);
    // gentle rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  const withImages = results.filter(r => r.imageUrl);
  console.log(`\nSummary: ${withImages.length}/${SEED_PRODUCTS.length} matched real product photographs on Open Food Facts.`);
}

run();
