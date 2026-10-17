import glob
import re

total = 0
for f in sorted(glob.glob("src/lib/db/catalog/*.ts")):
    content = open(f, encoding="utf-8").read()
    count = len(re.findall(r"\bid:\s*['\"]prod-", content))
    print(f"{f}: {count} products")
    total += count

print("---------------------------------")
print(f"TOTAL CATALOG PRODUCTS: {total}")
