import glob
import re
from collections import Counter

ids = []
slugs = []
eans = []

for f in sorted(glob.glob("src/lib/db/catalog/categories-*.ts")):
    content = open(f, encoding="utf-8").read()
    found_ids = re.findall(r"\bid:\s*['\"]([^'\"]+)['\"]", content)
    found_slugs = re.findall(r"\bslug:\s*['\"]([^'\"]+)['\"]", content)
    found_eans = re.findall(r"\bprimaryEan:\s*['\"]([^'\"]+)['\"]", content)
    ids.extend(found_ids)
    slugs.extend(found_slugs)
    eans.extend(found_eans)

print(f"Total IDs: {len(ids)}, Unique: {len(set(ids))}")
print(f"Total Slugs: {len(slugs)}, Unique: {len(set(slugs))}")
print(f"Total EANs: {len(eans)}, Unique: {len(set(eans))}")

id_dups = [item for item, count in Counter(ids).items() if count > 1]
slug_dups = [item for item, count in Counter(slugs).items() if count > 1]
ean_dups = [item for item, count in Counter(eans).items() if count > 1]

if id_dups:
    print(f"Duplicate IDs: {id_dups}")
if slug_dups:
    print(f"Duplicate Slugs: {slug_dups}")
if ean_dups:
    print(f"Duplicate EANs: {ean_dups}")

if not id_dups and not slug_dups and not ean_dups:
    print("ALL IDs, SLUGS, and EANs ARE 100% UNIQUE!")
