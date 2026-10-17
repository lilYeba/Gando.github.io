import json
import sqlite3

with open('data/verified-working-urls.json', encoding='utf-8') as f:
    working_urls = json.load(f)

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()

c.execute("SELECT id, canonical_name, brand, image_url FROM products")
products = c.fetchall()

print(f"Total working URLs: {len(working_urls)}")
for u in working_urls:
    matched = [p[0] for p in products if p[3] == u]
    print(f"{u} -> Matched: {matched}")
