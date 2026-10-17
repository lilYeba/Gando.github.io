import sqlite3
import glob
import re
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('data/pricetracker.sqlite')
c = conn.cursor()

c.execute("SELECT product_id, image_url FROM product_image_registry")
reg_images = dict(c.fetchall())

cat_files = sorted(glob.glob('src/lib/db/catalog/categories-*.ts'))

total_updated = 0

for fpath in cat_files:
    with open(fpath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    new_lines = []
    current_pid = None
    file_updates = 0
    
    for line in lines:
        # Detect product ID
        m_id = re.search(r"^\s*id:\s*'(prod-[^']+)'", line)
        if m_id:
            current_pid = m_id.group(1)
            new_lines.append(line)
            continue
            
        # Detect product-level imageUrl (indentation 4 spaces)
        if current_pid and re.match(r"^\s{4}imageUrl:", line):
            target_img = reg_images.get(current_pid)
            if target_img:
                new_lines.append(f"    imageUrl: '{target_img}',\n")
            else:
                new_lines.append(f"    imageUrl: null,\n")
            file_updates += 1
            current_pid = None # reset until next product id
            continue
            
        # Reset current_pid if we reach offers array
        if current_pid and 'offers:' in line:
            current_pid = None
            
        new_lines.append(line)
        
    with open(fpath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print(f"Updated {fpath}: {file_updates} products updated.")
    total_updated += file_updates

print(f"\nTotal products updated across all catalog files: {total_updated}")
