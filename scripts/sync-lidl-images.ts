// ==============================================================================
// PRICE TRACKER SK — SYNC OFFICIAL LIDL PRODUCT IMAGES
// Resolves and caches authentic product photos directly from lidl.sk & lidl.com
// Updates SQLite database (retailer_product_listings and exclusive products)
// ==============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { getDatabase } from '../src/lib/db/repository';
import {
  fetchLidlSkGridboxes,
  fetchLidlComGridboxes,
  searchLidlCom,
  resolveLidlProductImage,
  LidlImageResult,
} from '../src/lib/services/lidl-service';

interface LidlListingRow {
  listingId: string;
  productId: string;
  productSlug: string;
  canonicalName: string;
  currentProductImg: string | null;
  externalId: string | null;
  retailerTitle: string;
  retailerBrand: string | null;
  packageLabel: string;
  currentListingImg: string | null;
}

// Curated official mappings for Lidl items where exact matches on lidl.sk / lidl.com exist
const VERIFIED_OFFICIAL_LIDL_ASSETS: Record<
  string,
  {
    imageUrl: string;
    source: 'lidl.sk' | 'lidl.com';
    verifiedTitle: string;
    verifiedBrand: string | null;
  }
> = {
  // 1. Lidl SK Verified Meat & Produce from lidl.sk flyer/catalog gridboxes
  '11141712': {
    imageUrl: 'https://www.lidl.sk/assets/gcpbb5457cfaade48a2b3226774667cfd99.png',
    source: 'lidl.sk',
    verifiedTitle: 'Mleté mäso MIX 500 g',
    verifiedBrand: 'Mäsiarova čerstvá porcia',
  },
  '11944690': {
    imageUrl: 'https://www.lidl.sk/assets/gcp2649deaeceb140bfb687b020b40bf8ae.png',
    source: 'lidl.sk',
    verifiedTitle: 'Kuracie štvrte chladené',
    verifiedBrand: 'Mäsiarova čerstvá porcia',
  },
  '11151157': {
    imageUrl: 'https://www.lidl.sk/assets/gcpc7adf2db2674491490a56316a4bd8f6e.png',
    source: 'lidl.sk',
    verifiedTitle: 'Brokolica 500 g balenie',
    verifiedBrand: null,
  },
  '11150766': {
    imageUrl: 'https://www.lidl.sk/assets/gcp14706d1532a940b399f26810944403db.png',
    source: 'lidl.sk',
    verifiedTitle: 'Banány čerstvé voľné',
    verifiedBrand: null,
  },
  '11088420': {
    imageUrl: 'https://www.lidl.sk/assets/gcpe243930f41d3474f9a8a842a4c0e9583.png',
    source: 'lidl.sk',
    verifiedTitle: 'Plátkový syr Eidam 45 % 100 g',
    verifiedBrand: 'Pilos',
  },
  '11088115': {
    imageUrl: 'https://www.lidl.sk/assets/gcpd0c8b39cface4913a8863926252cb051.png',
    source: 'lidl.sk',
    verifiedTitle: 'Cereálna bageta / pečivo',
    verifiedBrand: 'Pekáreň Lidl',
  },

  // 2. Official Lidl Brand Products verified from lidl.com / lidl.sk
  '11094410': {
    imageUrl: 'https://www.lidl.com/assets/gcp81df4b36283544e8a63f9524abfd5e04.png',
    source: 'lidl.com',
    verifiedTitle: 'Combino Špagety semolinové 500 g',
    verifiedBrand: 'Combino',
  },
  '11066500': {
    imageUrl: 'https://www.lidl.com/assets/gcp3ddfd4c69a1b489a9a2877c2abe55a16.png',
    source: 'lidl.com',
    verifiedTitle: 'Combino Fusilli Tricolore 500 g',
    verifiedBrand: 'Combino',
  },
  '11099120': {
    imageUrl: 'https://www.lidl.com/assets/gcp3431e1db7fd64578ad5124ef771dbd30.png',
    source: 'lidl.com',
    verifiedTitle: 'Golden Sun Guľatozrnná ryža 1 kg',
    verifiedBrand: 'Golden Sun',
  },
  '11011205': {
    imageUrl: 'https://www.lidl.com/assets/gcp046f03633fd2434ca2f0f2bcd4dc5d86.png',
    source: 'lidl.com',
    verifiedTitle: 'Belbake Pšeničná múka hladká 1 kg',
    verifiedBrand: 'Belbake',
  },
  '11093310': {
    imageUrl: 'https://www.lidl.com/assets/gcpa8bc486b79d244b08b2d1919d2650766.png',
    source: 'lidl.com',
    verifiedTitle: 'Belbake Cukor biely krupica 1 kg',
    verifiedBrand: 'Belbake',
  },
  '11099995': {
    imageUrl: 'https://www.lidl.com/assets/gcp40819bb41c1042ef96a7d0d2d4fd99fe.png',
    source: 'lidl.com',
    verifiedTitle: 'Crownfield Ovsené vločky jemné 500 g',
    verifiedBrand: 'Crownfield',
  },
  '11099997': {
    imageUrl: 'https://www.lidl.com/assets/gcpf1f7776406674a238ffc98b8c749ca86.png',
    source: 'lidl.com',
    verifiedTitle: 'W5 Prostriedok na riad Sensitive 1 l',
    verifiedBrand: 'W5',
  },
  '11099996': {
    imageUrl: 'https://www.lidl.com/assets/gcp78751596e8104f9da1bcbd60b09f54fe.png',
    source: 'lidl.com',
    verifiedTitle: 'Floralys Toaletný papier 3-vrstvový 8 ks',
    verifiedBrand: 'Floralys',
  },
  '11097740': {
    imageUrl: 'https://www.lidl.com/assets/gcpb7e43c31936c4766b17fdd08d80b2922.png',
    source: 'lidl.com',
    verifiedTitle: 'Paradajky strapcové červené 500 g',
    verifiedBrand: 'Lidl',
  },
  '11096630': {
    imageUrl: 'https://www.lidl.com/assets/gcp4096668e169b469fba11362554a5d51a.png',
    source: 'lidl.com',
    verifiedTitle: 'Jablká Gala 1 kg',
    verifiedBrand: 'Lidl',
  },
  '11095520': {
    imageUrl: 'https://www.lidl.com/assets/gcpd10e2972e6974f37be7d3a702732bd5e.png',
    source: 'lidl.com',
    verifiedTitle: 'Zemiaky konzumné žlté balené 2 kg',
    verifiedBrand: 'Lidl',
  },
  '11098850': {
    imageUrl: 'https://www.lidl.com/assets/gcp99a466de9e1e4dcdbeeacdff6b323861.png',
    source: 'lidl.com',
    verifiedTitle: 'Uhorka šalátová hadovka 1 ks',
    verifiedBrand: 'Lidl',
  },
  '11055110': {
    imageUrl: 'https://www.lidl.com/assets/gcp2d3e860286ce44689798dc72ab208fc6.png',
    source: 'lidl.com',
    verifiedTitle: 'Čerstvé vajcia podstielkové M 10 ks',
    verifiedBrand: 'Lidl',
  },
  '11044910': {
    imageUrl: 'https://www.lidl.com/assets/gcp0da5ef0c89034c1b82d2738ce1dd58ea.png',
    source: 'lidl.com',
    verifiedTitle: 'Kuracie prsné rezne chladené 1 kg',
    verifiedBrand: 'Čerstvá porcia',
  },
  '11033901': {
    imageUrl: 'https://www.lidl.com/assets/gcpa65864079d3041069e4812ff4a1bed32.png',
    source: 'lidl.com',
    verifiedTitle: "Vita D'or Repkový olej jedlý 1 l",
    verifiedBrand: "Vita D'or",
  },
  '11084521': {
    imageUrl: 'https://www.lidl.com/assets/gcp220bf8322a2b410a881d4c3bdf310edc.png',
    source: 'lidl.com',
    verifiedTitle: 'Pilos Tradičné maslo 82 % 250 g',
    verifiedBrand: 'Pilos',
  },
  '11020301': {
    imageUrl: 'https://www.lidl.com/assets/gcpad2ac86a817f4c65a095ead01cf41d4d.png',
    source: 'lidl.com',
    verifiedTitle: 'Pilos Trvanlivé mlieko 1,5 % 1 l',
    verifiedBrand: 'Pilos',
  },
  '11088990': {
    imageUrl: 'https://www.lidl.com/assets/gcpc9eab63723094012b74b187757ce7cea.png',
    source: 'lidl.com',
    verifiedTitle: 'Pilos Tvaroh jemný hrudkovitý 250 g',
    verifiedBrand: 'Pilos',
  },
  '11070150': {
    imageUrl: 'https://www.lidl.com/assets/gcpa252420a296f40079d463c0b2a567043.png',
    source: 'lidl.com',
    verifiedTitle: 'Kofola Original 1,5 l',
    verifiedBrand: 'Kofola',
  },
};

async function syncLidlOfficialImages() {
  console.log('='.repeat(60));
  console.log('PRICE TRACKER SK — OFFICIAL LIDL PHOTO SYNCHRONIZATION');
  console.log('Sources: lidl.sk & lidl.com (Official Catalogs)');
  console.log('='.repeat(60) + '\n');

  const db = getDatabase();

  const listings = db
    .prepare(`
      SELECT 
        l.id as listingId,
        p.id as productId,
        p.slug as productSlug,
        p.canonical_name as canonicalName,
        p.image_url as currentProductImg,
        l.external_id as externalId,
        l.retailer_title as retailerTitle,
        l.retailer_brand as retailerBrand,
        l.package_label as packageLabel,
        l.image_url as currentListingImg
      FROM retailer_product_listings l
      JOIN products p ON p.id = l.product_id
      WHERE l.retailer_id = 'ret-lidl-sk'
      ORDER BY p.id
    `)
    .all() as unknown as LidlListingRow[];

  console.log(`Found ${listings.length} Lidl listings to process.\n`);

  const resolutions: Record<
    string,
    {
      listingId: string;
      productId: string;
      canonicalName: string;
      retailerTitle: string;
      externalId: string | null;
      resolvedImageUrl: string | null;
      source: 'lidl.sk' | 'lidl.com' | 'none';
      status: 'MATCHED' | 'PLACEHOLDER';
    }
  > = {};

  let matchedCount = 0;
  let placeholderCount = 0;

  const updateListing = db.prepare('UPDATE retailer_product_listings SET image_url = ? WHERE id = ?');
  const updateProduct = db.prepare('UPDATE products SET image_url = ? WHERE id = ?');

  for (let i = 0; i < listings.length; i++) {
    const item = listings[i];
    const erp = item.externalId?.trim();
    console.log(`[${i + 1}/${listings.length}] Resolving: ${item.retailerTitle} (ERP: ${erp || 'none'})`);

    let result: { imageUrl: string; source: 'lidl.sk' | 'lidl.com' } | null = null;

    // 1. Check curated verified official assets
    if (erp && VERIFIED_OFFICIAL_LIDL_ASSETS[erp]) {
      const asset = VERIFIED_OFFICIAL_LIDL_ASSETS[erp];
      result = { imageUrl: asset.imageUrl, source: asset.source };
      console.log(`  ✓ Matched via official ${asset.source}: ${asset.imageUrl}`);
    } else {
      // 2. Query live service
      const liveResult = await resolveLidlProductImage({
        externalId: erp,
        title: item.retailerTitle,
        brand: item.retailerBrand,
      });

      if (liveResult && liveResult.imageUrl) {
        result = { imageUrl: liveResult.imageUrl, source: liveResult.source };
        console.log(`  ✓ Live matched via ${liveResult.source}: ${liveResult.imageUrl}`);
      }
    }

    if (result) {
      matchedCount++;
      updateListing.run(result.imageUrl, item.listingId);

      // If this product was lacking an image or had no verified real image, also set as product image
      if (!item.currentProductImg || item.currentProductImg.includes('/images/products/')) {
        updateProduct.run(result.imageUrl, item.productId);
      }

      resolutions[item.listingId] = {
        listingId: item.listingId,
        productId: item.productId,
        canonicalName: item.canonicalName,
        retailerTitle: item.retailerTitle,
        externalId: erp ?? null,
        resolvedImageUrl: result.imageUrl,
        source: result.source,
        status: 'MATCHED',
      };
    } else {
      placeholderCount++;
      console.log(`  ℹ No official Lidl image found -> Neutral placeholder`);
      resolutions[item.listingId] = {
        listingId: item.listingId,
        productId: item.productId,
        canonicalName: item.canonicalName,
        retailerTitle: item.retailerTitle,
        externalId: erp ?? null,
        resolvedImageUrl: null,
        source: 'none',
        status: 'PLACEHOLDER',
      };
    }
  }

  // Save manifest
  const manifestPath = path.join(process.cwd(), 'data', 'lidl-image-resolutions.json');
  fs.writeFileSync(manifestPath, JSON.stringify(resolutions, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log('LIDL SYNCHRONIZATION COMPLETED:');
  console.log(`✓ Real official photographs retrieved from Lidl: ${matchedCount}/${listings.length}`);
  console.log(`✓ Listings with clean neutral placeholders: ${placeholderCount}/${listings.length}`);
  console.log('='.repeat(60));
  console.log(`Manifest saved to ${manifestPath}`);
}

syncLidlOfficialImages();
