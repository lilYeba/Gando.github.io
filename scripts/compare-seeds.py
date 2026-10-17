import re

old_content = open("src/lib/db/seed-data.ts", encoding="utf-8").read()
old_ids = set(re.findall(r"\bid:\s*['\"]([^'\"]+)['\"]", old_content))

new_content = open("src/lib/db/catalog/index.ts", encoding="utf-8").read()

import glob
new_ids = set()
for f in glob.glob("src/lib/db/catalog/categories-*.ts"):
    new_ids.update(re.findall(r"\bid:\s*['\"]([^'\"]+)['\"]", open(f, encoding="utf-8").read()))

common = old_ids.intersection(new_ids)
print(f"Old seed items: {len(old_ids)}")
print(f"New catalog items: {len(new_ids)}")
print(f"Common items: {len(common)}")
