import https from 'node:https';

interface SearchItem {
  id: string;
  query: string;
  barcode?: string;
}

const itemsToSearch: SearchItem[] = [
  { id: 'prod-emco-vlocky-500g', query: 'Emco ovesne vlocky jemne', barcode: '8594004490104' },
  { id: 'prod-hladka-muka-1kg', query: 'Babickina volba hladka', barcode: '8594001460117' },
  { id: 'prod-jar-sensitive-900ml', query: 'Jar Sensitive', barcode: '8001090206890' },
  { id: 'prod-korunny-cukor-1kg', query: 'Korunny cukor krupica', barcode: '8586000210011' },
  { id: 'prod-panzani-cestoviny-500g', query: 'Panzani Torti Tricolore', barcode: '3038350023605' },
  { id: 'prod-repkovy-olej-1l', query: 'Venusz repkovy olej', barcode: '5998817111015' },
  { id: 'prod-tauris-spisske-parky-200g', query: 'Tauris Spisske parky', barcode: '8586005112013' },
  { id: 'prod-tento-ellegance-8ks', query: 'Tento Ellegance toaletny', barcode: '8584014800201' },
];

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'PriceTrackerSK/1.0 (info@pricetracker.sk)' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function testUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

async function run() {
  for (const item of itemsToSearch) {
    console.log(`\n--- Searching for [${item.id}]: "${item.query}" (barcode: ${item.barcode}) ---`);
    if (item.barcode) {
      const barcodeData = await fetchJson(`https://world.openfoodfacts.org/api/v2/product/${item.barcode}.json?fields=product_name,image_front_url,selected_images`);
      if (barcodeData?.status === 1 && barcodeData.product?.image_front_url) {
        const ok = await testUrl(barcodeData.product.image_front_url);
        console.log(`  Found by barcode: ${barcodeData.product.product_name}`);
        console.log(`  URL (${ok ? 'HTTP OK' : 'FAILED'}): ${barcodeData.product.image_front_url}`);
        continue;
      }
    }

    const searchData = await fetchJson(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(item.query)}&search_simple=1&action=process&json=1&page_size=5&fields=code,product_name,brands,image_front_url`);
    if (searchData?.products?.length > 0) {
      for (const p of searchData.products) {
        if (p.image_front_url) {
          const ok = await testUrl(p.image_front_url);
          console.log(`  Candidate: [${p.code}] ${p.brands} - ${p.product_name}`);
          console.log(`  URL (${ok ? 'HTTP OK' : 'FAILED'}): ${p.image_front_url}`);
        }
      }
    } else {
      console.log('  No candidates found in OFF');
    }
  }
}

run();
