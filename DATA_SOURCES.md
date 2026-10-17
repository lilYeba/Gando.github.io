# Price Tracker SK — Retailer Data Sources & Provenance

This document records the exact technical investigation, live access mechanisms, `robots.txt` rules, limitations, and fallback workflows implemented for **Lidl Slovakia**, **Tesco Slovakia**, and **BILLA Slovakia**.

> **Core Integrity Principle**: Price Tracker SK never fabricates live API connections, never bypasses CAPTCHAs or anti-bot WAFs, and never interpolates missing prices. Every price observation in the database records its exact `DataSource`, `sourceUrl`, `observedAt` timestamp, and `verificationMethod`.

---

## 1. BILLA Slovakia (`https://www.billa.sk`)

### Investigation Findings
- **Official URLs Investigated**:
  - `https://www.billa.sk/letaky-a-akcie/`
  - `https://www.billa.sk/akcie`
  - `https://www.billa.sk/sitemap.xml`
  - `https://www.billa.sk/produkty/leaflet-99000000`
  - `https://www.billa.sk/produkt/{slug}` (3,803 product pages listed in official sitemap)
- **`robots.txt` Policy (`https://www.billa.sk/robots.txt`)**:
  - `Sitemap: https://www.billa.sk/sitemap.xml`
  - No `Disallow` rules blocking `/produkty/*` or `/produkt/*`.
- **Technical Mechanism (`BillaSkAdapter`)**:
  - BILLA Slovakia's storefront is a Nuxt 3 SSR application backed by Commercetools.
  - Fetching `/produkty/leaflet-99000000` (current leaflet promotions) or any `/produkty/{category}` / `/produkt/{slug}` page returns a `<script id="__NUXT_DATA__" type="application/json">` payload.
  - Our `BillaSkAdapter` dereferences the Nuxt 3 shallow-reactive array format and extracts complete structured Commercetools product records:
    - `productId` (UUID) and `sku` (e.g., `53-171194`, `84-219893`)
    - `name` and `slug`
    - `amount` (e.g., `190`, `1000`), `volumeLabelShort` (`g`, `ml`, `l`, `ks`), `conversionFactor` (`1000`)
    - `price.regular.value` (current price in EUR cents)
    - `price.crossed` (verified reference/standard price in EUR cents)
    - `price.discountPercentage` (e.g., `-23`)
    - `price.regular.perStandardizedQuantity` (standardized unit price in EUR cents per kg/l)
    - `price.lowestPrice` (lowest 30-day price in EUR cents, EU Omnibus Directive compliant)
    - `price.regular.tags` (`["SO"]` for standard promotion, `["BB"]` for BILLA Bonus loyalty-card offer)
    - `images` (CDN product imagery on `images.cdn.europe-west1.gcp.commercetools.com`)
    - `parentCategories` (including leaflet calendar week, e.g., `KW 42/2026`).
- **Update Frequency & Limitations**:
  - Leaflet promotions update weekly (Wednesday).
  - Rate-limited in our adapter (`>= 500ms` delay between requests, bounded batch size) to respect server load.

---

## 2. Lidl Slovakia (`https://www.lidl.sk`)

### Investigation Findings
- **Official URLs Investigated**:
  - `https://www.lidl.sk/`
  - `https://www.lidl.sk/c/jedlo-a-napoje/s10068374`
  - `https://www.lidl.sk/h/ovocie-a-zelenina/h10071012`
  - `https://www.lidl.sk/h/syry-mliecne-vyrobky-a-vajcia/h10095761`
  - `https://www.lidl.sk/h/maso-a-hydina/h10095752`
  - `https://www.lidl.sk/h/pecivo/h10096086`
- **`robots.txt` Policy (`https://www.lidl.sk/robots.txt`)**:
  - Allows `/c/*`, `/h/*`, `/p/*`, and `/static/sitemap.xml`.
  - Disallows `/search?q=*`, `*?offset=*`, `/user-api/*`, and `/cqe/*`. Our adapter strictly respects these rules and never queries `/search?q=*` or disallowed query parameters.
- **Technical Mechanism (`LidlSkAdapter`)**:
  - Lidl Slovakia's category pages render product gridboxes with `data-grid-data="..."` HTML-encoded JSON attributes.
  - Our `LidlSkAdapter` parses and validates each `data-grid-data` JSON object via Zod:
    - `productId` / `erpNumber` (e.g., `11150766`, `11141712`) and `ians` (internal article numbers)
    - `fullTitle` and `brand.name`
    - `price.price` (EUR decimal), `price.oldPrice` / `price.discount.deletedPrice`, `price.discount.percentageDiscount`
    - `price.packaging.text` (e.g., `500 g balenie`, `12 x 100 g = 1200 g`, `0,33 l`)
    - `price.basePrice.text` (e.g., `1 kg = 5,98`, `100 g = 0,61`, `1 l = 3,61`)
    - `lidlPlus` array (contains `lidlPlusText: "s Lidl Plus"`, `highlightText`, and loyalty price object)
    - `storeStartDate` and `storeEndDate` (Unix epoch timestamps for promotion validity)
    - `canonicalUrl` (`/p/...`) and `image` (`https://www.lidl.sk/assets/...`).
- **Update Frequency & Limitations**:
  - Promotional waves update Monday and Thursday.
  - Some `lidlPlus` items in the category overview only expose the percentage discount badge (`-30% s Lidl Plus`) without the base price until the product detail page `/p/{slug}/p{id}` is visited or imported via CSV. When `price.price` is absent on a gridbox, `LidlSkAdapter` records the promotion metadata and flags the price as requiring detail/CSV verification rather than guessing a price.

---

## 3. Tesco Slovakia (`https://www.tesco.sk`)

### Investigation Findings
- **Official URLs Investigated**:
  - `https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy`
  - `https://www.tesco.sk/akciove-ponuky/akciove-produkty`
  - `https://api.prod.retail.tesco.com/marketing/leaflets-be/graphql`
  - `https://potravinydomov.itesco.sk/groceries/sk-SK/promotions`
- **`robots.txt` Policy (`https://www.tesco.sk/robots.txt`)**:
  - Lists sitemaps `https://www.tesco.sk/sitemaps/sk-SK/index.xml` and `https://potravinydomov.itesco.sk/sitemaps/sk-SK/groceries/products-index.xml`.
- **Technical Mechanism & Verified Limitations (`TescoSkAdapter`)**:
  1. **Live Public GraphQL API (`https://api.prod.retail.tesco.com/marketing/leaflets-be/graphql`)**:
     - Used by `tesco.sk/akciove-ponuky/letaky-a-katalogy`.
     - Supports `getValidLeafletList`, `getLeafletPages`, and `availableStores`.
     - Returns all active Slovak leaflets (e.g., `Leaflet:735` Hypermarket, `Leaflet:736` Supermarket) with `validFrom`, `validTo`, and all `LeafletProduct` items.
     - Each `LeafletProduct.product` exposes:
       - **`ean`**: Real 13-digit GTIN/EAN barcode (e.g., `8595241507071` for *Giana guľatozrn. ryža 1kg*, `8585002500939` for *Rajo Mňam smotanový jogurt čokoláda 145 g*, `8586009410092` for *Popradská káva Extra špeciál 250 g*, `4750456004942` for *Balticovo Vajcia M 10 ks*).
       - **`tpn`**: Tesco Product Number (e.g., `2002017142931`).
       - **`productName`**: Product title with package size.
       - **`pngFileURL`**: Official product cutout image URL.
       - **`productPeriods`**: Exact `promoStart` and `promoEnd` ISO timestamps.
       - **`addToBasketURL`**: Deep link to `https://potravinydomov.itesco.sk/groceries/sk-SK/products/{tpn}`.
  2. **Honest Price Limitation & Fallback**:
     - The `leaflets-be/graphql` schema does **not** expose a `price` field on `LeafletProduct` or `Product` (verified via GraphQL validation errors: `Cannot query field "price" on type "LeafletProduct"`).
     - Direct HTTP requests to `potravinydomov.itesco.sk` and `digitalcontent.api.tesco.com/*.pdf` return `HTTP 403 Forbidden` due to Akamai Bot Manager WAF protection.
     - Per ethical and legal requirements, **we do not bypass Akamai WAF or anti-bot protections**.
     - Instead, `TescoSkAdapter` operates in two transparent stages:
       1. **Live GraphQL Ingestion**: Pulls live Slovak leaflets, store locations, promotional product names, TPNs, 13-digit EAN barcodes, package sizes, and validity periods directly from `api.prod.retail.tesco.com`.
       2. **Verified Leaflet Price Import (CSV / Admin Assisted)**: Matches the live GraphQL `tpn`/`ean` records against verified Tesco leaflet price sheets (`data/imports/tesco_verified_leaflet_prices.csv` or the in-app Admin CSV/Manual Import UI). Any Tesco product without a verified price entry remains honestly marked as `Cena nedostupná` (Price unavailable) rather than inventing a number.

---

## 4. Product Normalization, Matching & Deduplication Rules

1. **Package Quantity & Unit Normalization**:
   - Every product's package specification is parsed into `(quantity, unit)` and normalized to standard base units:
     - Mass (`g`, `kg`, `dg`) $\rightarrow$ `kg` (`1000 g = 1 kg`)
     - Volume (`ml`, `cl`, `dl`, `l`) $\rightarrow$ `l` (`1000 ml = 1 l`)
     - Count (`ks`, `kus`, `bal`) $\rightarrow$ `ks`
   - Multipacks (`12 x 100 g`, `4x100g`, `2x1,239 L`) are multiplied to compute total net quantity (`1200 g = 1.2 kg`).
   - **Strict Guardrail**: A `400 g` package and a `500 g` package are never merged as an exact product match; if linked as related variants, comparison views explicitly highlight the package size difference and rank by normalized unit price (`€/kg`).

2. **Three-Tier Product Matching Pipeline**:
   - **Tier 1 — Deterministic Identifier Match (`confidence = 1.00`, `EXACT_MATCH`)**:
     - Exact 8/13-digit GTIN/EAN barcode match + identical normalized package quantity and unit.
   - **Tier 2 — High-Confidence Brand + Normalized Title + Exact Size Match (`confidence >= 0.90`, `EXACT_MATCH` or `EQUIVALENT_PRODUCT`)**:
     - Brand match (or private-label equivalent such as `Pilos` / `Clever` / `Tesco`) + normalized Slovak product token similarity + identical package size & fat/variant attribute (e.g., `Mlieko trvanlivé 1,5% 1 l`, `Maslo 82% 250 g`).
   - **Tier 3 — Uncertain / Similar Match (`0.60 <= confidence < 0.90`, `PENDING_REVIEW` / `SIMILAR_PRODUCT`)**:
     - Placed into the **Product Match Review Workflow** (`/historia-cien` -> Správa párovania produktov) for human confirmation rather than silently merging.

3. **Idempotent Price Observation Deduplication**:
   - Each price import computes a deterministic fingerprint:
     `sha256(retailerId + retailerListingId + regularPriceCents + promoPriceCents + loyaltyPriceCents + validFromDate + observationDay)`
   - Re-running an import job on the same day updates `lastVerifiedAt` on the existing observation without inserting duplicate historical rows.
