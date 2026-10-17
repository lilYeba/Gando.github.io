# Price Tracker SK — Porovnávač cien potravín pre Slovensko

> **Poctivý, nezávislý a algoritmicky presný porovnávač cien potravín a optimalizátor nákupných košíkov pre slovenský trh (Lidl, Tesco, BILLA).**

![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Tailwind CSS 4](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?style=flat-square&logo=tailwind-css)
![Motion](https://img.shields.io/badge/Motion-12.4-f43f5e?style=flat-square)
![Tests](https://img.shields.io/badge/Vitest-25%20passed-emerald?style=flat-square)
![Market](https://img.shields.io/badge/Market-Slovakia%20(EUR)-gold?style=flat-square)

---

## 1. O projekte

**Price Tracker SK** je komerčne orientovaná, plne funkčná webová platforma navrhnutá pre slovenských spotrebiteľov, ktorí chcú ušetriť pri každodenných nákupoch potravín. 

Aplikácia vznikla na princípoch **dátovej integrity, poctivosti a európskej legislatívy (Smernica EÚ Omnibus / Zákon č. 108/2024 Z. z.)**:
- **Zásadne nepredstiera nulové ceny**: Ak tovar v reťazci nemá overenú cenu, zobrazuje sa ako *„Cena nedostupná“*, nikdy nie `0,00 €`.
- **Nedomýšľa kompletné nákupy**: Ak v nákupnom zozname chýba čo i len jedna cena, celková suma sa označí ako *„Čiastočný medzisúčet“* s explicitným upozornením.
- **Nepodvádza na historických grafoch**: Výpadky v letákoch a dátach nie sú maskované rovnou čiarou (žiadna falošná lineárna interpolácia).
- **Zohľadňuje vernostné programy**: Poctivo oddeľuje bežné akcie pre všetkých od akcií vyžadujúcich **Lidl Plus**, **Tesco Clubcard** alebo **BILLA Bonus**.

---

## 2. Pokryté maloobchodné reťazce

| Reťazec | Logo / Farba | Mechanizmus integrácie | Zdroj dát | Vernostný program |
| :--- | :--- | :--- | :--- | :--- |
| **Lidl Slovenská republika** | Modrá / Žltá | Verejný SSR parser (`data-grid-data`) | `lidl.sk/c/jedlo-a-napoje` | Lidl Plus (aplikácia) |
| **Tesco Stores SR** | Modrá / Červená | GraphQL Leaflet API + overené CSV letáky | `tesco.sk` + letáky | Tesco Clubcard |
| **BILLA Slovensko** | Žltá / Červená | Commercetools Nuxt SSR (`__NUXT_DATA__`) | `billa.sk/produkty` | BILLA Bonus |

---

## 3. Dizajnový systém a vizuálna identita

Vizuálny štýl kombinuje **nordicko-európsky redakčný dizajn (editorial design)** s precíznou vizualizáciou dát v štýle moderných fintech aplikácií:

- **Plátno (Canvas)**: `#F7F5F0` (hrejivý alabaster, šetrný k očiam).
- **Primárna farba**: `#123524` (hlboká lesná zelená symbolizujúca čerstvosť a dôveru).
- **Text**: `#141815` (jemný uhoľný odtieň s vysokým kontrastom podľa WCAG AAA).
- **Akcent zliav**: `#C84B31` (terakotová červená, elegantná a neagresívna).
- **Vernostné karty**: `#8F5B14` (jantárová okrová).
- **Typografia**: Serifové nadpisy (`Fraunces` / `Newsreader` štýl) + čistá bezpätková sadzba s tabulkovými číslicami (`font-mono-tabular` pre stĺpcové porovnanie cien).
- **Pohyb (Motion)**: Integrované knižnice `motion/react` s rešpektovaním `prefers-reduced-motion`.

---

## 4. Architektúra a implementované stránky

Všetkých 10 požadovaných aplikačných trás je plne implementovaných v Next.js 15 App Routeri:

### 1. Domovská stránka (`/`)
- Interaktívne vyhľadávanie s okamžitým filtrovaním.
- Dnešné overené akcie z letákov.
- Populárne potraviny a základné kategórie.
- Dátová čerstvosť a živé metriky z lokálnej databázy.
- Porovnávacie vizitky a kalkulačka úspor.

### 2. Katalóg potravín (`/katalog`)
- Pohľad v mriežke (Grid) aj v zozname (List).
- Full-text vyhľadávanie odolné voči slovenskej diakritike (napr. *„maslo“* nájde *„Bánovecký“* aj *„múka“*).
- Filtre: reťazec, kategória, značka, maximálna cena, iba akcie, iba vernostné karty.
- Radenie: podľa najnižšej ceny, jednotkovej ceny (€/kg), najvyššej zľavy a abecedy.
- Stav URL filtrov: výsledky možno zdieľať alebo uložiť do záložiek.

### 3. Detail produktu (`/produkt/[slug]`)
- Overené ponuky zo všetkých 3 reťazcov s presným prepočtom na kilogram / liter / kus.
- Interaktívny SVG graf cenovej histórie za 7 dní, 30 dní, 90 dní, 1 rok a celú históriu.
- Historické minimum a maximum z reálnych dát.
- Podmienky vernostných kariet a platnosť akcií s odpočítavaním zostávajúcich dní.
- Priame overovacie odkazy na zdrojové letáky reťazcov.
- Podobné tovary z rovnakej kategórie.
- Pridanie do zoznamu a označenie hviezdičkou (obľúbené).

### 4. Porovnanie cien (`/porovnanie`)
- Prehľadná tabuľka porovnania produktov naprieč Lidl, Tesco a BILLA.
- Zvýraznenie najlacnejšej overenej ponuky (s informáciou, koľko z 3 predajní má cenu k dispozícii).
- Percentuálne a absolútne cenové rozdiely.
- Varovné odznaky pri chýbajúcich cenách.

### 5. Týždenné akcie a letáky (`/akcie`)
- Záložky: **Bežné akcie**, **Vernostné akcie (s aplikáciou/kartou)** a **Archív ukončených akcií**.
- Odpočítavanie dní do konca akcie (*„Končí dnes!“*, *„Platí ešte 3 dni“*).
- Zobrazenie názvu letáku a pôvodného URL zdroja.
- Filtrovanie podľa reťazca a kategórie.
- Výpočet zľavy striktne podľa smernice EÚ Omnibus.

### 6. Inteligentný nákupný zoznam (`/zoznam`)
- Vytváranie viacerých zoznamov (*Rodinný nákup*, *Víkendové pečenie*).
- Pridávanie tovarov z katalógu alebo vlastných položiek (*„Čerstvý kôpor z trhu“*).
- Odškrtávanie zakúpených položiek s plynulou animáciou.
- Úprava množstva a mazanie.
- Bezpečné zdieľanie pomocou kryptografického tokenu (`?zdielany=sk-share-...`).
- Priamy prechod do optimalizátora jedným kliknutím.

### 7. Optimalizátor nákupného košíka (`/optimalizator`)
- **Kľúčová funkcia platformy**:
  1. Celková cena v Lidli, Tescu a BILLE.
  2. Rozlíšenie medzi *Kompletným nákupom* a *Čiastočným medzisúčtom*.
  3. Spoločný identický prienik (*Comparable Common Subset*) pre férové porovnanie.
  4. Nastavenie zahrnutia kariet Lidl Plus, Clubcard a BILLA Bonus.
  5. Nastavenie maximálneho počtu predajní (1, 2 alebo 3).
  6. Započítanie nákladov na dopravu do ďalšej predajne (0,00 € až 5,00 €).
  7. Odporúčanie: či sa rozdelenie nákupu oplatí aj po započítaní cesty.

### 8. Cenové upozornenia a hlásiče (`/upozornenia`)
- Nastavenie cenového prahu v eurách pre ľubovoľný tovar.
- Spustenie hlásenia pri akejkoľvek novej akcii v letáku.
- In-app doručené správy s označením ako prečítané.
- Čestné zobrazenie stavu SMTP e-mailového servera.

### 9. História cien a dátový audit (`/historia-cien`)
- Prieskumník cenových radov s detekciou výpadkov pokrytia.
- Živý spúšťač adaptérov: spustenie zberu dát z Lidla, Tesca a BILLA.
- Vstavaný nástroj na import overených CSV letákov s SHA-256 deduplikáciou.
- **Fronta na kontrolu zhody tovarov (Pending Match Queue)**:
  - Zobrazuje sporné zhody zachytené párovacím algoritmom (napr. jogurt 145 g vs 400 g, alebo mlieko 1,5 % vs 3,5 %).
  - Možnosť manuálne schváliť alebo zamietnuť zhodu.
- Register oficiálnych dátových zdrojov a audit log posledných importov.

### 10. Nastavenia a preferencie (`/nastavenia`)
- Výber jazyka (Slovenčina / English).
- Svetlý motív, tmavý motív a systémové nastavenie.
- Prepínač obmedzeného pohybu (Reduced Motion).
- Ukážka formátu slovenskej meny (`1,99 €`).
- Predvolené vernostné karty a východiskové parametre optimalizátora.
- Export nastavení do JSON a vyčistenie lokálnej pamäte.

---

## 5. Dátový model a schéma databázy

Databázová vrstva je postavená na vstavanom Node 24 module `node:sqlite` (`DatabaseSync`), čo znamená **nulové externé natívne závislosti a okamžité fungovanie na Windows, Linux aj macOS**.

Schéma obsahuje **18 relačných entít**:
1. `retailers` (Lidl, Tesco, BILLA)
2. `data_sources` (Lidl SSR, BILLA Nuxt, Tesco GraphQL, Tesco CSV)
3. `import_jobs` (Audit spustení zberu dát)
4. `import_errors` (Detailné logy zlyhaní pri párovaní)
5. `products` (Kanonické produkty)
6. `product_identifiers` (EAN-13, TPN, SKU, ERP)
7. `product_variants` (Prepojenie gramáží a príchutí)
8. `retailer_product_listings` (Priradenie tovaru k predajni)
9. `price_observations` (Jednotlivé časové pozorovania cien)
10. `promotions` (Akciové ponuky)
11. `promotion_conditions` (Podmienky vernostných kariet a min. kusov)
12. `users` (Používateľské kontá)
13. `user_preferences` (Uložené nastavenia)
14. `shopping_lists` (Nákupné zoznamy)
15. `shopping_list_items` (Položky v nákupných zoznamoch)
16. `favorites` (Obľúbené produkty)
17. `price_alerts` (Cenové strážce)
18. `notifications` (In-app správy)

K dispozícii sú kompletné SQL migrácie:
- `db/migrations/001_initial_schema.sqlite.sql` (aktívna SQLite verzia)
- `db/migrations/001_initial_schema.postgres.sql` (verzia pre produkčný PostgreSQL)
- `prisma/schema.prisma` (pre ORM migráciu)

---

## 6. Lokálne spustenie a testovanie

### Požiadavky
- Node.js 22+ alebo Node.js 24+ (odporúčané)
- npm

### Inštalácia závislostí
```bash
npm install
```

### Spustenie vývojového servera
```bash
npm run dev
```
Aplikácia bude dostupná na `http://localhost:3000`.

### Spustenie produkčného buildu
```bash
npm run build
npm start
```

### Spustenie automatizovaných testov
```bash
npm run test
```
Všetkých 25 unit a integračných testov beží cez `vitest` a pokrýva:
- Prepočet jednotkových cien a normalizáciu jednotiek.
- Smernicu Omnibus a výpočet zliav.
- Algoritmus optimalizácie nákupného košíka.
- Detekciu výpadkov v dátach.
- Zdieľanie zoznamov a kontrolu autorizácie.
- Párovanie tovarov a SHA-256 deduplikáciu importov.

### Kontrola TypeScript typov
```bash
npm run typecheck
```

---

## 7. Licencia a poďakovanie

Tento projekt bol vyvinutý ako moderná ukážka špičkového inžinierstva, dátovej poctivosti a európskeho redakčného dizajnu pre občanov Slovenskej republiky. Všetky názvy reťazcov a značiek patria ich príslušným vlastníkom.
