import urllib.request
import json

endpoints = [
    'http://localhost:3000/',
    'http://localhost:3000/katalog',
    'http://localhost:3000/porovnanie',
    'http://localhost:3000/akcie',
    'http://localhost:3000/api/products?limit=5',
    'http://localhost:3000/api/offers?limit=5',
    'http://localhost:3000/api/preferences'
]

print("Testing Price Tracker SK live endpoints:")
for url in endpoints:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'PriceTrackerVerifier/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            status = resp.status
            size = len(resp.read())
            print(f"[OK] {url} -> HTTP {status} ({size} bytes)")
    except Exception as e:
        print(f"[ERROR] {url} -> {e}")
