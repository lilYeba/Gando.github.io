import sqlite3
import urllib.request
import json
import time
import os

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()

c.execute('''
    SELECT p.id, p.canonical_name, p.brand, p.package_quantity, p.package_unit,
           pi.identifier_value AS barcode
    FROM products p
    JOIN product_identifiers pi ON pi.product_id = p.id AND pi.identifier_type = 'EAN13'
    ORDER BY p.id
''')
products = c.fetchall()
print(f"Total products with EAN-13: {len(products)}")

headers = {
    'User-Agent': 'PriceTrackerSlovakia/1.0 (https://pricetracker.sk; contact@pricetracker.sk)'
}

cache_file = 'data/off-barcode-lookups.json'
lookup_cache = {}
if os.path.exists(cache_file):
    try:
        with open(cache_file, encoding='utf-8') as f:
            lookup_cache = json.load(f)
    except:
        lookup_cache = {}

found_count = 0
not_found_count = 0

for idx, (pid, name, brand, qty, unit, barcode) in enumerate(products):
    if barcode in lookup_cache:
        cached = lookup_cache[barcode]
        if cached.get('imageUrl'):
            found_count += 1
        else:
            not_found_count += 1
        continue

    url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=code,product_name,brands,image_front_url,image_url,status"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            status = data.get('status', 0)
            if status == 1 and data.get('product'):
                prod = data['product']
                img = prod.get('image_front_url') or prod.get('image_url')
                off_name = prod.get('product_name') or ''
                off_brand = prod.get('brands') or ''
                lookup_cache[barcode] = {
                    'productId': pid,
                    'barcode': barcode,
                    'name': name,
                    'offName': off_name,
                    'offBrand': off_brand,
                    'imageUrl': img,
                    'status': 'FOUND' if img else 'NO_IMAGE'
                }
                if img:
                    found_count += 1
                    print(f"[{idx+1}/{len(products)}] FOUND: {barcode} -> {name} | {img}")
                else:
                    not_found_count += 1
                    print(f"[{idx+1}/{len(products)}] NO IMAGE: {barcode} -> {name}")
            else:
                lookup_cache[barcode] = {
                    'productId': pid,
                    'barcode': barcode,
                    'name': name,
                    'imageUrl': None,
                    'status': 'NOT_FOUND'
                }
                not_found_count += 1
    except Exception as e:
        lookup_cache[barcode] = {
            'productId': pid,
            'barcode': barcode,
            'name': name,
            'imageUrl': None,
            'status': f'ERROR: {e}'
        }
        not_found_count += 1
    
    # Save cache incrementally
    if (idx + 1) % 15 == 0:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(lookup_cache, f, indent=2, ensure_ascii=False)
        print(f"Progress: {idx+1}/{len(products)} (Found: {found_count}, Missing: {not_found_count})")
    
    time.sleep(0.4)

with open(cache_file, 'w', encoding='utf-8') as f:
    json.dump(lookup_cache, f, indent=2, ensure_ascii=False)

print(f"\nFinal OFF barcode lookup summary:")
print(f"Total processed: {len(products)}")
print(f"Total with genuine photos from OFF: {found_count}")
print(f"Total without photos in OFF: {not_found_count}")
