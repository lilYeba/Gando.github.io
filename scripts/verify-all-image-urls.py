import sqlite3
import urllib.request
import time
from collections import defaultdict
import json

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()

c.execute('''
    SELECT id, canonical_name, brand, package_quantity, package_unit, image_url
    FROM products
    ORDER BY id
''')
products = c.fetchall()

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PriceTrackerSK/1.0'
}

results = {
    'total': len(products),
    'with_url': 0,
    'missing_url': 0,
    'accessible': 0,
    'broken': 0,
    'duplicates': 0,
    'details': []
}

url_to_products = defaultdict(list)
for p in products:
    pid, name, brand, qty, unit, url = p
    if url:
        url_to_products[url].append(pid)

print(f"Checking {len(products)} products...")

# Check duplicate assignments first
for url, pids in url_to_products.items():
    if len(pids) > 1:
        print(f"WARNING: Image URL shared across different products: {pids} -> {url}")
        results['duplicates'] += 1

unique_urls = list(url_to_products.keys())
print(f"Unique URLs to test: {len(unique_urls)}")

tested_urls = {}

for idx, url in enumerate(unique_urls):
    if not url.startswith('http'):
        tested_urls[url] = {'status': 'INVALID_URL', 'code': 0}
        continue
    
    # Check url accessibility
    try:
        req = urllib.request.Request(url, headers=headers, method='HEAD')
        with urllib.request.urlopen(req, timeout=5) as resp:
            code = resp.status
            tested_urls[url] = {'status': 'OK', 'code': code}
    except Exception as e_head:
        # Fallback to GET range 0-512 in case server doesn't support HEAD
        try:
            get_req = urllib.request.Request(url, headers={**headers, 'Range': 'bytes=0-512'})
            with urllib.request.urlopen(get_req, timeout=5) as resp:
                code = resp.status
                tested_urls[url] = {'status': 'OK', 'code': code}
        except Exception as e_get:
            tested_urls[url] = {'status': 'FAILED', 'error': str(e_get)}
    
    if (idx + 1) % 50 == 0:
        print(f"Checked {idx + 1}/{len(unique_urls)} URLs...")
    time.sleep(0.05)

for p in products:
    pid, name, brand, qty, unit, url = p
    if not url:
        results['missing_url'] += 1
        results['details'].append({
            'productId': pid,
            'name': name,
            'status': 'MISSING_IMAGE',
            'imageUrl': None
        })
    else:
        results['with_url'] += 1
        t_res = tested_urls.get(url, {})
        if t_res.get('status') == 'OK':
            results['accessible'] += 1
            results['details'].append({
                'productId': pid,
                'name': name,
                'status': 'ACCESSIBLE',
                'imageUrl': url
            })
        else:
            results['broken'] += 1
            results['details'].append({
                'productId': pid,
                'name': name,
                'status': 'BROKEN_URL',
                'imageUrl': url,
                'error': t_res.get('error')
            })

print("\n--- RESULTS ---")
print(f"Total Products: {results['total']}")
print(f"With Image URL: {results['with_url']}")
print(f"Missing Image (Placeholders): {results['missing_url']}")
print(f"Accessible URLs: {results['accessible']}")
print(f"Broken URLs: {results['broken']}")
print(f"Duplicate assignments: {results['duplicates']}")

with open('data/image-url-audit.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
