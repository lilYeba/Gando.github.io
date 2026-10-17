# Price Tracker SK — Design System & Art Direction

## 1. Brand Essence & Aesthetic Direction

**Price Tracker SK** combines **Nordic-European editorial clarity** (inspired by modern European consumer journals, Monocle, and Braun functionalism) with **fintech-grade data precision** (inspired by Stripe and Wise).

- **Tone**: Trustworthy, objective, consumer-advocate, calm, and high-craft.
- **No Retailer Imitation**: Price Tracker SK has its own distinct editorial identity. Retailer colors are used exclusively inside small, standardized store badges (`Lidl`, `Tesco`, `BILLA`).
- **Anti-Patterns Strictly Avoided**:
  - No neon gradients, excessive glassmorphism, or decorative floating blobs.
  - No emojis used in place of geometric vector icons.
  - No fabricated user testimonials or invented market statistics.
  - No cards nested three levels deep; information density is structured using crisp hairlines (`1px solid`), tabular numerals, and generous whitespace.

---

## 2. Color Palette & Surface Tokens

### Light Theme (Default — "Warm Editorial Alabaster")
| Token | Hex | Purpose |
|---|---|---|
| `--bg-canvas` | `#F7F5F0` | Primary page background (warm European paper off-white) |
| `--bg-surface` | `#FFFFFF` | Elevated cards, comparison tables, modals |
| `--bg-subtle` | `#EFECE6` | Secondary containers, filter pills, table headers, skeleton base |
| `--bg-muted` | `#E5E0D8` | Hover states on neutral controls, inactive switches |
| `--text-primary` | `#141815` | High-contrast forest-charcoal primary copy & numerals (AAA contrast) |
| `--text-secondary` | `#4A524C` | Supporting descriptions, package sizes, unit prices |
| `--text-muted` | `#717A73` | Timestamps, provenance metadata, unavailable states |
| `--border-subtle` | `#E2DDD3` | Crisp 1px structural dividers and card borders |
| `--border-strong` | `#C8C2B6` | Active input borders, table rules |

### Brand & Semantic Accents
| Token | Hex | Purpose |
|---|---|---|
| `--brand-primary` | `#123524` | Deep Tatra Forest Green — primary CTAs, active nav, brand mark |
| `--brand-primary-hover` | `#1A4B33` | Hover state for primary buttons |
| `--brand-tint` | `#E6F0EB` | Subtle green highlight surface for cheapest verified offer |
| `--accent-savings` | `#156F46` | Verified savings badge, best-price indicator, positive price drop |
| `--accent-promo` | `#C84B31` | Terracotta/vermilion promotional badge (`Akciová cena`) |
| `--accent-Promo-tint` | `#FDF0ED` | Soft background for promotional price tags |
| `--accent-loyalty` | `#8F5B14` | Warm amber-gold for loyalty-card prices (`Lidl Plus`, `Clubcard`, `BILLA Bonus`) |
| `--accent-loyalty-tint` | `#FEF7EC` | Soft background for loyalty-card conditions |
| `--status-unavailable` | `#6E7370` | Missing or unverified price badge (`Cena nedostupná`) |
| `--status-danger` | `#B42318` | Destructive actions, import errors, price spikes |

### Retailer Identity Tokens (Used only for store badges & chart series)
| Retailer | Badge Accent | Tint Surface | Loyalty Program Label |
|---|---|---|---|
| **Lidl Slovakia** | `#0050AA` (Blue) / `#E60A14` | `#EDF4FC` | `Lidl Plus` |
| **Tesco Slovakia** | `#00539F` (Navy) / `#EE1C2E` | `#EEF3F9` | `Clubcard` |
| **BILLA Slovakia** | `#D4141A` (Crimson) / `#F59E0B` | `#FCEEEE` | `BILLA Bonus` |

### Dark Theme ("Night Ledger")
- `--bg-canvas`: `#0F1411`
- `--bg-surface`: `#171F1A`
- `--bg-subtle`: `#202A24`
- `--text-primary`: `#F2F0EA`
- `--text-secondary`: `#A6B0A9`
- `--border-subtle`: `#2A362F`
- `--brand-primary`: `#2E8B57`

---

## 3. Typography & Numeric Discipline

- **Primary Sans (`--font-sans`)**: `Plus Jakarta Sans` / `Inter` with Slovak diacritics (`ľ, š, č, ť, ž, ý, á, í, é, ú, ä, ô, ň, ď, ĺ, ŕ`) fully supported.
- **Editorial Display (`--font-display`)**: `Instrument Serif` / `Newsreader` or tight-tracked geometric display for editorial section headers.
- **Monospace / Tabular Numerals (`--font-mono`)**: `JetBrains Mono` and `font-variant-numeric: tabular-nums` enforced on **every** price, unit price, percentage, weight, date, and basket calculation so columns align to the pixel.
- **Slovak Price Formatting Convention**:
  - Standard comma decimal separator: `1,99 €`, `11,90 € / kg`, `-23 %`.
  - Unit prices always displayed immediately beneath or beside the package price in `--text-secondary` (`1 kg = 5,98 €` or `5,98 € / kg`).

---

## 4. Layout Grid, Spacing & Border Radii

- **Container**: Max-width `1360px` with responsive horizontal padding (`16px` mobile, `24px` tablet, `40px` desktop).
- **Grid**: 12-column CSS Grid on desktop, 6-column on tablet, 1-column / 2-column compact product grid on mobile.
- **Border Radius Scale**:
  - `--radius-xs`: `6px` (badges, data pills, loyalty tags)
  - `--radius-sm`: `10px` (buttons, inputs, dropdown items)
  - `--radius-md`: `14px` (product cards, retailer offer rows)
  - `--radius-lg`: `20px` (hero containers, comparison matrices, modals)

---

## 5. Price Presentation & Honest Data States

Every price component in Price Tracker SK strictly distinguishes four states:

1. **Bežná cena (Regular Verified Price)**:
   - Displayed in crisp `--text-primary` tabular numerals with normalized unit price (`€/kg`, `€/l`, `€/ks`) and verification timestamp.
2. **Akciová cena (Standard Promotional Price — No Card Required)**:
   - Highlighted with `--accent-promo` badge (`Akcia -23 %`), strikethrough verified reference price (`Bežne 1,99 €`), and validity window (`Platí do 20. 10. 2026`).
3. **Vernostná cena (Loyalty-Card Price — `Lidl Plus` / `Clubcard` / `BILLA Bonus`)**:
   - Explicitly badged with a card icon and `--accent-loyalty` pill (`S kartou BILLA Bonus`). Never conflated with a public price unless the user enables "Započítať vernostné karty" (Include loyalty cards).
4. **Cena nedostupná (Missing / Unverified Price)**:
   - Displayed as a muted dashed pill (`Cena nedostupná v tomto obchode`) — **never** rendered as `0,00 €` and never counted as zero in basket totals.

---

## 6. Motion & Interaction System

All animations use reusable primitives in `src/components/motion/` powered by `motion/react`:

- **Easing Curves**:
  - Standard entrance/transition: `cubic-bezier(0.22, 1, 0.36, 1)` (`duration: 0.28s`)
  - Interactive spring (cart badge, filter pill, active nav tab): `type: "spring", stiffness: 380, damping: 30`
  - Modal / drawer transition: `cubic-bezier(0.16, 1, 0.3, 1)` (`duration: 0.24s`)
- **Motion Primitives**:
  - `<AnimatedNumber value={...} />`: Smoothly interpolates displayed EUR totals and savings when toggling loyalty cards or changing item quantities.
  - `<StaggerGrid>` & `<StaggerItem>`: Subtle `12px` vertical rise + opacity stagger (`35ms` per item, capped at `300ms`) when catalog cards load.
  - `layoutId="nav-active-pill"`: Shared-layout active navigation indicator.
  - `<ReducedMotionProvider>`: Automatically detects `prefers-reduced-motion: reduce` OR the user's in-app Settings toggle and switches all animations to instant opacity transitions (`duration: 0`).
