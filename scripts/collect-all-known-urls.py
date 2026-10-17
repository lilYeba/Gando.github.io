import os
import re

patterns = ['tesco.com', 'commercetools.com', 'lidl.com/assets', 'lidl.sk/assets', 'openfoodfacts.org', 'openfoodfacts.net']
found_urls = set()

for root, dirs, files in os.walk('.'):
    if any(ign in root for ign in ['node_modules', '.git', '.next', '.gemini']):
        continue
    for f in files:
        if f.endswith(('.ts', '.tsx', '.json', '.js', '.py')):
            path = os.path.join(root, f)
            try:
                with open(path, encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    for m in re.finditer(r'https?://[^\s\'\",<>]+', content):
                        url = m.group(0)
                        if any(p in url for p in patterns):
                            found_urls.add(url)
            except:
                pass

print(f"Total matched URLs found in codebase: {len(found_urls)}")
with open('data/all-known-urls.txt', 'w', encoding='utf-8') as fp:
    for u in sorted(found_urls):
        fp.write(u + '\n')
