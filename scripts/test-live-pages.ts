import http from 'node:http';

const urls = [
  'http://localhost:3000/',
  'http://localhost:3000/katalog',
  'http://localhost:3000/porovnanie',
  'http://localhost:3000/akcie',
  'http://localhost:3000/produkt/kofola-original-nulka-1-5l-pet',
  'http://localhost:3000/produkt/rajo-tradicny-tvaroh-jemny-hrudkovity-250g',
  'http://localhost:3000/produkt/tami-tatranske-maslo-82-250g',
  'http://localhost:3000/api/products',
  'http://localhost:3000/api/offers',
];

async function checkUrl(url: string): Promise<{ url: string; status: number; ok: boolean }> {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ url, status: res.statusCode || 0, ok: (res.statusCode || 0) === 200 });
    }).on('error', (err) => {
      resolve({ url, status: 0, ok: false });
    });
  });
}

async function run() {
  console.log('Testing live production endpoints:');
  for (const u of urls) {
    const res = await checkUrl(u);
    console.log(`  ${res.ok ? '✓' : '✗'} [${res.status}] ${res.url}`);
  }
}

run();
