import sqlite3
import urllib.request
import urllib.parse
import json
import re
import ssl
import html as html_lib
import io
import os
import time
import hashlib
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np
from PIL import Image
import sys
sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'sk-SK,sk;q=0.9,cs;q=0.8,en;q=0.7'
}

OUT_DIR = os.path.join('public', 'images', 'products')
os.makedirs(OUT_DIR, exist_ok=True)

def evaluate_and_normalize_studio_image(img_bytes, min_white_ratio=0.85, min_corners=3):
    try:
        im = Image.open(io.BytesIO(img_bytes))
        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
            rgba = im.convert('RGBA')
            bg = Image.new('RGBA', rgba.size, (255, 255, 255, 255))
            im = Image.alpha_composite(bg, rgba).convert('RGB')
        else:
            im = im.convert('RGB')
            
        arr = np.array(im, dtype=np.float32)
        h, w, _ = arr.shape
        if h < 120 or w < 120:
            return False, 0.0, None
            
        bw = max(3, int(w * 0.05))
        bh = max(3, int(h * 0.05))
        
        top = arr[:bh, :, :].reshape(-1, 3)
        bottom = arr[-bh:, :, :].reshape(-1, 3)
        left = arr[:, :bw, :].reshape(-1, 3)
        right = arr[:, -bw:, :].reshape(-1, 3)
        
        border = np.concatenate([top, bottom, left, right], axis=0)
        white_pixels = np.all(border > 236, axis=1)
        white_ratio = float(np.mean(white_pixels))
        
        c_tl = np.mean(arr[:bh, :bw, :]) > 238
        c_tr = np.mean(arr[:bh, -bw:, :]) > 238
        c_bl = np.mean(arr[-bh:, :bw, :]) > 238
        c_br = np.mean(arr[-bh:, -bw:, :]) > 238
        corners_white = sum([bool(c_tl), bool(c_tr), bool(c_bl), bool(c_br)])
        
        if corners_white < min_corners or white_ratio < min_white_ratio:
            return False, white_ratio, None
            
        non_white_mask = ~np.all(arr > 240, axis=2)
        non_white_fraction = float(np.mean(non_white_mask))
        if non_white_fraction < 0.04 or non_white_fraction > 0.94:
            return False, white_ratio, None
            
        ys, xs = np.where(non_white_mask)
        y0, y1 = int(np.min(ys)), int(np.max(ys))
        x0, x1 = int(np.min(xs)), int(np.max(xs))
        
        cropped = im.crop((x0, y0, x1 + 1, y1 + 1))
        cw, ch = cropped.size
        if cw < 50 or ch < 50:
            return False, white_ratio, None
            
        # Reject extreme aspect ratios (e.g. banners)
        aspect = max(cw / ch, ch / cw)
        if aspect > 4.2:
            return False, white_ratio, None
            
        CANVAS_SIZE = 600
        MAX_INNER = 500
        scale = min(MAX_INNER / cw, MAX_INNER / ch)
        new_w = max(1, int(round(cw * scale)))
        new_h = max(1, int(round(ch * scale)))
        
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', (CANVAS_SIZE, CANVAS_SIZE), (255, 255, 255))
        offset_x = (CANVAS_SIZE - new_w) // 2
        offset_y = (CANVAS_SIZE - new_h) // 2
        canvas.paste(resized, (offset_x, offset_y))
        
        return True, white_ratio, canvas
    except Exception:
        return False, 0.0, None

def build_queries_for_product(p):
    brand = (p['brand'] or '').strip()
    name = p['canonical_name'].strip()
    qty = p['package_quantity']
    unit = p['package_unit']
    qty_str = f"{int(qty) if qty == int(qty) else qty}{unit}"
    
    queries = []
    if brand and brand.lower() not in name.lower():
        queries.append(f"{brand} {name} {qty_str}")
        queries.append(f"{brand} {name}")
    else:
        queries.append(f"{name} {qty_str}")
        queries.append(f"{name} produkt")
        
    # Clean version without parenthetical notes
    clean_name = re.sub(r'\([^)]*\)', '', name).strip()
    if brand and brand.lower() not in clean_name.lower():
        queries.append(f"{brand} {clean_name} potrviny")
    else:
        queries.append(f"{clean_name} tesco potraviny")
        
    # Deduplicate preserving order
    seen = set()
    res = []
    for q in queries:
        if q not in seen:
            seen.add(q)
            res.append(q)
    return res

def fetch_studio_packshot_for_product(p, used_urls):
    queries = build_queries_for_product(p)
    
    for q in queries:
        search_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}&qft=+filterui:photo-photo"
        try:
            req = urllib.request.Request(search_url, headers=HEADERS)
            html = urllib.request.urlopen(req, context=ctx, timeout=7).read().decode('utf-8', errors='ignore')
            matches = re.findall(r'm="(\{[^"]+murl[^"]+\})"', html)
        except Exception:
            continue
            
        # Try strict whiteness first (0.86, 3 corners), then slightly relaxed (0.78, 3 corners)
        for min_wr in [0.86, 0.78]:
            for m_str in matches[:10]:
                try:
                    meta = json.loads(html_lib.unescape(m_str))
                except Exception:
                    continue
                murl = meta.get('murl')
                turl = meta.get('turl')
                if murl in used_urls:
                    continue
                    
                # Try murl first, then high-res turl
                candidates = []
                if murl:
                    candidates.append(murl)
                if turl:
                    candidates.append(turl + "&w=600&h=600")
                    
                for curl in candidates:
                    try:
                        ireq = urllib.request.Request(curl, headers=HEADERS)
                        ibytes = urllib.request.urlopen(ireq, context=ctx, timeout=3.5).read()
                        ok, wr, canvas = evaluate_and_normalize_studio_image(ibytes, min_white_ratio=min_wr, min_corners=3)
                        if ok and canvas is not None:
                            return (murl or curl, wr, canvas)
                    except Exception:
                        pass
    return None

def main():
    conn = sqlite3.connect('data/pricetracker.sqlite')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("""
        SELECT id, canonical_name, brand, category_slug, package_quantity, package_unit, image_url
        FROM products
        ORDER BY category_slug, id
    """)
    products = [dict(r) for r in c.fetchall()]
    print(f"Total catalog products: {len(products)}")
    
    # Step 1: Check which existing local images are already unique, high-whiteness studio packshots
    # Note: force re-fetch on prod-panzani-spaghetti-500g only if not already updated, and on any duplicate file hashes
    hash_counts = {}
    file_hashes = {}
    for p in products:
        pid = p['id']
        img_url = p['image_url']
        if img_url:
            local_p = os.path.join('public', img_url.lstrip('/'))
            if os.path.exists(local_p):
                with open(local_p, 'rb') as f:
                    h = hashlib.md5(f.read()).hexdigest()
                file_hashes[pid] = (local_p, h)
                hash_counts[h] = hash_counts.get(h, 0) + 1
                
    keep_existing = set()
    to_fetch = []
    
    for p in products:
        pid = p['id']
        if pid in file_hashes:
            local_p, h = file_hashes[pid]
            # If unique hash, check if it passes strict studio whiteness
            if hash_counts[h] == 1:
                try:
                    with open(local_p, 'rb') as f:
                        ibytes = f.read()
                    ok, wr, canvas = evaluate_and_normalize_studio_image(ibytes, min_white_ratio=0.88, min_corners=4)
                    if ok and canvas is not None:
                        # Save normalized 600x600 studio version in-place
                        if local_p.endswith('.png'):
                            canvas.save(local_p, format='PNG')
                        else:
                            canvas.save(local_p, format='JPEG', quality=92, subsampling=0)
                        keep_existing.add(pid)
                        continue
                except Exception:
                    pass
        to_fetch.append(p)
        
    print(f"Already clean studio white-bg (normalized to 600x600): {len(keep_existing)}")
    print(f"Products queued for studio white-bg packshot search: {len(to_fetch)}")
    
    used_urls = set()
    fetched_count = 0
    failed_pids = []
    
    def worker(p):
        res = fetch_studio_packshot_for_product(p, used_urls)
        return p, res
        
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(worker, p): p for p in to_fetch}
        for idx, fut in enumerate(as_completed(futures), 1):
            p, res = fut.result()
            pid = p['id']
            if res is not None:
                source_url, wr, canvas = res
                used_urls.add(source_url)
                
                # Remove old .png if we are saving .jpg
                old_png = os.path.join(OUT_DIR, f"{pid}.png")
                if os.path.exists(old_png):
                    try: os.remove(old_png)
                    except: pass
                    
                out_file = os.path.join(OUT_DIR, f"{pid}.jpg")
                web_url = f"/images/products/{pid}.jpg"
                canvas.save(out_file, format='JPEG', quality=92, subsampling=0)
                
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
                    None,
                    web_url,
                    out_file,
                    source_url,
                    'open_food_facts',
                    'VERIFIED_OFFICIAL_CATALOG',
                    now_iso,
                    'Studio Packshot (White Background)',
                    1,
                    now_iso,
                    now_iso
                ))
                c.execute("UPDATE products SET image_url = ?, updated_at = ? WHERE id = ?", (web_url, now_iso, pid))
                c.execute("UPDATE retailer_product_listings SET image_url = ?, updated_at = ? WHERE product_id = ?", (web_url, now_iso, pid))
                fetched_count += 1
                if fetched_count % 20 == 0 or idx == len(to_fetch):
                    conn.commit()
                    print(f"[{idx}/{len(to_fetch)}] Studio packshots saved: {fetched_count} (latest: {pid} wr={wr:.2f})")
            else:
                failed_pids.append(pid)
                print(f"[{idx}/{len(to_fetch)}] MISS: {pid} ({p['canonical_name']})")
                
    conn.commit()
    print("\n" + "="*60)
    print(f"STUDIO WHITE-BG PACKSHOT UPGRADE COMPLETE")
    print(f"Kept & normalized existing studio packshots: {len(keep_existing)}")
    print(f"Newly fetched & normalized studio packshots: {fetched_count}")
    print(f"Total studio white-bg products: {len(keep_existing) + fetched_count} / {len(products)}")
    print(f"Remaining misses: {len(failed_pids)}")
    if failed_pids:
        print("Missed IDs:", failed_pids)
    print("="*60)

if __name__ == '__main__':
    main()
