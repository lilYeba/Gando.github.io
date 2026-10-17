# -*- coding: utf-8 -*-
"""
PRICE CHECKER SK — Catalog Generator (Categories 4 to 15)
Generates typed TypeScript files for the 300+ real grocery product catalog.
"""

import json
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "lib", "db", "catalog")
os.makedirs(OUT_DIR, exist_ok=True)

def render_product(p):
    offers_code = []
    
    if "lidl" in p:
        o = p["lidl"]
        barcode_val = f"'{p['primaryEan']}'" if p.get("primaryEan") else "null"
        brand_val = json.dumps(o.get("brand")) if o.get("brand") else "null"
        promo_val = str(o["promoCents"]) if "promoCents" in o and o["promoCents"] is not None else "null"
        loyalty_val = str(o["loyaltyCents"]) if "loyaltyCents" in o and o["loyaltyCents"] is not None else "null"
        lowest_val = str(o.get("promoCents") or o["regularCents"])
        loyalty_name = "'Lidl Plus'" if o.get("loyaltyCents") else "null"
        condition_val = json.dumps(o.get("conditionLabel")) if o.get("conditionLabel") else ("'Akcia'" if o.get("promoCents") else "null")
        match_type = o.get("matchType", "EXACT_MATCH")
        confidence = 0.9 if match_type == "EQUIVALENT_PRODUCT" else 1.0
        
        offers_code.append(f"""      {{
        retailerSlug: 'lidl',
        externalId: '{o["externalId"]}',
        externalSku: '{o["externalId"]}',
        barcode: {barcode_val},
        retailerTitle: {json.dumps(o["title"], ensure_ascii=False)},
        retailerBrand: {brand_val},
        packageLabel: '{p["packageQuantity"]} {p["packageUnit"]}',
        packageQuantity: {p["packageQuantity"]},
        packageUnit: '{p["packageUnit"]}',
        sourceUrl: 'https://www.lidl.sk/p/{p["slug"]}/p{o["externalId"]}',
        imageUrl: null,
        matchType: '{match_type}',
        matchConfidence: {confidence},
        matchStatus: 'VERIFIED',
        availabilityStatus: 'VERIFIED_IN_STOCK',
        dataSourceId: 'ds-lidl-ssr',
        regularPriceCents: {o["regularCents"]},
        promoPriceCents: {promo_val},
        loyaltyPriceCents: {loyalty_val},
        lowest30DayPriceCents: {lowest_val},
        loyaltyProgramName: {loyalty_name},
        conditionLabel: {condition_val},
        minQuantity: null,
        validFrom: '2026-10-14T06:00:00Z',
        validTo: '2026-10-20T21:59:59Z',
        history: [{{ day: '2026-10-16', regularCents: {o["regularCents"]}, promoCents: {promo_val}, loyaltyCents: {loyalty_val} }}],
      }}""")

    if "tesco" in p:
        o = p["tesco"]
        barcode_val = f"'{p['primaryEan']}'" if p.get("primaryEan") else "null"
        brand_val = json.dumps(o.get("brand")) if o.get("brand") else "null"
        promo_val = str(o["promoCents"]) if "promoCents" in o and o["promoCents"] is not None else "null"
        loyalty_val = str(o["loyaltyCents"]) if "loyaltyCents" in o and o["loyaltyCents"] is not None else "null"
        lowest_val = str(o.get("promoCents") or o["regularCents"])
        loyalty_name = "'Clubcard'" if o.get("loyaltyCents") else "null"
        condition_val = json.dumps(o.get("conditionLabel")) if o.get("conditionLabel") else ("'S Clubcard'" if o.get("loyaltyCents") else ("'Akcia'" if o.get("promoCents") else "null"))
        match_type = o.get("matchType", "EXACT_MATCH")
        confidence = 0.9 if match_type == "EQUIVALENT_PRODUCT" else 1.0
        
        offers_code.append(f"""      {{
        retailerSlug: 'tesco',
        externalId: '{o["externalId"]}',
        externalSku: '{o["externalId"]}',
        barcode: {barcode_val},
        retailerTitle: {json.dumps(o["title"], ensure_ascii=False)},
        retailerBrand: {brand_val},
        packageLabel: '{p["packageQuantity"]} {p["packageUnit"]}',
        packageQuantity: {p["packageQuantity"]},
        packageUnit: '{p["packageUnit"]}',
        sourceUrl: 'https://potravinydomov.itesco.sk/groceries/sk-SK/products/{o["externalId"]}',
        imageUrl: null,
        matchType: '{match_type}',
        matchConfidence: {confidence},
        matchStatus: 'VERIFIED',
        availabilityStatus: 'VERIFIED_IN_STOCK',
        dataSourceId: 'ds-tesco-csv',
        regularPriceCents: {o["regularCents"]},
        promoPriceCents: {promo_val},
        loyaltyPriceCents: {loyalty_val},
        lowest30DayPriceCents: {lowest_val},
        loyaltyProgramName: {loyalty_name},
        conditionLabel: {condition_val},
        minQuantity: null,
        validFrom: '2026-10-14T06:00:00Z',
        validTo: '2026-10-20T21:59:59Z',
        history: [{{ day: '2026-10-16', regularCents: {o["regularCents"]}, promoCents: {promo_val}, loyaltyCents: {loyalty_val} }}],
      }}""")

    if "billa" in p:
        o = p["billa"]
        barcode_val = f"'{p['primaryEan']}'" if p.get("primaryEan") else "null"
        brand_val = json.dumps(o.get("brand")) if o.get("brand") else "null"
        promo_val = str(o["promoCents"]) if "promoCents" in o and o["promoCents"] is not None else "null"
        loyalty_val = str(o["loyaltyCents"]) if "loyaltyCents" in o and o["loyaltyCents"] is not None else "null"
        lowest_val = str(o.get("promoCents") or o["regularCents"])
        loyalty_name = "'BILLA Bonus'" if o.get("loyaltyCents") else "null"
        condition_val = json.dumps(o.get("conditionLabel")) if o.get("conditionLabel") else ("'BILLA Bonus'" if o.get("loyaltyCents") else ("'Akcia'" if o.get("promoCents") else "null"))
        match_type = o.get("matchType", "EXACT_MATCH")
        confidence = 0.9 if match_type == "EQUIVALENT_PRODUCT" else 1.0
        
        offers_code.append(f"""      {{
        retailerSlug: 'billa',
        externalId: '{o["externalId"]}',
        externalSku: '{o["externalId"]}',
        barcode: {barcode_val},
        retailerTitle: {json.dumps(o["title"], ensure_ascii=False)},
        retailerBrand: {brand_val},
        packageLabel: '{p["packageQuantity"]} {p["packageUnit"]}',
        packageQuantity: {p["packageQuantity"]},
        packageUnit: '{p["packageUnit"]}',
        sourceUrl: 'https://www.billa.sk/produkt/{p["slug"]}-{o["externalId"]}',
        imageUrl: null,
        matchType: '{match_type}',
        matchConfidence: {confidence},
        matchStatus: 'VERIFIED',
        availabilityStatus: 'VERIFIED_IN_STOCK',
        dataSourceId: 'ds-billa-ssr',
        regularPriceCents: {o["regularCents"]},
        promoPriceCents: {promo_val},
        loyaltyPriceCents: {loyalty_val},
        lowest30DayPriceCents: {lowest_val},
        loyaltyProgramName: {loyalty_name},
        conditionLabel: {condition_val},
        minQuantity: null,
        validFrom: '2026-10-14T06:00:00Z',
        validTo: '2026-10-20T21:59:59Z',
        history: [{{ day: '2026-10-16', regularCents: {o["regularCents"]}, promoCents: {promo_val}, loyaltyCents: {loyalty_val} }}],
      }}""")

    brand_repr = json.dumps(p["brand"], ensure_ascii=False) if p["brand"] else "null"
    variant_repr = json.dumps(p["variantDescriptor"], ensure_ascii=False) if p["variantDescriptor"] else "null"
    img_repr = json.dumps(p["imageUrl"]) if p["imageUrl"] else "null"
    ean_repr = f"'{p['primaryEan']}'" if p["primaryEan"] else "null"
    staple_repr = "true" if p["isEssentialStaple"] else "false"

    return f"""  {{
    id: '{p["id"]}',
    slug: '{p["slug"]}',
    canonicalName: {json.dumps(p["canonicalName"], ensure_ascii=False)},
    brand: {brand_repr},
    categorySlug: '{p["categorySlug"]}',
    categoryName: '{p["categoryName"]}',
    subcategoryName: '{p["subcategoryName"]}',
    packageQuantity: {p["packageQuantity"]},
    packageUnit: '{p["packageUnit"]}',
    normalizedQuantity: {p["normalizedQuantity"]},
    normalizedUnit: '{p["normalizedUnit"]}',
    variantDescriptor: {variant_repr},
    imageUrl: {img_repr},
    description: {json.dumps(p["description"], ensure_ascii=False)},
    isEssentialStaple: {staple_repr},
    primaryEan: {ean_repr},
    offers: [
{",\n".join(offers_code)}
    ],
  }}"""

def write_catalog_module(filename, const_name, title, products):
    filepath = os.path.join(OUT_DIR, filename)
    rendered = ",\n".join(render_product(p) for p in products)
    content = f"""// ==============================================================================
// PRICE CHECKER SK — REAL PRODUCTS CATALOG
// {title}
// ==============================================================================

import type {{ SeedProductDefinition }} from '../seed-data';

export const {const_name}: SeedProductDefinition[] = [
{rendered}
];
"""
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] Wrote {filename} with {len(products)} products.")

print("Module helper ready.")
