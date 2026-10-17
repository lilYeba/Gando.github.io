import json
import sqlite3

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()
c.execute("SELECT id, canonical_name FROM products")
db_products = dict(c.fetchall())

with open('data/verified-downloaded-registry.json', encoding='utf-8') as f:
    dl = json.load(f)

print(f"Downloaded registry keys: {len(dl)}")
for pid in dl:
    if pid in db_products:
        print(f"  [MATCHED] {pid}")
    else:
        print(f"  [MISSING IN DB] {pid}")
        # Search for similar in DB
        prefix = pid.split('-')[1] if len(pid.split('-')) > 1 else pid
        for db_id in db_products:
            if prefix in db_id:
                print(f"     -> candidate: {db_id}")
