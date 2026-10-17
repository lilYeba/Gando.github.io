import urllib.request
import json
import time

headers = {
    'User-Agent': 'PriceTrackerSlovakia - Android/Web - Version 1.0 - www.pricetracker.sk'
}

test_queries = [
    '8586008301124', # Mecom sunka
    '8586005112013', # Tauris spisske parky
    '8586000410114', # Ryba zilina treska
    '7622210404015', # Milka Alpine Milk
    '8586000000000', # dummy
    'Nutella Ferrero 350g',
    'Horalky Sedita 50g',
    'Kofola Original 2l',
    'Heineken 500ml',
    'Pilsner Urquell 500ml',
    'Jar Sensitive 900ml',
    'Ariel Allin1 Pods',
    'Babičkina voľba hladká',
    'Raciol repkový olej',
]

print("Testing Open Food Facts Search API:")
for q in test_queries:
    if q.isdigit():
        url = f"https://world.openfoodfacts.org/api/v2/product/{q}.json?fields=code,product_name,brands,image_front_url,image_url"
    else:
        encoded_q = urllib.parse.quote(q)
        url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={encoded_q}&search_simple=1&action=process&json=1&page_size=2&fields=code,product_name,brands,image_front_url,image_url"
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            if q.isdigit():
                p = data.get('product')
                if p and p.get('image_front_url'):
                    print(f"[FOUND EAN] {q}: {p.get('image_front_url')}")
                else:
                    print(f"[NOT FOUND EAN] {q}")
            else:
                prods = data.get('products', [])
                found_img = None
                for pr in prods:
                    if pr.get('image_front_url'):
                        found_img = pr.get('image_front_url')
                        break
                if found_img:
                    print(f"[FOUND SEARCH] {q} -> {found_img}")
                else:
                    print(f"[NOT FOUND SEARCH] {q}")
    except Exception as e:
        print(f"[ERROR] {q}: {e}")
    time.sleep(1.2)
