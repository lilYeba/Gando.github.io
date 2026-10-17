import urllib.request
import time
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PriceTrackerSK/1.0'
}

with open('data/all-known-urls.txt', encoding='utf-8') as f:
    urls = [line.strip() for line in f if line.strip().startswith('http')]

print(f"Testing {len(urls)} URLs...")

working_urls = []

for idx, url in enumerate(urls):
    # Only test image URLs
    if not any(ext in url for ext in ['.jpg', '.jpeg', '.png', '.webp']):
        continue
    
    try:
        req = urllib.request.Request(url, headers=headers, method='HEAD')
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status in (200, 304):
                working_urls.append(url)
                print(f"[OK] {url}")
    except Exception:
        try:
            get_req = urllib.request.Request(url, headers={**headers, 'Range': 'bytes=0-512'})
            with urllib.request.urlopen(get_req, timeout=4) as resp:
                if resp.status in (200, 206, 304):
                    working_urls.append(url)
                    print(f"[OK] {url}")
        except Exception:
            pass
    
    time.sleep(0.03)

print(f"\nTotal verified working URLs: {len(working_urls)}")
with open('data/verified-working-urls.json', 'w', encoding='utf-8') as f:
    json.dump(working_urls, f, indent=2)
