import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'public', 'images', 'products');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

interface ProductArt {
  slug: string;
  name: string;
  brand: string;
  package: string;
  bgColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  category: string;
  svgInner: string;
}

const products: ProductArt[] = [
  {
    slug: 'tami-tatranske-maslo-82-250g',
    name: 'Tatranské maslo 82 %',
    brand: 'TAMI',
    package: '250 g',
    bgColor: '#FFFBEB',
    accentColor: '#D97706',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Mliečne výrobky',
    svgInner: `
      <!-- Butter Foil Pack -->
      <g transform="translate(110, 80)">
        <!-- Shadow -->
        <ellipse cx="90" cy="150" rx="90" ry="18" fill="#000" opacity="0.08"/>
        <!-- Butter Block 3D -->
        <path d="M20,60 L140,40 L170,75 L45,95 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="2"/>
        <path d="M45,95 L170,75 L170,125 L45,145 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
        <path d="M20,60 L45,95 L45,145 L20,110 Z" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
        <!-- Foil wrapper wrap details -->
        <path d="M30,85 L155,65 L155,115 L30,135 Z" fill="#FEF08A" opacity="0.7"/>
        <text x="92" y="105" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#854D0E" text-anchor="middle" transform="rotate(-7, 92, 105)">TAMI 82%</text>
        <text x="92" y="122" font-family="system-ui, sans-serif" font-weight="700" font-size="10" fill="#A16207" text-anchor="middle" transform="rotate(-7, 92, 122)">MASLO 250g</text>
        <!-- Butter curl on top -->
        <path d="M60,45 Q75,30 90,40 Q105,50 85,55 Z" fill="#FEF9C3" stroke="#EAB308" stroke-width="2"/>
      </g>
    `
  },
  {
    slug: 'rajo-trvanlive-mlieko-1-5-1l',
    name: 'Trvanlivé mlieko 1,5 %',
    brand: 'RAJO',
    package: '1 l',
    bgColor: '#EFF6FF',
    accentColor: '#2563EB',
    badgeBg: '#BFDBFE',
    badgeText: '#1E3A8A',
    category: 'Mliečne výrobky',
    svgInner: `
      <!-- Milk Carton TetraPak -->
      <g transform="translate(130, 60)">
        <ellipse cx="70" cy="180" rx="70" ry="16" fill="#000" opacity="0.08"/>
        <!-- Top Gable -->
        <polygon points="30,40 70,15 110,40 70,55" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2"/>
        <polygon points="110,40 70,15 80,10 120,35" fill="#1D4ED8" stroke="#1E40AF" stroke-width="2"/>
        <rect x="62" y="5" width="16" height="12" rx="4" fill="#EF4444"/>
        <!-- Body -->
        <polygon points="30,40 110,40 110,170 30,170" fill="#FFFFFF" stroke="#93C5FD" stroke-width="2"/>
        <polygon points="110,40 135,28 135,158 110,170" fill="#E2E8F0" stroke="#93C5FD" stroke-width="2"/>
        <!-- Graphic on carton -->
        <path d="M30,100 Q70,80 110,100 L110,170 L30,170 Z" fill="#3B82F6"/>
        <circle cx="70" cy="85" r="22" fill="#DBEAFE"/>
        <text x="70" y="82" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#1E40AF" text-anchor="middle">rajo</text>
        <text x="70" y="96" font-family="system-ui, sans-serif" font-weight="800" font-size="10" fill="#2563EB" text-anchor="middle">1,5%</text>
        <text x="70" y="135" font-family="system-ui, sans-serif" font-weight="700" font-size="13" fill="#FFFFFF" text-anchor="middle">MLIEKO</text>
        <text x="70" y="152" font-family="system-ui, sans-serif" font-weight="600" font-size="10" fill="#BFDBFE" text-anchor="middle">1 LITER</text>
      </g>
    `
  },
  {
    slug: 'banovecky-polostiepok-neudeny-190g',
    name: 'Bánovecký pološtiepok',
    brand: 'MILSY',
    package: '190 g',
    bgColor: '#FFFBEB',
    accentColor: '#D97706',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Syry',
    svgInner: `
      <!-- Traditional Slovak Oštiepok -->
      <g transform="translate(100, 70)">
        <ellipse cx="100" cy="165" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <!-- Main oval cheese shape -->
        <path d="M30,85 C20,30 180,30 170,85 C160,140 40,140 30,85 Z" fill="#FEF08A" stroke="#EAB308" stroke-width="3"/>
        <!-- Traditional carved wooden folk motifs on cheese -->
        <ellipse cx="100" cy="85" rx="55" ry="32" fill="none" stroke="#CA8A04" stroke-width="2" stroke-dasharray="6,4"/>
        <path d="M55,85 Q100,55 145,85 Q100,115 55,85 Z" fill="none" stroke="#B45309" stroke-width="2"/>
        <circle cx="100" cy="85" r="14" fill="#FDE047" stroke="#B45309" stroke-width="2"/>
        <text x="100" y="89" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#78350F" text-anchor="middle">190g</text>
        <!-- Package label band -->
        <rect x="75" y="125" width="50" height="18" rx="4" fill="#0284C7"/>
        <text x="100" y="137" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FFFFFF" text-anchor="middle">BÁNOVECKÝ</text>
      </g>
    `
  },
  {
    slug: 'giana-gulatozrnna-ryza-1kg',
    name: 'Guľatozrnná ryža lúpaná',
    brand: 'GIANA',
    package: '1 kg',
    bgColor: '#F0FDF4',
    accentColor: '#16A34A',
    badgeBg: '#BBF7D0',
    badgeText: '#14532D',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <!-- Rice Bag Packaging -->
      <g transform="translate(120, 60)">
        <ellipse cx="80" cy="180" rx="75" ry="16" fill="#000" opacity="0.08"/>
        <!-- Pillow bag -->
        <path d="M25,30 C50,20 110,20 135,30 C150,70 148,140 135,175 C110,185 50,185 25,175 C12,140 10,70 25,30 Z" fill="#0284C7" stroke="#0369A1" stroke-width="2.5"/>
        <!-- Top sealed seam -->
        <path d="M22,30 C50,22 110,22 138,30" stroke="#38BDF8" stroke-width="4" stroke-dasharray="3,2"/>
        <!-- Window with rice grains -->
        <ellipse cx="80" cy="115" rx="38" ry="32" fill="#FFFFFF" stroke="#38BDF8" stroke-width="2"/>
        <!-- Grains inside window -->
        <ellipse cx="70" cy="105" rx="6" ry="3.5" fill="#E2E8F0" transform="rotate(25, 70, 105)"/>
        <ellipse cx="88" cy="108" rx="6" ry="3.5" fill="#E2E8F0" transform="rotate(-35, 88, 108)"/>
        <ellipse cx="76" cy="122" rx="6" ry="3.5" fill="#CBD5E1" transform="rotate(10, 76, 122)"/>
        <ellipse cx="90" cy="125" rx="6" ry="3.5" fill="#E2E8F0" transform="rotate(45, 90, 125)"/>
        <!-- Brand banner -->
        <rect x="42" y="48" width="76" height="24" rx="4" fill="#DC2626"/>
        <text x="80" y="65" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">Giana</text>
        <text x="80" y="82" font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="#FFFFFF" text-anchor="middle">RYŽA 1kg</text>
        <text x="80" y="162" font-family="system-ui, sans-serif" font-weight="700" font-size="10" fill="#BAE6FD" text-anchor="middle">GUĽATOZRNNÁ</text>
      </g>
    `
  },
  {
    slug: 'mlete-maso-mix-bravcovo-hovadzie-500g',
    name: 'Mleté mäso MIX 500 g',
    brand: 'Mäsiarov výber',
    package: '500 g',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FECACA',
    badgeText: '#7F1D1D',
    category: 'Mäso a hydina',
    svgInner: `
      <!-- Minced Meat in Plastic Tray with Film -->
      <g transform="translate(100, 75)">
        <ellipse cx="100" cy="155" rx="95" ry="16" fill="#000" opacity="0.08"/>
        <!-- Black / transparent tray -->
        <rect x="15" y="45" width="170" height="95" rx="14" fill="#18181B" stroke="#27272A" stroke-width="2"/>
        <!-- Minced meat texture -->
        <rect x="25" y="55" width="150" height="75" rx="8" fill="#EF4444"/>
        <!-- Minced stripes pattern -->
        <g stroke="#F87171" stroke-width="4" stroke-linecap="round">
          <line x1="40" y1="65" x2="160" y2="65"/>
          <line x1="35" y1="75" x2="165" y2="75"/>
          <line x1="38" y1="85" x2="162" y2="85"/>
          <line x1="35" y1="95" x2="165" y2="95"/>
          <line x1="40" y1="105" x2="160" y2="105"/>
          <line x1="45" y1="115" x2="155" y2="115"/>
        </g>
        <!-- Transparent film sheen -->
        <path d="M25,55 L90,55 L40,130 L25,130 Z" fill="#FFFFFF" opacity="0.15"/>
        <!-- Price / Fresh label sticker -->
        <rect x="110" y="40" width="65" height="42" rx="4" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5" transform="rotate(4, 142, 61)"/>
        <text x="142" y="55" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#991B1B" text-anchor="middle" transform="rotate(4, 142, 61)">MIX 50/50</text>
        <text x="142" y="68" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#18181B" text-anchor="middle" transform="rotate(4, 142, 61)">500 g</text>
        <text x="142" y="77" font-family="system-ui, sans-serif" font-weight="600" font-size="7" fill="#16A34A" text-anchor="middle" transform="rotate(4, 142, 61)">100% SK CHOV</text>
      </g>
    `
  },
  {
    slug: 'kuracie-stvrte-chladene-1kg',
    name: 'Kuracie štvrte chladené',
    brand: 'HSH Hydina',
    package: '1 kg',
    bgColor: '#FFF7ED',
    accentColor: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeText: '#7C2D12',
    category: 'Mäso a hydina',
    svgInner: `
      <!-- Chicken Quarters on Tray -->
      <g transform="translate(100, 70)">
        <ellipse cx="100" cy="165" rx="90" ry="16" fill="#000" opacity="0.08"/>
        <!-- Yellow foam tray -->
        <rect x="15" y="45" width="170" height="105" rx="14" fill="#FEF08A" stroke="#FACC15" stroke-width="2"/>
        <!-- Chicken Leg 1 -->
        <path d="M40,110 C30,75 75,55 105,75 C115,85 125,95 135,100 C145,105 155,102 160,108 C163,112 155,120 145,116 C135,112 110,125 85,130 C55,135 45,125 40,110 Z" fill="#FED7AA" stroke="#F97316" stroke-width="2.5"/>
        <circle cx="158" cy="110" r="5" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.5"/>
        <!-- Chicken texture seasoning -->
        <circle cx="70" cy="85" r="2" fill="#EA580C"/>
        <circle cx="85" cy="95" r="2" fill="#EA580C"/>
        <circle cx="65" cy="105" r="2" fill="#EA580C"/>
        <!-- Super Label -->
        <rect x="25" y="55" width="55" height="30" rx="4" fill="#15803D"/>
        <text x="52" y="68" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">SLOVENSKÉ</text>
        <text x="52" y="79" font-family="system-ui, sans-serif" font-weight="800" font-size="9" fill="#FEF08A" text-anchor="middle">KURČA 1kg</text>
      </g>
    `
  },
  {
    slug: 'banany-cerstve-volne-1kg',
    name: 'Banány čerstvé voľné',
    brand: 'Chiquita / Premium',
    package: '1 kg',
    bgColor: '#FEFCE8',
    accentColor: '#CA8A04',
    badgeBg: '#FEF08A',
    badgeText: '#713F12',
    category: 'Ovocie a zelenina',
    svgInner: `
      <!-- Banana Cluster -->
      <g transform="translate(100, 60)">
        <ellipse cx="100" cy="180" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <!-- Banana 1 back -->
        <path d="M50,40 Q90,30 140,75 Q165,100 170,140 Q130,120 95,85 Q65,60 50,40 Z" fill="#FACC15" stroke="#EAB308" stroke-width="2"/>
        <!-- Banana 2 middle -->
        <path d="M45,42 Q80,45 120,95 Q145,130 140,165 Q110,135 80,95 Q55,65 45,42 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="2.5"/>
        <!-- Banana 3 front -->
        <path d="M45,45 Q65,70 85,120 Q105,155 110,175 Q85,145 65,105 Q50,75 45,45 Z" fill="#FEF08A" stroke="#CA8A04" stroke-width="2.5"/>
        <!-- Stem -->
        <path d="M40,35 L52,48 L42,54 L32,40 Z" fill="#4D7C0F" stroke="#365314" stroke-width="1.5"/>
        <circle cx="36" cy="37" r="3" fill="#15803D"/>
        <!-- Blue banana sticker -->
        <ellipse cx="105" cy="115" rx="10" ry="13" fill="#0284C7" transform="rotate(25, 105, 115)"/>
        <circle cx="105" cy="115" r="7" fill="#FDE047"/>
        <!-- Tips -->
        <path d="M168,138 L173,143 L166,145 Z" fill="#713F12"/>
        <path d="M138,163 L142,168 L136,170 Z" fill="#713F12"/>
      </g>
    `
  },
  {
    slug: 'brokolica-cerstva-balena-500g',
    name: 'Brokolica čerstvá balená',
    brand: 'Svieža úroda',
    package: '500 g',
    bgColor: '#F0FDF4',
    accentColor: '#16A34A',
    badgeBg: '#BBF7D0',
    badgeText: '#14532D',
    category: 'Ovocie a zelenina',
    svgInner: `
      <!-- Broccoli Head -->
      <g transform="translate(110, 60)">
        <ellipse cx="90" cy="180" rx="70" ry="15" fill="#000" opacity="0.08"/>
        <!-- Stalk -->
        <path d="M75,115 L65,175 L115,175 L105,115 Z" fill="#86EFAC" stroke="#16A34A" stroke-width="2.5"/>
        <!-- Floret clusters -->
        <circle cx="50" cy="95" r="35" fill="#15803D" stroke="#166534" stroke-width="2"/>
        <circle cx="130" cy="95" r="35" fill="#15803D" stroke="#166534" stroke-width="2"/>
        <circle cx="90" cy="65" r="42" fill="#16A34A" stroke="#15803D" stroke-width="2.5"/>
        <circle cx="65" cy="70" r="28" fill="#22C55E" stroke="#16A34A" stroke-width="2"/>
        <circle cx="115" cy="70" r="28" fill="#22C55E" stroke="#16A34A" stroke-width="2"/>
        <circle cx="90" cy="95" r="32" fill="#15803D"/>
        <!-- Texture dots -->
        <circle cx="85" cy="55" r="2" fill="#DCFCE7"/>
        <circle cx="98" cy="60" r="2" fill="#DCFCE7"/>
        <circle cx="60" cy="68" r="2" fill="#DCFCE7"/>
        <circle cx="120" cy="68" r="2" fill="#DCFCE7"/>
        <!-- Clear wrap band -->
        <rect x="55" y="145" width="70" height="15" rx="3" fill="#38BDF8" opacity="0.8"/>
        <text x="90" y="156" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FFFFFF" text-anchor="middle">500 g FRESH</text>
      </g>
    `
  },
  {
    slug: 'vajcia-podstielkovy-chov-m-10ks',
    name: 'Vajcia podstielkový chov M',
    brand: 'Balticovo',
    package: '10 ks',
    bgColor: '#FAF5FF',
    accentColor: '#9333EA',
    badgeBg: '#E9D5FF',
    badgeText: '#581C87',
    category: 'Mliečne výrobky a vajcia',
    svgInner: `
      <!-- Egg Carton Box 10-pack open -->
      <g transform="translate(100, 70)">
        <ellipse cx="100" cy="165" rx="95" ry="16" fill="#000" opacity="0.08"/>
        <!-- Carton Base -->
        <path d="M15,95 L30,150 L170,150 L185,95 Z" fill="#D6D3D1" stroke="#A8A29E" stroke-width="2.5"/>
        <!-- 5 Eggs visible -->
        <ellipse cx="45" cy="95" rx="15" ry="22" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
        <ellipse cx="72" cy="92" rx="15" ry="22" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
        <ellipse cx="100" cy="95" rx="15" ry="22" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
        <ellipse cx="128" cy="92" rx="15" ry="22" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
        <ellipse cx="155" cy="95" rx="15" ry="22" fill="#FBBF24" stroke="#D97706" stroke-width="1.5"/>
        <!-- Open Lid angled back -->
        <polygon points="15,95 40,40 160,40 185,95" fill="#E7E5E4" stroke="#A8A29E" stroke-width="2"/>
        <rect x="55" y="48" width="90" height="35" rx="4" fill="#059669"/>
        <text x="100" y="64" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">10 VAJEC</text>
        <text x="100" y="76" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#A7F3D0" text-anchor="middle">VEĽKOSŤ M • PODSTIELKA</text>
      </g>
    `
  },
  {
    slug: 'rajo-mnam-smotanovy-jogurt-jahoda-145g',
    name: 'Mňam Duo jogurt jahoda',
    brand: 'RAJO',
    package: '145 g',
    bgColor: '#FFF1F2',
    accentColor: '#E11D48',
    badgeBg: '#FECDD3',
    badgeText: '#881337',
    category: 'Mliečne výrobky',
    svgInner: `
      <!-- Yogurt Pot with Strawberry -->
      <g transform="translate(120, 65)">
        <ellipse cx="80" cy="175" rx="70" ry="15" fill="#000" opacity="0.08"/>
        <!-- Cup tapered -->
        <path d="M30,55 L45,160 L115,160 L130,55 Z" fill="#FFFFFF" stroke="#FDA4AF" stroke-width="2.5"/>
        <!-- Foil Top Lid with Tab -->
        <ellipse cx="80" cy="55" rx="55" ry="16" fill="#E11D48" stroke="#BE123C" stroke-width="2"/>
        <path d="M130,52 Q145,55 140,65 Q132,65 125,58 Z" fill="#BE123C"/>
        <!-- Printed Graphics on Cup -->
        <path d="M35,95 Q80,115 125,95 L120,140 Q80,160 40,140 Z" fill="#FB7185"/>
        <text x="80" y="85" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#E11D48" text-anchor="middle">mňam!</text>
        <text x="80" y="118" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">DUO JAHODA</text>
        <text x="80" y="132" font-family="system-ui, sans-serif" font-weight="600" font-size="9" fill="#FFF1F2" text-anchor="middle">145 g smotanový</text>
        <!-- Little Strawberry Icon -->
        <path d="M74,142 Q80,154 86,142 Q86,136 74,136 Z" fill="#E11D48"/>
        <polygon points="78,136 82,136 80,132" fill="#15803D"/>
      </g>
    `
  },
  {
    slug: 'popradska-kava-extra-special-mleta-250g',
    name: 'Popradská káva Extra špeciál',
    brand: 'Popradská',
    package: '250 g',
    bgColor: '#FAF5FF',
    accentColor: '#7E22CE',
    badgeBg: '#F3E8FF',
    badgeText: '#581C87',
    category: 'Káva a čaj',
    svgInner: `
      <!-- Famous Slovak Blue/Gold Coffee Brick Pack -->
      <g transform="translate(120, 60)">
        <ellipse cx="80" cy="180" rx="65" ry="15" fill="#000" opacity="0.08"/>
        <!-- Vacuum Brick Pack 3D -->
        <polygon points="35,45 105,30 135,45 65,60" fill="#1E3A8A" stroke="#1E40AF" stroke-width="2"/>
        <polygon points="35,45 65,60 65,175 35,160" fill="#172554" stroke="#1E40AF" stroke-width="2"/>
        <polygon points="65,60 135,45 135,160 65,175" fill="#1D4ED8" stroke="#1E40AF" stroke-width="2"/>
        <!-- Gold Medallion & Label -->
        <circle cx="100" cy="95" r="24" fill="#FACC15" stroke="#EAB308" stroke-width="2"/>
        <text x="100" y="93" font-family="serif" font-weight="900" font-size="11" fill="#78350F" text-anchor="middle">EXTRA</text>
        <text x="100" y="104" font-family="system-ui, sans-serif" font-weight="800" font-size="7" fill="#78350F" text-anchor="middle">ŠPECIÁL</text>
        <text x="100" y="135" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">Popradská</text>
        <text x="100" y="150" font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="#93C5FD" text-anchor="middle">PRAŽENÁ MLETÁ 250g</text>
      </g>
    `
  },
  {
    slug: 'psenicna-muka-hladka-t650-1kg',
    name: 'Pšeničná múka hladká T650',
    brand: 'Babičkina voľba',
    package: '1 kg',
    bgColor: '#FFFBEB',
    accentColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#78350F',
    category: 'Múka a pečenie',
    svgInner: `
      <!-- Paper Flour Bag -->
      <g transform="translate(120, 60)">
        <ellipse cx="80" cy="180" rx="70" ry="15" fill="#000" opacity="0.08"/>
        <!-- Paper Bag shape -->
        <path d="M30,35 L130,35 L135,175 L25,175 Z" fill="#FEF3C7" stroke="#D97706" stroke-width="2.5"/>
        <!-- Top Folded Paper Edge -->
        <polygon points="30,35 80,45 130,35 80,25" fill="#FDE68A" stroke="#D97706" stroke-width="2"/>
        <!-- Blue ribbon emblem -->
        <rect x="45" y="65" width="70" height="28" rx="4" fill="#1E40AF"/>
        <text x="80" y="83" font-family="serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">HLADKÁ</text>
        <!-- Big T 650 -->
        <text x="80" y="120" font-family="system-ui, sans-serif" font-weight="900" font-size="24" fill="#B45309" text-anchor="middle">T 650</text>
        <text x="80" y="142" font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="#78350F" text-anchor="middle">PŠENIČNÁ MÚKA</text>
        <text x="80" y="160" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#1E40AF" text-anchor="middle">1 kg</text>
      </g>
    `
  },
  {
    slug: 'repkovy-olej-rafinovany-1l',
    name: 'Repkový olej rafinovaný',
    brand: 'Vénusz',
    package: '1 l',
    bgColor: '#FEFCE8',
    accentColor: '#CA8A04',
    badgeBg: '#FEF08A',
    badgeText: '#713F12',
    category: 'Oleje a dochucovadlá',
    svgInner: `
      <!-- Clear Plastic Oil Bottle with Golden Liquid -->
      <g transform="translate(120, 50)">
        <ellipse cx="80" cy="190" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <!-- Cap -->
        <rect x="70" y="15" width="20" height="15" rx="3" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
        <!-- Neck -->
        <path d="M72,30 L72,50 L50,80 L50,185 L110,185 L110,80 L88,30 Z" fill="#FEF08A" stroke="#CA8A04" stroke-width="2.5"/>
        <!-- Ribbed Bottle Grips -->
        <line x1="52" y1="100" x2="108" y2="100" stroke="#FACC15" stroke-width="2"/>
        <line x1="52" y1="110" x2="108" y2="110" stroke="#FACC15" stroke-width="2"/>
        <line x1="52" y1="120" x2="108" y2="120" stroke="#FACC15" stroke-width="2"/>
        <!-- Label -->
        <rect x="52" y="125" width="56" height="45" rx="3" fill="#CA8A04"/>
        <text x="80" y="142" font-family="serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">Vénusz</text>
        <text x="80" y="155" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FEF08A" text-anchor="middle">REPKOPVÝ OLEJ</text>
        <text x="80" y="165" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#FFFFFF" text-anchor="middle">100% ČISTÝ • 1L</text>
      </g>
    `
  },
  {
    slug: 'panzani-torti-tricolore-vretena-500g',
    name: 'Cestoviny Torti Tricolore',
    brand: 'Panzani',
    package: '500 g',
    bgColor: '#FFF7ED',
    accentColor: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeText: '#7C2D12',
    category: 'Cestoviny',
    svgInner: `
      <!-- Panzani Pasta Bag -->
      <g transform="translate(120, 60)">
        <ellipse cx="80" cy="180" rx="70" ry="15" fill="#000" opacity="0.08"/>
        <!-- Plastic Bag -->
        <path d="M30,35 L130,35 L140,175 L20,175 Z" fill="#15803D" stroke="#166534" stroke-width="2.5"/>
        <!-- Window showing tricolor pasta -->
        <rect x="40" y="85" width="80" height="60" rx="6" fill="#FFFBEB" stroke="#FDE047" stroke-width="2"/>
        <!-- Fusilli spirals inside -->
        <path d="M50,95 Q60,105 50,115" stroke="#EAB308" stroke-width="4" stroke-linecap="round"/>
        <path d="M68,100 Q78,110 68,120" stroke="#DC2626" stroke-width="4" stroke-linecap="round"/>
        <path d="M86,95 Q96,105 86,115" stroke="#16A34A" stroke-width="4" stroke-linecap="round"/>
        <path d="M104,102 Q114,112 104,122" stroke="#EAB308" stroke-width="4" stroke-linecap="round"/>
        <!-- Brand banner -->
        <rect x="42" y="48" width="76" height="26" rx="4" fill="#DC2626"/>
        <text x="80" y="65" font-family="serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle">PANZANI</text>
        <text x="80" y="80" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FEF08A" text-anchor="middle">TORTI TRICOLORE 500g</text>
      </g>
    `
  },
  {
    slug: 'richtar-kvaskovy-chlieb-zemiakovy-405g',
    name: 'Kváskový chlieb zemiakový',
    brand: 'La Lorraine',
    package: '405 g',
    bgColor: '#FFFBEB',
    accentColor: '#B45309',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Pečivo',
    svgInner: `
      <!-- Artisan Sourdough Loaf -->
      <g transform="translate(100, 75)">
        <ellipse cx="100" cy="155" rx="95" ry="16" fill="#000" opacity="0.08"/>
        <!-- Round crusty loaf -->
        <path d="M20,130 C15,70 60,35 100,35 C140,35 185,70 180,130 C150,145 50,145 20,130 Z" fill="#B45309" stroke="#78350F" stroke-width="3"/>
        <!-- Flour dusted top -->
        <path d="M45,75 Q100,50 155,75" fill="none" stroke="#FEF3C7" stroke-width="12" opacity="0.5" stroke-linecap="round"/>
        <!-- Artisan scoring cuts -->
        <path d="M50,80 Q100,60 150,80" fill="none" stroke="#FDE68A" stroke-width="4"/>
        <path d="M70,95 Q100,85 130,95" fill="none" stroke="#FDE68A" stroke-width="3.5"/>
        <path d="M60,65 L75,78" stroke="#FDE68A" stroke-width="3"/>
        <path d="M125,78 L140,65" stroke="#FDE68A" stroke-width="3"/>
        <!-- Kraft paper bakery band -->
        <rect x="75" y="115" width="50" height="24" rx="4" fill="#78350F"/>
        <text x="100" y="128" font-family="serif" font-weight="900" font-size="8" fill="#FEF3C7" text-anchor="middle">KVÁSKOVÝ</text>
        <text x="100" y="136" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#FDE68A" text-anchor="middle">ZEMIAKOVÝ 405g</text>
      </g>
    `
  },
  {
    slug: 'kornbageta-stredna-la-lorraine-115g',
    name: 'Kornbageta stredná cereálna',
    brand: 'La Lorraine',
    package: '115 g',
    bgColor: '#FFFBEB',
    accentColor: '#B45309',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Pečivo',
    svgInner: `
      <!-- Cereal Baguette with Seeds -->
      <g transform="translate(90, 80)">
        <ellipse cx="110" cy="150" rx="100" ry="14" fill="#000" opacity="0.08"/>
        <!-- Long Baguette angled -->
        <path d="M15,120 C10,95 35,75 70,70 L170,80 C205,85 215,110 200,125 C175,135 140,135 70,135 C35,135 20,130 15,120 Z" fill="#D97706" stroke="#92400E" stroke-width="3"/>
        <!-- Baguette Diagonal Slits -->
        <line x1="55" y1="80" x2="70" y2="125" stroke="#FEF3C7" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="90" y1="82" x2="105" y2="127" stroke="#FEF3C7" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="125" y1="84" x2="140" y2="129" stroke="#FEF3C7" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="160" y1="86" x2="175" y2="126" stroke="#FEF3C7" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Sesame / flax seeds on crust -->
        <circle cx="80" cy="95" r="1.5" fill="#18181B"/>
        <circle cx="115" cy="98" r="1.5" fill="#FEF3C7"/>
        <circle cx="150" cy="102" r="1.5" fill="#18181B"/>
        <circle cx="98" cy="115" r="1.5" fill="#18181B"/>
        <circle cx="135" cy="118" r="1.5" fill="#FEF3C7"/>
      </g>
    `
  },
  {
    slug: 'tekovsky-salamovy-syr-udeny-1kg',
    name: 'Tekovský salámový syr údený',
    brand: 'Levmilk',
    package: '1 kg',
    bgColor: '#FFFBEB',
    accentColor: '#92400E',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Syry',
    svgInner: `
      <!-- Smoked Salami Cheese Roll with Cut Slice -->
      <g transform="translate(100, 70)">
        <ellipse cx="100" cy="165" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <!-- Smoked golden-brown cylinder roll -->
        <path d="M40,65 L145,65 C165,65 175,85 175,105 C175,125 165,145 145,145 L40,145 Z" fill="#B45309" stroke="#78350F" stroke-width="2.5"/>
        <!-- Cut yellow face on left -->
        <ellipse cx="40" cy="105" rx="20" ry="40" fill="#FEF08A" stroke="#CA8A04" stroke-width="2"/>
        <ellipse cx="40" cy="105" rx="12" ry="24" fill="#FDE047" opacity="0.6"/>
        <!-- String netting marks of smoking -->
        <path d="M75,65 Q85,105 75,145" stroke="#78350F" stroke-width="2" stroke-dasharray="4,4"/>
        <path d="M110,65 Q120,105 110,145" stroke="#78350F" stroke-width="2" stroke-dasharray="4,4"/>
        <path d="M145,65 Q155,105 145,145" stroke="#78350F" stroke-width="2" stroke-dasharray="4,4"/>
        <!-- Label banner -->
        <rect x="80" y="92" width="60" height="26" rx="4" fill="#991B1B"/>
        <text x="110" y="105" font-family="serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">TEKOVSKÝ</text>
        <text x="110" y="115" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#FEF08A" text-anchor="middle">ÚDENÝ SYR</text>
      </g>
    `
  },
  {
    slug: 'mutti-kecup-classico-300g',
    name: 'Paradajkový kečup Classico',
    brand: 'Mutti',
    package: '300 g',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FECACA',
    badgeText: '#7F1D1D',
    category: 'Oleje a dochucovadlá',
    svgInner: `
      <!-- Mutti Glass Ketchup Bottle -->
      <g transform="translate(125, 50)">
        <ellipse cx="75" cy="190" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <!-- Red Cap -->
        <rect x="63" y="15" width="24" height="18" rx="3" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
        <!-- Glass bottle with deep red ketchup -->
        <path d="M66,33 L66,60 L45,95 L45,185 L105,185 L105,95 L84,33 Z" fill="#B91C1C" stroke="#7F1D1D" stroke-width="2.5"/>
        <!-- Glass shine highlight -->
        <path d="M48,100 L55,100 L55,180 L48,180 Z" fill="#FFFFFF" opacity="0.2"/>
        <!-- Iconic Mutti Tomato Label -->
        <rect x="47" y="110" width="56" height="52" rx="4" fill="#FFFFFF" stroke="#DC2626" stroke-width="2"/>
        <!-- Mutti Red Gold Emblem -->
        <rect x="52" y="115" width="46" height="20" rx="2" fill="#DC2626"/>
        <text x="75" y="130" font-family="serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">MUTTI</text>
        <text x="75" y="145" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#15803D" text-anchor="middle">KETCHUP</text>
        <text x="75" y="156" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#7F1D1D" text-anchor="middle">100% POMODORO</text>
      </g>
    `
  },
  {
    slug: 'kofola-original-nulka-1-5l-pet',
    name: 'Kofola Original 1,5 l',
    brand: 'Kofola',
    package: '1,5 l',
    bgColor: '#FAF5FF',
    accentColor: '#78350F',
    badgeBg: '#F3E8FF',
    badgeText: '#581C87',
    category: 'Nealko nápoje',
    svgInner: `
      <!-- Famous Kofola 1.5L PET Bottle -->
      <g transform="translate(125, 45)">
        <ellipse cx="75" cy="195" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <!-- Cap with tamper ring -->
        <rect x="66" y="12" width="18" height="15" rx="3" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
        <!-- PET Bottle Shape filled with dark cola -->
        <path d="M68,27 L68,45 L50,85 C50,115 58,125 50,145 L50,190 L100,190 L100,145 C92,125 100,115 100,85 L82,27 Z" fill="#2A1608" stroke="#1A0D05" stroke-width="2.5"/>
        <!-- Liquid reflection -->
        <path d="M53,95 Q58,135 53,185" stroke="#FFFFFF" stroke-width="2" opacity="0.15" fill="none"/>
        <!-- Yellow Kofola Wrap Label -->
        <rect x="50" y="105" width="50" height="42" fill="#FACC15"/>
        <text x="75" y="125" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#451A03" text-anchor="middle">kofola</text>
        <text x="75" y="137" font-family="system-ui, sans-serif" font-weight="800" font-size="7" fill="#991B1B" text-anchor="middle">ORIGINAL 1,5 l</text>
      </g>
    `
  }
];

function generateSvg(p: ProductArt): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-${p.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="${p.bgColor}" />
    </linearGradient>
    <pattern id="pat-${p.slug}" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="${p.accentColor}" opacity="0.08" />
    </pattern>
  </defs>

  <!-- Background Canvas -->
  <rect width="400" height="300" rx="16" fill="url(#bg-${p.slug})" />
  <rect width="400" height="300" rx="16" fill="url(#pat-${p.slug})" />

  <!-- Category & Package Badges Top -->
  <g transform="translate(24, 28)">
    <rect x="0" y="0" width="${Math.max(80, p.brand.length * 9 + 20)}" height="26" rx="6" fill="#123524" />
    <text x="${Math.max(40, (p.brand.length * 9 + 20) / 2)}" y="17" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#FFFFFF" text-anchor="middle">${p.brand}</text>

    <rect x="${Math.max(90, p.brand.length * 9 + 30)}" y="0" width="70" height="26" rx="6" fill="${p.badgeBg}" stroke="${p.accentColor}" stroke-width="1" />
    <text x="${Math.max(125, p.brand.length * 9 + 65)}" y="17" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="${p.badgeText}" text-anchor="middle">${p.package}</text>
  </g>

  <!-- Product Illustration Art -->
  ${p.svgInner}

  <!-- Bottom Brand Footnote -->
  <g transform="translate(20, 275)">
    <text x="0" y="0" font-family="system-ui, sans-serif" font-weight="700" font-size="12" fill="#141815" opacity="0.85">${p.name}</text>
    <text x="360" y="0" font-family="system-ui, sans-serif" font-weight="600" font-size="10" fill="${p.accentColor}" text-anchor="end">Price Tracker SK</text>
  </g>
</svg>`;
}

for (const p of products) {
  const filePath = path.join(outDir, `${p.slug}.svg`);
  fs.writeFileSync(filePath, generateSvg(p), 'utf-8');
  console.log(`✓ Generated: public/images/products/${p.slug}.svg`);
}

console.log(`\nAll ${products.length} product images successfully created in public/images/products/`);
