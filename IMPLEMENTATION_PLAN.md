# Price Tracker SK — Implementation Plan

## 1. Repository & Environment Inspection Summary

- **Initial Workspace State**: Empty repository (`e:\Price Tracker`), greenfield build.
- **Operating System & Runtime**: Windows 10/11, Node.js `v24.21.0`, npm `11.19.0`, Git `2.56.0`.
- **Local Database Environment**: Neither PostgreSQL (`psql`) nor Docker is installed locally on the host machine. Node.js 24 provides native `node:sqlite` (`DatabaseSync`) with full relational SQL, foreign keys, indexes, transactions, and zero native C++ build dependencies on Windows.
- **Architectural Decision for Database**:
  - Provide dual-target relational persistence:
    1. **PostgreSQL schema & migrations** (`prisma/schema.prisma` and `db/migrations/001_initial_schema.postgres.sql`) for cloud/production deployments configured via `DATABASE_URL`.
    2. **Embedded SQLite relational engine** (`db/migrations/001_initial_schema.sqlite.sql` via `node:sqlite` persisted at `data/pricetracker.sqlite`) as the default local runtime so the entire application, background ingestion pipeline, and test suite execute out-of-the-box without external daemon setup.
  - All monetary values are stored using decimal-safe integer cents (`price_cents`, `regular_price_cents`, `loyalty_price_cents`, `unit_price_cents`) paired with exact `Decimal` formatting helpers (`src/lib/domain/money.ts`) so floating-point inaccuracies never occur.

---

## 2. Selected Technology Stack

- **Framework**: Next.js 15 (App Router) + TypeScript 5 (Strict mode)
- **UI & Styling**: React 19, Tailwind CSS v4 / CSS Custom Properties design tokens (`DESIGN_SYSTEM.md`), Lucide icons (`lucide-react`)
- **Motion System**: `motion` (`framer-motion`) with reusable motion primitives (`src/components/motion/`) respecting `prefers-reduced-motion` and user settings
- **Validation**: `zod` for API request/response, CSV import, and retailer adapter payload validation
- **Database & Persistence**: Relational SQL (`node:sqlite` local persistence + PostgreSQL DDL & Prisma schema) with explicit migrations, foreign-key constraints, and idempotent upsert/deduplication logic
- **Testing**:
  - **Unit & Integration Tests**: `vitest` covering price normalization, unit-price math, discount verification, deterministic + fuzzy product matching, promotion expiration, basket optimizer (single-store & multi-store with trip costs), missing-price safeguards, loyalty-card toggles, alert thresholds, import deduplication, and authorization.
  - **End-to-End & Visual QA**: Playwright / browser verification across desktop and mobile viewports.

---

## 3. Retailer Data Source Investigation Summary

Detailed technical and legal findings are documented in [`DATA_SOURCES.md`](file:///e:/Price%20Tracker/DATA_SOURCES.md):

1. **Lidl Slovakia (`https://www.lidl.sk`)**:
   - **Status**: Live SSR HTML/JSON extraction verified and working.
   - **Mechanism**: Publicly accessible category pages (e.g., `/c/jedlo-a-napoje/s10068374`, `/h/syry-mliecne-vyrobky-a-vajcia/h10095761`) permitted by `robots.txt` embed `data-grid-data` JSON attributes containing `productId`/`erpNumber`, `ians`, `fullTitle`, `brand`, `price.price`, `price.oldPrice`, `price.discount`, `price.packaging.text`, `price.basePrice.text`, `lidlPlus` loyalty offers, `storeStartDate`, `storeEndDate`, `canonicalUrl`, and `image`.
2. **BILLA Slovakia (`https://www.billa.sk`)**:
   - **Status**: Live SSR Nuxt/Commercetools extraction verified and working.
   - **Mechanism**: Publicly accessible `sitemap.xml` exposes 534 `/produkty/...` category/leaflet pages (including `/produkty/leaflet-99000000`) and 3,803 `/produkt/...` pages permitted by `robots.txt`. Each page embeds a `__NUXT_DATA__` payload with Commercetools product records (`productId`, `sku`, `slug`, `name`, `amount`, `volumeLabelShort`, `conversionFactor`, `price.regular.value`, `price.crossed`, `price.discountPercentage`, `price.regular.perStandardizedQuantity`, `price.lowestPrice`, `price.regular.tags` for `SO` regular promo vs `BB` BILLA Bonus card, and `images`).
3. **Tesco Slovakia (`https://www.tesco.sk/akciove-ponuky/letaky-a-katalogy`)**:
   - **Status**: Live Apollo GraphQL metadata & EAN-13 extraction verified (`https://api.prod.retail.tesco.com/marketing/leaflets-be/graphql`), paired with verified leaflet price import fallback.
   - **Mechanism & Limitation**: Tesco's public leaflet GraphQL API returns active Slovak leaflets (`HM`, `SM`), store locations (`availableStores`), and promotional products with exact **13-digit EAN/GTIN barcodes (`ean`)**, Tesco Product Numbers (`tpn`), `productName`, `pngFileURL`, and `productPeriods` (`promoStart`, `promoEnd`). However, the GraphQL `LeafletProduct` type omits numeric EUR prices, and `potravinydomov.itesco.sk` returns HTTP 403 (Akamai WAF) to automated clients. Per strict compliance rules (never bypass WAF/anti-bot), `TescoSkAdapter` ingests live GraphQL product/EAN/promotion metadata and pairs it with our verified leaflet CSV/Admin price import workflow, never fabricating live API prices when unverified.

---

## 4. Phased Execution Plan & Completion Status

### Phase 1: Repository Inspection, Architecture, Design System & Implementation Plan
- [x] Inspect workspace, OS, Node/npm/database tooling.
- [x] Probe live endpoints and `robots.txt` for Lidl SK, Tesco SK, and BILLA SK.
- [x] Author `IMPLEMENTATION_PLAN.md`, `DESIGN_SYSTEM.md`, and `DATA_SOURCES.md`.

### Phase 2: Core Application Shell, Navigation, Design Tokens, Reusable Components & Responsive Layout
- [x] Initialize Next.js + TypeScript + Tailwind CSS + Motion + Vitest project structure.
- [x] Implement Nordic-European editorial grocery-tech design tokens (warm alabaster `#F7F5F0`, deep forest green `#123524`, botanical accents, tabular-nums typography).
- [x] Build custom brand mark & logo (`Price Tracker SK`), responsive header, animated active nav indicators, keyboard-accessible search bar, mobile navigation drawer, toast notification system, modal dialog primitives, and global settings context (language, theme, reduced motion, loyalty card toggle).

### Phase 3: Database, Product Schema, Price History & Import Pipeline
- [x] Create complete SQL schema & migrations covering all 18 domain entities (`retailers`, `products`, `product_identifiers`, `product_variants`, `retailer_product_listings`, `price_observations`, `promotions`, `promotion_conditions`, `data_sources`, `import_jobs`, `import_errors`, `shopping_lists`, `shopping_list_items`, `users`, `favorites`, `price_alerts`, `notifications`, `user_preferences`).
- [x] Implement domain logic: unit-price normalization (`€/kg`, `€/l`, `€/ks`, `€/100g`), discount verification, deterministic + confidence-scored product matching pipeline, and historical observation storage without interpolation.

### Phase 4: Retailer Integrations & Reliable Data Provenance
- [x] Implement `LidlSkAdapter` (live SSR `data-grid-data` parser + validator).
- [x] Implement `BillaSkAdapter` (live SSR `__NUXT_DATA__` Commercetools dereferencer + validator).
- [x] Implement `TescoSkAdapter` (live Apollo GraphQL leaflet/EAN/store client + verified leaflet price CSV/Admin fallback).
- [x] Build initial database seed + live ingestion runner that populates real verified Slovak products, multi-retailer cross-matched staples, historical price observations (including intentional coverage gaps), and provenance logs.

### Phase 5: Product Catalog, Search, Filters, Product Detail & Comparison Views
- [x] Build Home page (`/`) with main search, today's verified offers, popular products, category explorer, price comparison highlights, interactive savings calculator, recently updated prices, and live data provenance/freshness panel.
- [x] Build Product Catalog (`/katalog`) with grid/list toggle, URL-synced filters (retailer, category, brand, price range, promo status, loyalty card), sorting (price, unit price, discount, updated), active filter chips, and empty state.
- [x] Build Product Detail page (`/produkt/[slug]`) with normalized unit prices, retailer offer cards, loyalty conditions, SVG/Canvas animated price-history chart with gap indicators, historical min/max, source links, similar products, add-to-list, and favorite actions.
- [x] Build Dedicated Price Comparison page (`/porovnanie`) with side-by-side Lidl / Tesco / BILLA comparison, honest unavailable-price handling, unit-price normalization guardrails, and loyalty-card toggle.

### Phase 6: Shopping Lists, Basket Comparison & Multi-Store Optimizer
- [x] Build Smart Shopping List page (`/zoznam`) with multiple lists, quantity controls, purchased checkboxes, unpriced item handling, list duplication/renaming, and cryptographically random share tokens.
- [x] Build Shopping Basket Optimizer (`/optimalizator`) calculating exact single-store totals, partial subtotals when items lack verified prices at a store, missing-price breakdowns, loyalty-card inclusion toggle, and multi-store split strategy with configurable max stores and per-trip travel cost penalty.

### Phase 7: Weekly Offers, Price History Explorer, Favorites, Price Alerts & Settings
- [x] Build Weekly Offers page (`/akcie`) separating standard promotions (`Akcia`) from loyalty-card promotions (`Lidl Plus`, `Clubcard`, `BILLA Bonus`), with expiration countdowns and expired-offer filtering.
- [x] Build Price Alerts & Notifications page (`/upozornenia`) with target price thresholds, promo triggers, deduplicated in-app notifications, and honest email service status indicator.
- [x] Build Price History & Data Provenance page (`/historia-cien`) with daily/weekly/monthly observation views, gap detection, retailer adapter trigger, CSV import tool, and product match review queue.
- [x] Build Settings page (`/nastavenia`) for language (`SK` / `EN`), theme, reduced motion, default loyalty-card inclusion, notification preferences, and local/session data privacy controls.

### Phase 8: Animation Refinement, Accessibility & Mobile Polish
- [x] Audit all motion primitives, keyboard focus traps, ARIA attributes, color contrast, and mobile viewport responsiveness (375px–1920px).

### Phase 9: Security Review, Automated Tests, Performance & Production Build
- [x] Execute comprehensive Vitest unit and integration test suite (`npm test` — all 25 tests passing).
- [x] Run TypeScript typecheck (`tsc --noEmit` — 0 errors) and Next.js production build (`npm run build` — 10/10 routes static/dynamic compiled).
- [x] Inspect all pages live, verify interactive flows, and update documentation (`README.md`, `.env.example`, `IMPLEMENTATION_PLAN.md`).
