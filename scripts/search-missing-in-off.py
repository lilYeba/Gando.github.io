import sqlite3
import urllib.request
import json
import time

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()

c.execute('''
    SELECT p.id, p.canonical_name, p.brand,
           (SELECT identifier_value FROM product_identifiers WHERE product_id = p.id AND identifier_type = 'EAN13' LIMIT 1) as ean
    FROM products p 
    WHERE p.image_url IS NULL OR p.image_url = ''
''')
rows = c.fetchall()

headers = {'User-Agent': 'PriceTrackerSlovakia/1.0 (contact@pricetracker.sk)'}

found = {}
for pid, name, brand, ean in rows:
    if not ean:
        continue
    url = f"https://world.openfoodfacts.org/api/v2/product/{ean}.json"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode())
            if data.get('status') == 1 and data.get('product'):
                prod = data['product']
                img = prod.get('image_front_url') or prod.get('image_url')
                off_name = prod.get('product_name') or prod.get('product_name_sk') or ''
                if img:
                    found[pid] = {
                        'ean': ean,
                        'name': name,
                        'off_name': off_name,
                        'imageUrl': img
                    }
                    print(f"FOUND for {pid} ({ean}): {img}")
                else:
                    print(f"No image in OFF for {pid} ({ean})")
            else:
                print(f"Not found in OFF for {pid} ({ean})")
    except Exception as e:
        print(f"Error fetching {ean}: {e}")
    time.sleep(0.3)

print(f"\nTotal new images found from Open Food Facts: {len(found)}")
with open('data/newly-found-off-images.json', 'w', encoding='utf-8') as f:
    json.dump(found, f, indent=2, ensure_ascii=False)
