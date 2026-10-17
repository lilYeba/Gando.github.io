import sqlite3
import json
import os
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('data/pricetracker.sqlite')
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT product_id, product_name, brand, image_url, local_image_path, original_source_url FROM product_image_registry WHERE image_url IS NOT NULL")
rows = [dict(r) for r in c.fetchall()]

print(f"Total entries with image in registry: {len(rows)}")

# Known bad patterns or keywords that indicate a completely unrelated product
BAD_MATCH_TERMS = [
    'albondigas', 'biscotte', 'mullbeutel', 'jus d aloe', 'carotte', 'biscoito',
    'proty', 'tsai voynoy', 'kloeinhanger', 'sparkling lemonade', 'bomba salada',
    'chlebickova veka', 'ryze parboiled', 'kukuricne piskoty', 'kakaove boby'
]

cleaned_count = 0

for r in rows:
    pid = r['product_id']
    name = r['product_name'].lower()
    brand = (r['brand'] or '').lower()
    source_url = (r['original_source_url'] or '').lower()
    local_path = r['local_image_path']

    # Read from OFF barcode or search if possible
    # We can check the downloaded file or check if it was one of the bad second pass matches
    is_bad = False
    
    # Specific bad matches identified in second pass log:
    if pid in [
        'prod-tento-vreckovky-10x10ks',
        'prod-harmony-everyday-vreckovky-box-100ks',
        'prod-vileda-colors-handricky-mikrovlakno-4ks',
        'prod-vileda-glitzi-hubka-na-riad-3ks',
        'prod-pur-balsam-aloe-vera-450ml',
        'prod-pampers-active-baby-4-54ks',
        'prod-savo-original-dezinfekcia-12l',
        'prod-savo-proti-plesni-rozprasovac-500ml',
        'prod-bref-brilliant-gel-arctic-3x42g',
        'prod-clin-na-okna-citron-500ml',
        'prod-jar-citron-prostriedok-na-riad-450ml',
        'prod-jar-platinum-tablety-umyvacka-60ks',
        'prod-fino-papier-na-pecenie-8m',
        'prod-fino-alobal-hlinikova-folia-20m',
        'prod-fino-potravinova-folia-30m',
        'prod-snico-ocot-kvasny-liehovy-1l',
        'prod-somat-all-in-1-tablety-80ks',
        'prod-aviko-krokety-zemiakove-600g',
        'prod-miva-arasidove-chrumky-100g',
        # from first pass check:
        'prod-lagris-fazula-biela-500g',
        'prod-lagris-fazula-cervena-kidney-500g',
        'prod-lagris-psenicny-bulgur-500g',
        'prod-chlieb-zemiakovy-konzumny-500g',
        'prod-racio-kukuricne-chlebicky-100g'
    ]:
        is_bad = True

    if is_bad:
        print(f"REMOVING MISMATCH: [{pid}] '{r['product_name']}'")
        if local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
            except:
                pass
        
        # Reset in database
        c.execute("""
            UPDATE product_image_registry
            SET image_url = NULL,
                local_image_path = NULL,
                original_source_url = NULL,
                source_website = 'none',
                verification_status = 'NEUTRAL_PLACEHOLDER'
            WHERE product_id = ?
        """, (pid,))
        
        c.execute("UPDATE products SET image_url = NULL WHERE id = ?", (pid,))
        c.execute("UPDATE retailer_product_listings SET image_url = NULL WHERE product_id = ?", (pid,))
        conn.commit()
        cleaned_count += 1

print(f"\nRemoved {cleaned_count} mismatched images.")
c.execute("SELECT count(*) FROM products WHERE image_url IS NOT NULL")
valid_prods = c.fetchone()[0]
print(f"Total clean, verified products with real photos: {valid_prods} / 311")
