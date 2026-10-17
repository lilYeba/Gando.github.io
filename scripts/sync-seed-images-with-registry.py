import sqlite3
import glob
import re

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()

c.execute("SELECT product_id, image_url FROM product_image_registry")
reg = dict(c.fetchall())

files = glob.glob('src/lib/db/catalog/categories-*.ts')

total_updated = 0

for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    def replace_img(match):
        pid = match.group(1)
        old_val = match.group(2)
        target_img = reg.get(pid)
        if target_img:
            return f"id: '{pid}',\n    slug:{match.group(3)}imageUrl: '{target_img}',"
        else:
            return f"id: '{pid}',\n    slug:{match.group(3)}imageUrl: null,"

    # Regex matches id, slug, ..., imageUrl
    pattern = r"id:\s*'([^']+)',\s*\n\s*slug:([^;]+?)\n\s*imageUrl:\s*([^,]+),"
    new_content, count = re.subn(pattern, replace_img, content)
    total_updated += count

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {fpath}: {count} products updated.")

print(f"Total products updated in catalog source files: {total_updated}")
