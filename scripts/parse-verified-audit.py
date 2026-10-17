import re
import json

with open('scripts/apply-verified-image-audit.ts', encoding='utf-8') as f:
    txt = f.read()

# Parse canonicalAudits
pattern = r"id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*brand:\s*([^,]+),\s*packageSize:\s*'([^']+)',\s*verifiedImageUrl:\s*([^,]+),\s*source:\s*'([^']+)',\s*status:\s*'([^']+)',\s*notes:\s*'([^']+)'"
matches = re.findall(pattern, txt)
print(f"Total entries in apply-verified-image-audit.ts: {len(matches)}")

verified_map = {}
for m in matches:
    pid = m[0]
    name = m[1]
    img = m[4].strip().strip("'").strip('"')
    if img == 'null':
        img = None
    source = m[5]
    status = m[6]
    notes = m[7]
    verified_map[pid] = {
        'name': name,
        'imageUrl': img,
        'source': source,
        'status': status,
        'notes': notes
    }

print(f"Entries with real imageUrl: {sum(1 for v in verified_map.values() if v['imageUrl'])}")
for pid, v in list(verified_map.items())[:15]:
    if v['imageUrl']:
        print(f"  {pid}: {v['imageUrl']}")
