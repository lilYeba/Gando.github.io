import shutil
import os
import json

with open('data/verified-downloaded-registry.json', encoding='utf-8') as f:
    dl = json.load(f)

alias_map = {
    'prod-rajec-nesytena-1-5l': 'prod-rajec-nesytena-voda-15l',
    'prod-rajec-jemne-syt-15l': 'prod-rajec-jemne-sytena-15l',
    'prod-slovakia-chips-solene-100g': 'prod-slovakia-chips-solene-130g',
    'prod-slovakia-chips-slaninove-100g': 'prod-slovakia-chips-slanina-130g',
}

out_dir = os.path.join('public', 'images', 'products')

for old_id, new_id in alias_map.items():
    if old_id in dl:
        old_info = dl[old_id]
        old_file = os.path.join(out_dir, os.path.basename(old_info['localPath']))
        ext = os.path.splitext(old_file)[1]
        new_file = os.path.join(out_dir, f"{new_id}{ext}")
        if os.path.exists(old_file):
            shutil.copyfile(old_file, new_file)
            dl[new_id] = {
                'localPath': f"/images/products/{new_id}{ext}",
                'originalUrl': old_info['originalUrl'],
                'source': old_info['source'],
                'attribution': old_info['attribution'],
                'sizeBytes': os.path.getsize(new_file)
            }
            print(f"Copied {old_id} -> {new_id} ({new_file})")

with open('data/verified-downloaded-registry.json', 'w', encoding='utf-8') as f:
    json.dump(dl, f, indent=2)

print(f"Updated verified downloaded registry with {len(dl)} items.")
