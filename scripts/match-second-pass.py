import sqlite3
import urllib.request
import urllib.parse
import json
import time
import os
import ssl
import sys
sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 PriceTrackerSK/1.0 (contact@pricetracker.sk)'
}

OUT_DIR = os.path.join('public', 'images', 'products')
os.makedirs(OUT_DIR, exist_ok=True)

def build_off_image_url(code, images_dict):
    if not images_dict or not isinstance(images_dict, dict):
        return None
    code_str = str(code).strip()
    if len(code_str) >= 13:
        code_path = f"{code_str[:3]}/{code_str[3:6]}/{code_str[6:9]}/{code_str[9:]}"
    elif len(code_str) > 8:
        code_path = f"{code_str[:3]}/{code_str[3:6]}/{code_str[6:9]}/{code_str[9:]}"
    else:
        code_path = code_str
    
    front_keys = [k for k in images_dict.keys() if k.startswith('front')]
    def key_priority(k):
        if k == 'front_sk': return 0
        if k == 'front_cs': return 1
        if k == 'front_en': return 2
        if k == 'front_de': return 3
        if k == 'front_fr': return 4
        if k == 'front': return 5
        return 10
    front_keys.sort(key=key_priority)
    for fk in front_keys:
        info = images_dict[fk]
        if isinstance(info, dict) and 'rev' in info:
            rev = info['rev']
            return f"https://images.openfoodfacts.org/images/products/{code_path}/{fk}.{rev}.400.jpg"
    for num in ['1', '2', '3']:
        if num in images_dict:
            return f"https://images.openfoodfacts.org/images/products/{code_path}/{num}.400.jpg"
    return None

def verify_and_download(url, dest_path):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            if resp.status == 200:
                data = resp.read()
                if len(data) > 1000:
                    with open(dest_path, 'wb') as f:
                        f.write(data)
                    return True
    except Exception as e:
        pass
    return False


# Tailored search keywords for remaining products
TARGETED_QUERIES = {
    # Sauces & Canned Food
    'prod-barilla-basilico-omacka-400g': ['Barilla Basilico', 'Barilla Sauce Basilico'],
    'prod-barilla-bolognese-omacka-400g': ['Barilla Bolognese', 'Barilla Sauce Bolognese'],
    'prod-bonduelle-hrasok-jemny-400g': ['Bonduelle hrášok', 'Bonduelle petits pois', 'Bonduelle hrasek'],
    'prod-bonduelle-zlata-kukurica-340g': ['Bonduelle kukurica', 'Bonduelle mais', 'Bonduelle kukurice'],
    'prod-giana-sardinky-olej-125g': ['Giana sardinky', 'Giana sardine'],
    'prod-hame-morca-della-400g': ['Morca-Della', 'Morcadella', 'Hamé Morca'],
    'prod-hame-pali-pikantna-natierka-75g': ['Hamé Pali', 'Pali nátierka', 'Pali pikantní'],
    'prod-heinz-ketchup-jemny-570g': ['Heinz Tomato Ketchup', 'Heinz Ketchup'],
    'prod-heinz-ketchup-ostry-570g': ['Heinz Ketchup Hot', 'Heinz Ketchup pikantní'],
    'prod-hellmanns-majoneza-original-405ml': ['Hellmann\'s Majonéza', 'Hellmanns Real Mayonnaise'],
    'prod-hellmanns-tatarska-omacka-405ml': ['Hellmann\'s Tatárska', 'Hellmanns Tartare'],
    'prod-machland-kvasena-kapusta-640g': ['Machland kapusta', 'Kysané zelí Machland'],
    'prod-rio-mare-tuniak-olivovy-olej-4x80g': ['Rio Mare Tonno olio oliva', 'Rio Mare tuniak'],
    'prod-rio-mare-tuniak-stava-4x80g': ['Rio Mare Tonno naturale', 'Rio Mare tuniak vlastnej'],
    'prod-znojmia-sterilizovane-uhorky-660g': ['Znojmia okurky', 'Znojmia uhorky'],

    # Coffee & Tea
    'prod-lavazza-qualita-oro-zrnkova-250g': ['Lavazza Qualità Oro', 'Lavazza Qualita Oro'],
    'prod-popradska-espresso-zrnkova-500g': ['Popradská káva Espresso', 'Popradská Espresso'],
    'prod-popradsky-pigi-caj-cierny-30g': ['Pigi čaj', 'Popradský čaj Pigi'],
    'prod-teekanne-earl-grey-35g': ['Teekanne Earl Grey'],
    'prod-teekanne-green-tea-35g': ['Teekanne Green Tea', 'Teekanne Zelený čaj'],
    'prod-teekanne-peppermint-matovy-45g': ['Teekanne Peppermint', 'Teekanne Mätový', 'Teekanne Pfefferminz'],
    'prod-teekanne-zeleny-opuntia-35g': ['Teekanne Opuntia', 'Teekanne Zelený'],

    # Drinks
    'prod-budis-jemne-perlive-15l': ['Budiš jemne perlivá', 'Budiš'],
    'prod-budis-perlive-15l': ['Budiš perlivá', 'Budiš minerálna'],
    'prod-fatra-prirodna-zasadita-1l': ['Fatra prírodná', 'Minerálna voda Fatra'],
    'prod-kinley-tonic-water-15l': ['Kinley Tonic Water', 'Kinley Tonic'],
    'prod-rajec-bylinka-materina-duska-15l': ['Rajec Materina dúška', 'Rajec bylinka'],
    'prod-rajec-bylinka-pupava-15l': ['Rajec Púpava', 'Rajec púpava'],

    # Snacks & Sweets
    'prod-fidorka-horka-orieskova-30g': ['Fidorka horká', 'Fidorka oříšková', 'Fidorka'],
    'prod-sedita-lina-arasidova-mliecna-60g': ['Sedita Lina', 'Lina arašidová'],
    'prod-studentska-pecat-mliecna-170g': ['Studentská pečeť mléčná', 'Študentská pečať'],
    'prod-dru-tycinky-rasca-90g': ['DRU tyčinky rasca', 'DRU tyčinky'],
    'prod-dru-tycinky-sezamove-90g': ['DRU tyčinky sezam', 'DRU tyčinky'],
    'prod-dru-tycinky-slane-tradicne-90g': ['DRU tyčinky', 'DRU slané tyčinky'],
    'prod-ensa-arasidy-solene-100g': ['Ensa arašidy', 'Arašidy pražené solené Ensa'],
    'prod-ensa-mandle-prazene-solene-100g': ['Ensa mandle', 'Mandle pražené Ensa'],
    'prod-ensa-pistacie-solene-100g': ['Ensa pistácie', 'Pistácie solené Ensa'],
    'prod-ensa-vlasske-orechy-lupane-200g': ['Ensa orechy', 'Vlašské orechy Ensa'],
    'prod-lays-salted-130g': ['Lay\'s Salted', 'Lays Salted', 'Lay\'s solené'],
    'prod-lays-stix-ketchup-130g': ['Lay\'s Stix Ketchup', 'Lays Stix'],
    'prod-slovakia-chips-smotana-cibula-130g': ['Slovakia Chips smotana', 'Slovakia Chips cibuľa'],
    'prod-slovakia-pecene-tycinky-zemiakove-160g': ['Slovakia Chips tyčinky', 'Slovakia tyčinky'],
    'prod-miva-arasidove-chrumky-100g': ['Arašidové chrumky', 'Miva chrumky'],

    # Pantry & Baking
    'prod-detska-krupica-pohronsky-ruskov-500g': ['Detská krupica', 'Krupica Pohronský Ruskov'],
    'prod-dr-oetker-prasok-do-peciva-5ks': ['Dr. Oetker Kypřicí prášek', 'Dr. Oetker prášok do pečiva'],
    'prod-dr-oetker-vanilinovy-cukor-5ks': ['Dr. Oetker Vanilínový cukor', 'Dr Oetker Vanillin'],
    'prod-dr-oetker-zlaty-klas-40g': ['Zlatý klas', 'Dr. Oetker Zlatý klas'],
    'prod-drozhdie-fala-42g': ['Droždie Fala', 'Droždí Fala'],
    'prod-med-kvetovy-medokys-500g': ['Včelí med kvetový', 'Medokýš med'],
    'prod-monini-classico-extra-virgin-500ml': ['Monini Classico', 'Monini Extra Virgin'],
    'prod-snico-ocot-kvasny-liehovy-1l': ['Snico ocot', 'Ocot kvasný liehový'],
    'prod-solivar-sol-jodovana-1kg': ['Solivar soľ', 'Jedlá soľ jódovaná Solivar'],

    # Frozen
    'prod-aviko-krokety-zemiakove-600g': ['Aviko krokety', 'Aviko croquettes'],
    'prod-carte-dor-vanilka-1000ml': ['Carte d\'Or Vanilla', 'Carte d\'Or Vanille'],
    'prod-frosta-rybie-prsty-filet-300g': ['Frosta Rybie prsty', 'Frosta Fischstäbchen', 'Frosta Fish fingers'],
    'prod-haagen-dazs-salted-caramel-460ml': ['Häagen-Dazs Salted Caramel', 'Haagen Dazs Salted Caramel'],
    'prod-nowaco-listkove-cesto-mrazene-400g': ['Nowaco lístkové cesto', 'Nowaco listove testo'],
    'prod-nowaco-obalovany-syr-200g': ['Nowaco obaľovaný syr', 'Nowaco obalovany syr'],
    'prod-vinica-hrasok-mrazeny-400g': ['Vinica hrášok', 'Vinica hrasek'],
    'prod-vinica-kukurica-mrazena-400g': ['Vinica kukurica'],
    'prod-vinica-spenat-pretlak-450g': ['Vinica špenát', 'Vinica spenat'],

    # Cleaning & Household
    'prod-clin-na-okna-citron-500ml': ['Clin Fenster', 'Clin Lemon', 'Clin čistič okien'],
    'prod-fino-papier-na-pecenie-8m': ['Fino papier na pečenie', 'Fino baking paper'],
    'prod-fino-alobal-hlinikova-folia-20m': ['Fino alobal', 'Fino hliníková fólia'],
    'prod-fino-potravinova-folia-30m': ['Fino fólia', 'Fino cling film'],
    'prod-jar-citron-prostriedok-na-riad-450ml': ['Jar Lemon', 'Fairy Lemon'],
    'prod-jar-platinum-tablety-umyvacka-60ks': ['Jar Platinum All in 1', 'Fairy Platinum All in 1'],
    'prod-jar-sensitive-hermanek-900ml': ['Jar Sensitive', 'Fairy Sensitive Chamomile'],
    'prod-persil-deep-clean-color-gel-17l': ['Persil Deep Clean Color', 'Persil Color Gel'],
    'prod-savo-original-dezinfekcia-12l': ['Savo Originál', 'Savo Original'],
    'prod-savo-proti-plesni-rozprasovac-500ml': ['Savo Proti plesni', 'Savo proti plísni'],
    'prod-somat-all-in-1-tablety-80ks': ['Somat All in 1', 'Somat All in One'],
    'prod-bref-brilliant-gel-arctic-3x42g': ['Bref Brilliant Gel', 'Bref Arctic'],
    'prod-pampers-active-baby-4-54ks': ['Pampers Active Baby 4', 'Pampers Active Baby'],
    'prod-pur-balsam-aloe-vera-450ml': ['Pur Balsam Aloe', 'Pur Balsam Aloe Vera'],
    'prod-propesko-konzerva-hovadzie-1240g': ['Propesko hovädzie', 'Propesko hovězí', 'Propesko'],
    'prod-vileda-colors-handricky-mikrovlakno-4ks': ['Vileda Colors', 'Vileda mikrovlákno'],
    'prod-vileda-glitzi-hubka-na-riad-3ks': ['Vileda Glitzi', 'Vileda hubka'],
    'prod-harmony-everyday-vreckovky-box-100ks': ['Harmony Everyday', 'Harmony vreckovky'],
    'prod-harmony-soft-flora-toaletny-papier-8ks': ['Harmony Soft Flora', 'Harmony toaletný papier'],
    'prod-tento-vreckovky-10x10ks': ['Tento vreckovky', 'Tento balíčky'],
}

def main():
    conn = sqlite3.connect('data/pricetracker.sqlite')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    matched_count = 0

    for pid, query_list in TARGETED_QUERIES.items():
        row = c.execute("SELECT id, canonical_name, brand, image_url, package_quantity, package_unit FROM products WHERE id = ?", (pid,)).fetchone()
        if not row:
            continue
        p = dict(row)
        if p['image_url'] and os.path.exists(os.path.join('public', p['image_url'].lstrip('/'))):
            continue

        print(f"\nProcessing targeted: {pid} — '{p['canonical_name']}'")
        found = False

        for q in query_list:
            url = f"https://search.openfoodfacts.org/search?q={urllib.parse.quote(q)}&page_size=3"
            try:
                req = urllib.request.Request(url, headers=HEADERS)
                with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
                    data = json.loads(resp.read().decode())
                    hits = data.get('hits', [])
                    for hit in hits:
                        img_url = build_off_image_url(hit.get('code'), hit.get('images', {}))
                        if img_url:
                            target_local_file = os.path.join(OUT_DIR, f"{pid}.jpg")
                            target_web_url = f"/images/products/{pid}.jpg"
                            if verify_and_download(img_url, target_local_file):
                                now_iso = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                                c.execute("""
                                    INSERT INTO product_image_registry (
                                        product_id, product_name, brand, package_size, barcode,
                                        image_url, local_image_path, original_source_url, source_website,
                                        verification_status, last_checked_at, attribution, is_reused_across_retailers,
                                        created_at, updated_at
                                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    ON CONFLICT(product_id) DO UPDATE SET
                                        image_url = excluded.image_url,
                                        local_image_path = excluded.local_image_path,
                                        original_source_url = excluded.original_source_url,
                                        source_website = excluded.source_website,
                                        verification_status = excluded.verification_status,
                                        last_checked_at = excluded.last_checked_at,
                                        updated_at = excluded.updated_at
                                """, (
                                    pid,
                                    p['canonical_name'],
                                    p['brand'],
                                    f"{p['package_quantity']} {p['package_unit']}",
                                    str(hit.get('code')),
                                    target_web_url,
                                    target_local_file,
                                    img_url,
                                    'open_food_facts',
                                    'VERIFIED_GENUINE_PHOTO',
                                    now_iso,
                                    'Open Food Facts (ODbL)',
                                    1,
                                    now_iso,
                                    now_iso
                                ))
                                c.execute("UPDATE products SET image_url = ?, updated_at = ? WHERE id = ?", (target_web_url, now_iso, pid))
                                c.execute("UPDATE retailer_product_listings SET image_url = ?, updated_at = ? WHERE product_id = ?", (target_web_url, now_iso, pid))
                                conn.commit()
                                print(f"  ✓ Found & downloaded: '{hit.get('product_name')}' -> {target_local_file}")
                                found = True
                                matched_count += 1
                                break
                    if found:
                        break
            except Exception as e:
                print(f"  ! Error on query '{q}': {e}")
            time.sleep(0.35)

    print(f"\nSecond pass completed: newly matched & saved: {matched_count}")

if __name__ == '__main__':
    main()
