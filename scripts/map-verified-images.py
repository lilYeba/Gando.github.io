import sqlite3
import json

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()

# Load verified working URLs
with open('data/verified-working-urls.json', encoding='utf-8') as f:
    working_urls = set(json.load(f))

print(f"Total verified working URLs: {len(working_urls)}")

c.execute('''
    SELECT p.id, p.canonical_name, p.brand, p.category_slug, p.package_quantity, p.package_unit, p.image_url,
           (SELECT identifier_value FROM product_identifiers WHERE product_id = p.id AND identifier_type = 'EAN13' LIMIT 1) as barcode
    FROM products p
    ORDER BY p.id
''')
products = c.fetchall()

verified_products = []
broken_products = []
placeholder_products = []

for p in products:
    pid, name, brand, cat, qty, unit, img, barcode = p
    if not img:
        placeholder_products.append(p)
    elif img in working_urls:
        verified_products.append(p)
    else:
        broken_products.append(p)

print(f"Total products: {len(products)}")
print(f"Products with verified working images: {len(verified_products)}")
print(f"Products with broken 404 images to fix: {len(broken_products)}")
print(f"Products already with clean placeholders: {len(placeholder_products)}")

print("\nSample verified products:")
for p in verified_products[:10]:
    print(f"  {p[0]}: {p[1]} -> {p[6]}")
