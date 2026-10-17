import fs from 'node:fs';
import path from 'node:path';

const outDir = path.join(process.cwd(), 'public', 'images', 'products');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export interface ProductArt {
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

export const allProductArts: ProductArt[] = [
  // 1. Tami Maslo
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
      <g transform="translate(110, 80)">
        <ellipse cx="90" cy="150" rx="90" ry="18" fill="#000" opacity="0.08"/>
        <path d="M20,60 L140,40 L170,75 L45,95 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="2"/>
        <path d="M45,95 L170,75 L170,125 L45,145 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2"/>
        <path d="M20,60 L45,95 L45,145 L20,110 Z" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
        <path d="M30,85 L155,65 L155,115 L30,135 Z" fill="#FEF08A" opacity="0.7"/>
        <text x="92" y="105" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#854D0E" text-anchor="middle" transform="rotate(-7, 92, 105)">TAMI 82%</text>
        <text x="92" y="122" font-family="system-ui, sans-serif" font-weight="700" font-size="10" fill="#A16207" text-anchor="middle" transform="rotate(-7, 92, 122)">MASLO 250g</text>
        <path d="M60,45 Q75,30 90,40 Q105,50 85,55 Z" fill="#FEF9C3" stroke="#EAB308" stroke-width="2"/>
      </g>
    `
  },
  // 2. Rajo Mlieko
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
      <g transform="translate(135, 60)">
        <ellipse cx="65" cy="175" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,45 L105,45 L115,165 L15,165 Z" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2.5"/>
        <path d="M25,45 L65,15 L105,45 Z" fill="#DBEAFE" stroke="#3B82F6" stroke-width="2"/>
        <rect x="52" y="5" width="26" height="15" rx="3" fill="#2563EB"/>
        <rect x="18" y="75" width="94" height="48" fill="#3B82F6"/>
        <text x="65" y="98" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">rajo</text>
        <text x="65" y="114" font-family="system-ui, sans-serif" font-weight="700" font-size="11" fill="#EFF6FF" text-anchor="middle">MLIEKO 1,5%</text>
        <circle cx="65" cy="142" r="12" fill="#E0F2FE"/>
        <path d="M65,134 Q68,142 65,148 Q62,142 65,134 Z" fill="#0284C7"/>
      </g>
    `
  },
  // 3. Pološtiepok
  {
    slug: 'banovecky-polostiepok-neudeny-190g',
    name: 'Pološtiepok neúdený',
    brand: 'BÁNOVECKÝ',
    package: '190 g',
    bgColor: '#FEFCE8',
    accentColor: '#CA8A04',
    badgeBg: '#FEF08A',
    badgeText: '#713F12',
    category: 'Syry',
    svgInner: `
      <g transform="translate(125, 75)">
        <ellipse cx="75" cy="140" rx="70" ry="16" fill="#000" opacity="0.08"/>
        <path d="M20,95 C20,40 130,40 130,95 C130,135 20,135 20,95 Z" fill="#FEF08A" stroke="#EAB308" stroke-width="3"/>
        <path d="M20,95 C45,115 105,115 130,95" fill="none" stroke="#CA8A04" stroke-width="2" stroke-dasharray="4 3"/>
        <path d="M35,65 C60,45 90,45 115,65" fill="none" stroke="#CA8A04" stroke-width="2"/>
        <path d="M35,80 C60,60 90,60 115,80" fill="none" stroke="#CA8A04" stroke-width="2"/>
        <rect x="42" y="86" width="66" height="24" rx="4" fill="#A16207"/>
        <text x="75" y="102" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#FFFBEB" text-anchor="middle">POLOŠTIEPOK</text>
      </g>
    `
  },
  // 4. Ryža
  {
    slug: 'giana-gulatozrnna-ryza-1kg',
    name: 'Guľatozrnná ryža',
    brand: 'GIANA',
    package: '1 kg',
    bgColor: '#F8FAFC',
    accentColor: '#475569',
    badgeBg: '#E2E8F0',
    badgeText: '#1E293B',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(130, 60)">
        <ellipse cx="70" cy="175" rx="60" ry="15" fill="#000" opacity="0.08"/>
        <path d="M25,35 C40,25 100,25 115,35 L125,165 C110,175 30,175 15,165 Z" fill="#F1F5F9" stroke="#64748B" stroke-width="2.5"/>
        <rect x="25" y="65" width="90" height="55" rx="4" fill="#0284C7"/>
        <text x="70" y="88" font-family="system-ui, sans-serif" font-weight="900" font-size="15" fill="#FFFFFF" text-anchor="middle">Giana</text>
        <text x="70" y="105" font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="#E0F2FE" text-anchor="middle">RYŽA GUĽATOZRNNÁ</text>
        <text x="70" y="145" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#0F172A" text-anchor="middle">1 kg</text>
      </g>
    `
  },
  // 5. Mleté mäso
  {
    slug: 'mlete-maso-mix-bravcovo-hovadzie-500g',
    name: 'Mleté mäso bravčovo-hovädzie',
    brand: 'MÄSIAROV VÝBER',
    package: '500 g',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FECACA',
    badgeText: '#7F1D1D',
    category: 'Mäso a hydina',
    svgInner: `
      <g transform="translate(100, 80)">
        <ellipse cx="100" cy="140" rx="95" ry="18" fill="#000" opacity="0.08"/>
        <rect x="15" y="45" width="170" height="85" rx="14" fill="#FFFFFF" stroke="#EF4444" stroke-width="2.5"/>
        <rect x="25" y="55" width="150" height="65" rx="8" fill="#F87171" opacity="0.85"/>
        <path d="M35,68 Q60,78 85,68 T135,68 T165,68" stroke="#B91C1C" stroke-width="3" fill="none"/>
        <path d="M35,85 Q60,95 85,85 T135,85 T165,85" stroke="#B91C1C" stroke-width="3" fill="none"/>
        <path d="M35,102 Q60,112 85,102 T135,102 T165,102" stroke="#B91C1C" stroke-width="3" fill="none"/>
        <rect x="110" y="50" width="55" height="35" rx="4" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>
        <text x="137" y="65" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#991B1B" text-anchor="middle">MIX 500g</text>
        <text x="137" y="76" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#15803D" text-anchor="middle">SK PÔVOD</text>
      </g>
    `
  },
  // 6. Kuracie štvrte
  {
    slug: 'kuracie-stvrte-chladene-1kg',
    name: 'Kuracie štvrte chladené',
    brand: 'HYZA',
    package: '1 kg',
    bgColor: '#FFF7ED',
    accentColor: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeText: '#7C2D12',
    category: 'Mäso a hydina',
    svgInner: `
      <g transform="translate(100, 80)">
        <ellipse cx="100" cy="140" rx="90" ry="18" fill="#000" opacity="0.08"/>
        <rect x="15" y="45" width="170" height="85" rx="14" fill="#FFFFFF" stroke="#FB923C" stroke-width="2.5"/>
        <path d="M40,90 Q55,60 90,75 Q115,85 145,70 Q160,85 145,105 Q105,120 40,90 Z" fill="#FDBA74" stroke="#EA580C" stroke-width="2"/>
        <ellipse cx="135" cy="78" rx="8" ry="6" fill="#FED7AA"/>
        <rect x="25" y="52" width="60" height="28" rx="4" fill="#FFFFFF" stroke="#EA580C" stroke-width="1.5"/>
        <text x="55" y="66" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#9A3412" text-anchor="middle">HYZA SK</text>
        <text x="55" y="75" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#166534" text-anchor="middle">CHLADENÉ 1kg</text>
      </g>
    `
  },
  // 7. Banány
  {
    slug: 'banany-cerstve-volne-1kg',
    name: 'Banány čerstvé voľné',
    brand: 'PREMIUM',
    package: '1 kg',
    bgColor: '#FEFCE8',
    accentColor: '#EAB308',
    badgeBg: '#FEF08A',
    badgeText: '#713F12',
    category: 'Ovocie a zelenina',
    svgInner: `
      <g transform="translate(100, 75)">
        <ellipse cx="100" cy="145" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <path d="M30,110 C50,145 130,145 165,70 C155,75 90,120 45,95 Z" fill="#FDE047" stroke="#CA8A04" stroke-width="2.5"/>
        <path d="M20,95 C45,130 125,130 160,55 C150,60 85,105 35,80 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="2.5"/>
        <path d="M15,90 L25,100 L30,92 Z" fill="#713F12"/>
        <circle cx="95" cy="100" r="10" fill="#15803D"/>
        <text x="95" y="103" font-family="system-ui, sans-serif" font-weight="900" font-size="7" fill="#FFFFFF" text-anchor="middle">BIO</text>
      </g>
    `
  },
  // 8. Brokolica
  {
    slug: 'brokolica-cerstva-balena-500g',
    name: 'Brokolica čerstvá balená',
    brand: 'ČERSTVÁ',
    package: '500 g',
    bgColor: '#F0FDF4',
    accentColor: '#16A34A',
    badgeBg: '#DCFCE7',
    badgeText: '#14532D',
    category: 'Ovocie a zelenina',
    svgInner: `
      <g transform="translate(120, 70)">
        <ellipse cx="80" cy="155" rx="65" ry="15" fill="#000" opacity="0.08"/>
        <path d="M65,115 L95,115 L88,155 L72,155 Z" fill="#86EFAC" stroke="#15803D" stroke-width="2"/>
        <circle cx="80" cy="70" r="32" fill="#16A34A"/>
        <circle cx="55" cy="90" r="28" fill="#15803D"/>
        <circle cx="105" cy="90" r="28" fill="#15803D"/>
        <circle cx="70" cy="100" r="22" fill="#22C55E"/>
        <circle cx="92" cy="100" r="22" fill="#22C55E"/>
      </g>
    `
  },
  // 9. Vajcia
  {
    slug: 'vajcia-podstielkovy-chov-m-10ks',
    name: 'Vajcia podstielkový chov M',
    brand: 'SLOVENSKÉ',
    package: '10 ks',
    bgColor: '#FAF5FF',
    accentColor: '#9333EA',
    badgeBg: '#F3E8FF',
    badgeText: '#581C87',
    category: 'Mliečne výrobky a vajcia',
    svgInner: `
      <g transform="translate(100, 80)">
        <ellipse cx="100" cy="140" rx="90" ry="18" fill="#000" opacity="0.08"/>
        <path d="M15,90 L185,90 L175,135 L25,135 Z" fill="#D6D3D1" stroke="#78716C" stroke-width="2"/>
        <path d="M10,90 L190,90 L170,55 L30,55 Z" fill="#E7E5E4" stroke="#78716C" stroke-width="2"/>
        <ellipse cx="55" cy="85" rx="14" ry="18" fill="#FDBA74" stroke="#EA580C" stroke-width="1.5"/>
        <ellipse cx="85" cy="85" rx="14" ry="18" fill="#FDBA74" stroke="#EA580C" stroke-width="1.5"/>
        <ellipse cx="115" cy="85" rx="14" ry="18" fill="#FDBA74" stroke="#EA580C" stroke-width="1.5"/>
        <ellipse cx="145" cy="85" rx="14" ry="18" fill="#FDBA74" stroke="#EA580C" stroke-width="1.5"/>
        <rect x="65" y="60" width="70" height="24" rx="4" fill="#15803D"/>
        <text x="100" y="76" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">10x M PODSTIELKA</text>
      </g>
    `
  },
  // 10. Jogurt jahoda
  {
    slug: 'rajo-mnam-smotanovy-jogurt-jahoda-145g',
    name: 'Mňam smotanový jogurt jahoda',
    brand: 'RAJO',
    package: '145 g',
    bgColor: '#FFF1F2',
    accentColor: '#E11D48',
    badgeBg: '#FFE4E6',
    badgeText: '#881337',
    category: 'Mliečne výrobky',
    svgInner: `
      <g transform="translate(130, 75)">
        <ellipse cx="70" cy="145" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,40 L115,40 L102,135 L38,135 Z" fill="#FFFFFF" stroke="#E11D48" stroke-width="2.5"/>
        <ellipse cx="70" cy="40" rx="47" ry="12" fill="#F43F5E" stroke="#BE123C" stroke-width="2"/>
        <rect x="33" y="65" width="74" height="40" fill="#E11D48"/>
        <text x="70" y="83" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">MŇAM DUO</text>
        <text x="70" y="96" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#FFE4E6" text-anchor="middle">JAHODA 145g</text>
      </g>
    `
  },
  // 11. Popradská káva
  {
    slug: 'popradska-kava-extra-special-mleta-250g',
    name: 'Káva Extra Špeciál mletá',
    brand: 'POPRADSKÁ',
    package: '250 g',
    bgColor: '#FAF5FF',
    accentColor: '#581C87',
    badgeBg: '#F3E8FF',
    badgeText: '#3B0764',
    category: 'Káva a čaj',
    svgInner: `
      <g transform="translate(130, 65)">
        <ellipse cx="70" cy="165" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,35 L115,35 L120,155 L20,155 Z" fill="#581C87" stroke="#3B0764" stroke-width="2.5"/>
        <rect x="32" y="60" width="76" height="60" rx="4" fill="#CA8A04"/>
        <text x="70" y="85" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#FFFFFF" text-anchor="middle">EXTRA</text>
        <text x="70" y="99" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#FEF08A" text-anchor="middle">ŠPECIÁL</text>
        <text x="70" y="112" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#FFFFFF" text-anchor="middle">100% ARABICA</text>
      </g>
    `
  },
  // 12. Múka hladká T650
  {
    slug: 'psenicna-muka-hladka-t650-1kg',
    name: 'Pšeničná múka hladká T650',
    brand: 'POHRONSKÝ RUSKOV',
    package: '1 kg',
    bgColor: '#FDFBF7',
    accentColor: '#B45309',
    badgeBg: '#FEF3C7',
    badgeText: '#78350F',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(130, 65)">
        <ellipse cx="70" cy="165" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,35 C40,25 100,25 115,35 L120,155 C105,165 35,165 20,155 Z" fill="#F5F5F4" stroke="#78716C" stroke-width="2.5"/>
        <rect x="30" y="65" width="80" height="55" rx="4" fill="#B45309"/>
        <text x="70" y="88" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#FFFFFF" text-anchor="middle">MÚKA</text>
        <text x="70" y="105" font-family="system-ui, sans-serif" font-weight="700" font-size="10" fill="#FEF3C7" text-anchor="middle">HLADKÁ T650</text>
        <text x="70" y="142" font-family="system-ui, sans-serif" font-weight="800" font-size="12" fill="#44403C" text-anchor="middle">1 kg</text>
      </g>
    `
  },
  // 13. Repkový olej
  {
    slug: 'repkovy-olej-rafinovany-1l',
    name: 'Repkový olej rafinovaný',
    brand: 'FLIOL',
    package: '1 l',
    bgColor: '#FEFCE8',
    accentColor: '#CA8A04',
    badgeBg: '#FEF08A',
    badgeText: '#713F12',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(135, 60)">
        <ellipse cx="65" cy="175" rx="45" ry="14" fill="#000" opacity="0.08"/>
        <path d="M40,45 L90,45 L95,165 L35,165 Z" fill="#FEF08A" stroke="#CA8A04" stroke-width="2.5" opacity="0.9"/>
        <path d="M52,20 L78,20 L78,45 L52,45 Z" fill="#CA8A04"/>
        <rect x="56" y="10" width="18" height="12" rx="3" fill="#EAB308"/>
        <rect x="42" y="80" width="46" height="48" fill="#15803D"/>
        <text x="65" y="102" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">REPKY</text>
        <text x="65" y="116" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#BBF7D0" text-anchor="middle">100% OLEJ</text>
      </g>
    `
  },
  // 14. Panzani vretena
  {
    slug: 'panzani-torti-tricolore-vretena-500g',
    name: 'Panzani Torti Tricolore vretená',
    brand: 'PANZANI',
    package: '500 g',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FECACA',
    badgeText: '#7F1D1D',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(130, 65)">
        <ellipse cx="70" cy="165" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,35 L115,35 L118,155 L22,155 Z" fill="#DC2626" stroke="#991B1B" stroke-width="2.5"/>
        <rect x="35" y="55" width="70" height="40" rx="4" fill="#FFFFFF"/>
        <text x="70" y="78" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#15803D" text-anchor="middle">PANZANI</text>
        <text x="70" y="90" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#DC2626" text-anchor="middle">TORTI TRICOLORE</text>
        <circle cx="50" cy="125" r="10" fill="#FACC15"/>
        <circle cx="70" cy="125" r="10" fill="#15803D"/>
        <circle cx="90" cy="125" r="10" fill="#EF4444"/>
      </g>
    `
  },
  // 15. Chlieb Richtár
  {
    slug: 'richtar-kvaskovy-chlieb-zemiakovy-405g',
    name: 'Kváskový chlieb zemiakový',
    brand: 'RICHTÁR',
    package: '405 g',
    bgColor: '#FFFBEB',
    accentColor: '#92400E',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Pečivo',
    svgInner: `
      <g transform="translate(110, 80)">
        <ellipse cx="90" cy="140" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <path d="M20,105 C20,45 160,45 160,105 C160,135 20,135 20,105 Z" fill="#D97706" stroke="#78350F" stroke-width="2.5"/>
        <path d="M45,75 Q65,65 85,75" stroke="#FFFBEB" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M95,75 Q115,65 135,75" stroke="#FFFBEB" stroke-width="3" fill="none" stroke-linecap="round"/>
        <rect x="55" y="100" width="70" height="20" rx="4" fill="#78350F"/>
        <text x="90" y="114" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#FFFBEB" text-anchor="middle">KVÁSKOVÝ CHLIEB</text>
      </g>
    `
  },
  // 16. Kornbageta
  {
    slug: 'kornbageta-stredna-la-lorraine-115g',
    name: 'Kornbageta stredná',
    brand: 'LA LORRAINE',
    package: '115 g',
    bgColor: '#FEF3C7',
    accentColor: '#B45309',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Pečivo',
    svgInner: `
      <g transform="translate(100, 90)">
        <ellipse cx="100" cy="130" rx="90" ry="14" fill="#000" opacity="0.08"/>
        <path d="M15,90 C35,60 165,60 185,90 C165,115 35,115 15,90 Z" fill="#F59E0B" stroke="#B45309" stroke-width="2.5"/>
        <path d="M50,75 L65,100" stroke="#78350F" stroke-width="2.5"/>
        <path d="M85,73 L100,98" stroke="#78350F" stroke-width="2.5"/>
        <path d="M120,73 L135,98" stroke="#78350F" stroke-width="2.5"/>
        <path d="M155,75 L170,100" stroke="#78350F" stroke-width="2.5"/>
      </g>
    `
  },
  // 17. Tekovský salámový syr
  {
    slug: 'tekovsky-salamovy-syr-udeny-1kg',
    name: 'Tekovský salámový syr údený',
    brand: 'LEVICKÉ MLIEKÁRNE',
    package: '1 kg',
    bgColor: '#FEF3C7',
    accentColor: '#B45309',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Syry',
    svgInner: `
      <g transform="translate(105, 80)">
        <ellipse cx="95" cy="140" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <path d="M30,65 L160,65 L160,115 L30,115 Z" fill="#D97706" stroke="#92400E" stroke-width="2.5"/>
        <ellipse cx="30" cy="90" rx="15" ry="25" fill="#B45309" stroke="#92400E" stroke-width="2"/>
        <ellipse cx="160" cy="90" rx="15" ry="25" fill="#D97706" stroke="#92400E" stroke-width="2"/>
        <rect x="65" y="78" width="60" height="24" rx="4" fill="#78350F"/>
        <text x="95" y="93" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#FFFBEB" text-anchor="middle">TEKOVSKÝ SYR</text>
      </g>
    `
  },
  // 18. Mutti Kečup
  {
    slug: 'mutti-kecup-classico-300g',
    name: 'Mutti Kečup Classico',
    brand: 'MUTTI',
    package: '300 g',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FECACA',
    badgeText: '#7F1D1D',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(135, 65)">
        <ellipse cx="65" cy="165" rx="45" ry="14" fill="#000" opacity="0.08"/>
        <path d="M40,55 L90,55 L95,155 L35,155 Z" fill="#DC2626" stroke="#991B1B" stroke-width="2.5"/>
        <rect x="52" y="20" width="26" height="35" rx="3" fill="#DC2626"/>
        <rect x="55" y="10" width="20" height="12" rx="2" fill="#FFFFFF"/>
        <rect x="42" y="80" width="46" height="42" fill="#FFFFFF"/>
        <text x="65" y="97" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#DC2626" text-anchor="middle">MUTTI</text>
        <text x="65" y="110" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#15803D" text-anchor="middle">PARMA</text>
      </g>
    `
  },
  // 19. Kofola
  {
    slug: 'kofola-original-nulka-1-5l-pet',
    name: 'Kofola Originál',
    brand: 'KOFOLA',
    package: '1,5 l',
    bgColor: '#FFFBEB',
    accentColor: '#78350F',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Nápoje',
    svgInner: `
      <g transform="translate(125, 60)">
        <ellipse cx="75" cy="180" rx="45" ry="14" fill="#000" opacity="0.08"/>
        <path d="M50,45 L100,45 L108,170 L42,170 Z" fill="#3B1D0E" stroke="#1C0D06" stroke-width="2.5"/>
        <rect x="65" y="15" width="20" height="30" fill="#3B1D0E"/>
        <rect x="67" y="5" width="16" height="12" rx="2" fill="#DC2626"/>
        <rect x="50" y="105" width="50" height="42" fill="#FACC15"/>
        <text x="75" y="125" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#451A03" text-anchor="middle">kofola</text>
        <text x="75" y="137" font-family="system-ui, sans-serif" font-weight="800" font-size="7" fill="#991B1B" text-anchor="middle">ORIGINAL 1,5 l</text>
      </g>
    `
  },

  // -------------------------------------------------------------
  // NEW PRODUCTS (20 - 40)
  // -------------------------------------------------------------

  // 20. Liptov Bryndza
  {
    slug: 'liptov-bryndza-plnotucna-110g',
    name: 'Bryndza plnotučná slovenská',
    brand: 'LIPTOV',
    package: '110 g',
    bgColor: '#F0FDF4',
    accentColor: '#16A34A',
    badgeBg: '#DCFCE7',
    badgeText: '#14532D',
    category: 'Mliečne výrobky a vajcia',
    svgInner: `
      <g transform="translate(115, 75)">
        <ellipse cx="85" cy="145" rx="80" ry="16" fill="#000" opacity="0.08"/>
        <!-- Traditional Wooden Barrel / Tub packaging -->
        <path d="M25,55 L145,55 L140,135 L30,135 Z" fill="#FEFCE8" stroke="#15803D" stroke-width="2.5"/>
        <!-- Wood bands -->
        <rect x="27" y="65" width="116" height="10" fill="#CA8A04" opacity="0.4"/>
        <rect x="29" y="115" width="112" height="10" fill="#CA8A04" opacity="0.4"/>
        <!-- Green mountain peak emblem -->
        <path d="M60,95 L85,75 L110,95 Z" fill="#16A34A"/>
        <path d="M72,95 L85,85 L98,95 Z" fill="#FFFFFF"/>
        <text x="85" y="107" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#14532D" text-anchor="middle">LIPTOV</text>
        <text x="85" y="120" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#15803D" text-anchor="middle">100% BRYNDZA</text>
      </g>
    `
  },
  // 21. Kuracie prsné rezne Hyza
  {
    slug: 'hyza-kuracie-prsne-rezne-chladene-1kg',
    name: 'Kuracie prsné rezne chladené',
    brand: 'HYZA',
    package: '1 kg',
    bgColor: '#FFF7ED',
    accentColor: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeText: '#7C2D12',
    category: 'Mäso a hydina',
    svgInner: `
      <g transform="translate(100, 80)">
        <ellipse cx="100" cy="140" rx="90" ry="18" fill="#000" opacity="0.08"/>
        <rect x="15" y="45" width="170" height="85" rx="14" fill="#FFFFFF" stroke="#EA580C" stroke-width="2.5"/>
        <!-- 2 chicken fillets -->
        <path d="M35,90 C45,65 85,65 105,85 C95,115 50,115 35,90 Z" fill="#FED7AA" stroke="#FB923C" stroke-width="2"/>
        <path d="M85,90 C95,65 140,65 160,85 C150,115 105,115 85,90 Z" fill="#FDBA74" stroke="#FB923C" stroke-width="2"/>
        <!-- Seal label -->
        <rect x="110" y="52" width="60" height="30" rx="4" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5"/>
        <text x="140" y="66" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#991B1B" text-anchor="middle">HYZA SK</text>
        <text x="140" y="76" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#166534" text-anchor="middle">REZNE 1kg</text>
      </g>
    `
  },
  // 22. Bravčové karé
  {
    slug: 'bravcove-kare-bez-kosti-chladene-1kg',
    name: 'Bravčové karé bez kosti chladené',
    brand: 'MÄSIAROV VÝBER',
    package: '1 kg',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FECACA',
    badgeText: '#7F1D1D',
    category: 'Mäso a hydina',
    svgInner: `
      <g transform="translate(100, 80)">
        <ellipse cx="100" cy="140" rx="90" ry="18" fill="#000" opacity="0.08"/>
        <rect x="15" y="45" width="170" height="85" rx="14" fill="#FFFFFF" stroke="#DC2626" stroke-width="2.5"/>
        <!-- Pork loin meat cutlet -->
        <path d="M30,90 C40,65 160,65 165,95 C160,120 40,120 30,90 Z" fill="#F87171" stroke="#B91C1C" stroke-width="2"/>
        <path d="M30,75 C70,68 120,70 165,80" stroke="#FFFFFF" stroke-width="5" opacity="0.7" fill="none"/>
        <rect x="25" y="52" width="65" height="28" rx="4" fill="#B91C1C"/>
        <text x="57" y="66" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">BRAVČOVÉ KARÉ</text>
        <text x="57" y="75" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#FECACA" text-anchor="middle">BEZ KOSTI 1kg</text>
      </g>
    `
  },
  // 23. Dusená šunka
  {
    slug: 'mecom-dusena-sunka-vyberova-100g',
    name: 'Dusená šunka výberová krájaná',
    brand: 'MECOM',
    package: '100 g',
    bgColor: '#FFF1F2',
    accentColor: '#BE123C',
    badgeBg: '#FFE4E6',
    badgeText: '#881337',
    category: 'Mäso a hydina',
    svgInner: `
      <g transform="translate(110, 80)">
        <ellipse cx="90" cy="140" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <!-- Deli sliced ham packaging -->
        <rect x="20" y="40" width="140" height="95" rx="10" fill="#FFFFFF" stroke="#BE123C" stroke-width="2.5"/>
        <!-- Slices fan -->
        <path d="M35,95 Q85,75 135,95 Q135,115 35,115 Z" fill="#FDA4AF" stroke="#E11D48" stroke-width="1.5"/>
        <path d="M35,80 Q85,60 135,80 Q135,100 35,100 Z" fill="#F43F5E" stroke="#BE123C" stroke-width="1.5"/>
        <!-- Label banner -->
        <rect x="30" y="45" width="120" height="25" rx="4" fill="#881337"/>
        <text x="90" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">MECOM DUSENÁ ŠUNKA</text>
        <text x="90" y="67" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#FECDD3" text-anchor="middle">92% OBSAH MÄSA</text>
      </g>
    `
  },
  // 24. Spišské párky
  {
    slug: 'tauris-spisske-parky-80-200g',
    name: 'Spišské párky výberové',
    brand: 'TAURIS',
    package: '200 g',
    bgColor: '#FFF7ED',
    accentColor: '#C2410C',
    badgeBg: '#FFEDD5',
    badgeText: '#7C2D12',
    category: 'Mäso a hydina',
    svgInner: `
      <g transform="translate(110, 80)">
        <ellipse cx="90" cy="140" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <rect x="25" y="40" width="130" height="95" rx="8" fill="#FFFFFF" stroke="#C2410C" stroke-width="2"/>
        <!-- Pair of curved sausages -->
        <path d="M45,60 C45,115 70,115 70,60" fill="none" stroke="#EA580C" stroke-width="14" stroke-linecap="round"/>
        <path d="M85,60 C85,115 110,115 110,60" fill="none" stroke="#EA580C" stroke-width="14" stroke-linecap="round"/>
        <rect x="40" y="105" width="100" height="24" rx="4" fill="#9A3412"/>
        <text x="90" y="118" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">SPIŠSKÉ PÁRKY</text>
        <text x="90" y="126" font-family="system-ui, sans-serif" font-weight="700" font-size="6" fill="#FFEDD5" text-anchor="middle">ZTS ŠPECIALITA 200g</text>
      </g>
    `
  },
  // 25. Rožok štandard
  {
    slug: 'rohlík-standard-biely-50g',
    name: 'Rožok štandard biely',
    brand: 'PEKÁREŇ',
    package: '50 g',
    bgColor: '#FEF3C7',
    accentColor: '#D97706',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Pečivo',
    svgInner: `
      <g transform="translate(100, 85)">
        <ellipse cx="100" cy="135" rx="85" ry="15" fill="#000" opacity="0.08"/>
        <!-- Crescent curved roll -->
        <path d="M20,110 C35,60 165,60 180,110 C150,100 50,100 20,110 Z" fill="#FBBF24" stroke="#B45309" stroke-width="2.5"/>
        <!-- Diagonal cuts on crust -->
        <path d="M55,78 Q65,85 75,98" stroke="#92400E" stroke-width="2.5" fill="none"/>
        <path d="M90,72 Q100,82 110,95" stroke="#92400E" stroke-width="2.5" fill="none"/>
        <path d="M125,78 Q135,85 145,98" stroke="#92400E" stroke-width="2.5" fill="none"/>
        <circle cx="100" cy="70" r="1.5" fill="#FFF"/>
        <circle cx="120" cy="75" r="1.5" fill="#FFF"/>
      </g>
    `
  },
  // 26. Eidam plátky 45%
  {
    slug: 'rajo-slovensky-eidam-platky-45-100g',
    name: 'Eidam plátky 45 %',
    brand: 'RAJO',
    package: '100 g',
    bgColor: '#FEFCE8',
    accentColor: '#CA8A04',
    badgeBg: '#FEF08A',
    badgeText: '#713F12',
    category: 'Mliečne výrobky a vajcia',
    svgInner: `
      <g transform="translate(110, 80)">
        <ellipse cx="90" cy="140" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <rect x="25" y="45" width="130" height="90" rx="8" fill="#FFFFFF" stroke="#CA8A04" stroke-width="2"/>
        <!-- Yellow cheese slices stack -->
        <rect x="35" y="60" width="110" height="65" rx="4" fill="#FACC15" stroke="#EAB308" stroke-width="1.5"/>
        <!-- Cheese holes -->
        <circle cx="55" cy="80" r="6" fill="#FEF08A"/>
        <circle cx="95" cy="75" r="8" fill="#FEF08A"/>
        <circle cx="125" cy="90" r="5" fill="#FEF08A"/>
        <circle cx="75" cy="105" r="7" fill="#FEF08A"/>
        <rect x="35" y="45" width="110" height="22" rx="4" fill="#2563EB"/>
        <text x="90" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#FFFFFF" text-anchor="middle">RAJO EIDAM 45%</text>
      </g>
    `
  },
  // 27. Rajo Tvaroh jemný hrudkovitý
  {
    slug: 'rajo-tradicny-tvaroh-jemny-hrudkovity-250g',
    name: 'Tradičný tvaroh jemný hrudkovitý',
    brand: 'RAJO',
    package: '250 g',
    bgColor: '#EFF6FF',
    accentColor: '#2563EB',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
    category: 'Mliečne výrobky a vajcia',
    svgInner: `
      <g transform="translate(115, 80)">
        <ellipse cx="85" cy="140" rx="80" ry="16" fill="#000" opacity="0.08"/>
        <path d="M25,55 L145,55 L135,130 L35,130 Z" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2.5"/>
        <rect x="30" y="65" width="110" height="35" fill="#2563EB"/>
        <text x="85" y="82" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">rajo TVAROH</text>
        <text x="85" y="94" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#DBEAFE" text-anchor="middle">JEMNÝ HRUDKOVITÝ</text>
        <!-- Curd curles/dots -->
        <circle cx="65" cy="115" r="5" fill="#DBEAFE"/>
        <circle cx="85" cy="118" r="6" fill="#E0F2FE"/>
        <circle cx="105" cy="114" r="5" fill="#DBEAFE"/>
      </g>
    `
  },
  // 28. Zvolenský jogurt čokoláda
  {
    slug: 'zvolensky-smotanovy-jogurt-cokolada-145g',
    name: 'Smotanový jogurt čokoládový',
    brand: 'ZVOLENSKÝ',
    package: '145 g',
    bgColor: '#FFFBEB',
    accentColor: '#78350F',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Mliečne výrobky a vajcia',
    svgInner: `
      <g transform="translate(130, 75)">
        <ellipse cx="70" cy="145" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,40 L115,40 L102,135 L38,135 Z" fill="#FFFFFF" stroke="#78350F" stroke-width="2.5"/>
        <ellipse cx="70" cy="40" rx="47" ry="12" fill="#92400E" stroke="#78350F" stroke-width="2"/>
        <rect x="33" y="65" width="74" height="42" fill="#451A03"/>
        <text x="70" y="82" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#FEF3C7" text-anchor="middle">ZVOLENSKÝ</text>
        <text x="70" y="95" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FDE68A" text-anchor="middle">ČOKOLÁDA</text>
        <path d="M38,107 Q70,118 102,107 L98,130 L42,130 Z" fill="#5E2A0A"/>
      </g>
    `
  },
  // 29. Korunný cukor krupica
  {
    slug: 'korunny-cukor-krupica-1kg',
    name: 'Cukor krupica biely',
    brand: 'KORUNNÝ CUKOR',
    package: '1 kg',
    bgColor: '#EFF6FF',
    accentColor: '#1D4ED8',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(130, 65)">
        <ellipse cx="70" cy="165" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,35 C40,25 100,25 115,35 L120,155 C105,165 35,165 20,155 Z" fill="#FFFFFF" stroke="#1D4ED8" stroke-width="2.5"/>
        <rect x="25" y="65" width="90" height="58" rx="4" fill="#1E40AF"/>
        <!-- Crown emblem -->
        <path d="M55,80 L62,72 L70,80 L78,72 L85,80 L80,88 L60,88 Z" fill="#FACC15"/>
        <text x="70" y="102" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">KORUNNÝ</text>
        <text x="70" y="114" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#93C5FD" text-anchor="middle">KRUPICA 1kg</text>
      </g>
    `
  },
  // 30. Panzani Špagety
  {
    slug: 'panzani-spagety-semolinove-500g',
    name: 'Špagety semolinové bezvaječné',
    brand: 'PANZANI',
    package: '500 g',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FECACA',
    badgeText: '#7F1D1D',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(110, 60)">
        <ellipse cx="90" cy="175" rx="80" ry="14" fill="#000" opacity="0.08"/>
        <!-- Long pasta box -->
        <rect x="20" y="30" width="140" height="135" rx="8" fill="#DC2626" stroke="#991B1B" stroke-width="2.5"/>
        <!-- Clear transparent window showing spaghetti strands -->
        <rect x="35" y="65" width="110" height="55" rx="6" fill="#FEF08A" stroke="#EAB308" stroke-width="1.5"/>
        <line x1="45" y1="65" x2="45" y2="120" stroke="#CA8A04" stroke-width="2"/>
        <line x1="60" y1="65" x2="60" y2="120" stroke="#CA8A04" stroke-width="2"/>
        <line x1="75" y1="65" x2="75" y2="120" stroke="#CA8A04" stroke-width="2"/>
        <line x1="90" y1="65" x2="90" y2="120" stroke="#CA8A04" stroke-width="2"/>
        <line x1="105" y1="65" x2="105" y2="120" stroke="#CA8A04" stroke-width="2"/>
        <line x1="120" y1="65" x2="120" y2="120" stroke="#CA8A04" stroke-width="2"/>
        <line x1="135" y1="65" x2="135" y2="120" stroke="#CA8A04" stroke-width="2"/>
        <rect x="45" y="36" width="90" height="22" rx="4" fill="#FFFFFF"/>
        <text x="90" y="51" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#15803D" text-anchor="middle">PANZANI</text>
        <text x="90" y="142" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="#FFFFFF" text-anchor="middle">SPAGHETTI N°5</text>
      </g>
    `
  },
  // 31. Zemiaky balené 2kg
  {
    slug: 'zemiaky-konzumne-neskore-prane-balene-2kg',
    name: 'Zemiaky konzumné neskoré balené',
    brand: 'SLOVENSKÉ',
    package: '2 kg',
    bgColor: '#FAF5FF',
    accentColor: '#9333EA',
    badgeBg: '#F3E8FF',
    badgeText: '#581C87',
    category: 'Ovocie a zelenina',
    svgInner: `
      <g transform="translate(110, 70)">
        <ellipse cx="90" cy="155" rx="80" ry="16" fill="#000" opacity="0.08"/>
        <!-- Net mesh sack -->
        <path d="M35,60 C40,40 140,40 145,60 L155,145 C140,160 40,160 25,145 Z" fill="#D8B4FE" stroke="#9333EA" stroke-width="2" opacity="0.5"/>
        <!-- Potatoes inside -->
        <ellipse cx="65" cy="100" rx="22" ry="16" fill="#D97706" stroke="#92400E" stroke-width="1.5"/>
        <ellipse cx="115" cy="105" rx="24" ry="17" fill="#B45309" stroke="#78350F" stroke-width="1.5"/>
        <ellipse cx="90" cy="130" rx="26" ry="18" fill="#D97706" stroke="#92400E" stroke-width="1.5"/>
        <!-- Label tag -->
        <rect x="55" y="60" width="70" height="24" rx="4" fill="#15803D"/>
        <text x="90" y="75" font-family="system-ui, sans-serif" font-weight="900" font-size="8" fill="#FFFFFF" text-anchor="middle">ZEMIAKY 2kg</text>
      </g>
    `
  },
  // 32. Jablká Gala slovenské
  {
    slug: 'jablka-gala-slovenske-1kg',
    name: 'Jablká Gala slovenské voľné',
    brand: 'DOBRÝ JEŽKO',
    package: '1 kg',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
    category: 'Ovocie a zelenina',
    svgInner: `
      <g transform="translate(100, 75)">
        <ellipse cx="100" cy="145" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <!-- First Gala apple -->
        <circle cx="65" cy="105" r="35" fill="#EF4444" stroke="#B91C1C" stroke-width="2"/>
        <path d="M65,70 C60,55 70,50 68,45" stroke="#78350F" stroke-width="3" fill="none"/>
        <path d="M68,55 Q80,48 85,55 Q75,65 68,55 Z" fill="#22C55E"/>
        <!-- Second Gala apple (red-yellow stripe) -->
        <circle cx="125" cy="110" r="32" fill="#FACC15" stroke="#EAB308" stroke-width="2"/>
        <path d="M110,85 Q135,100 135,135 Q145,105 130,85 Z" fill="#EF4444" opacity="0.85"/>
        <path d="M125,78 C120,65 130,60 128,55" stroke="#78350F" stroke-width="3" fill="none"/>
      </g>
    `
  },
  // 33. Paradajky strapcové
  {
    slug: 'paradajky-strapcove-cervene-500g',
    name: 'Paradajky strapcové červené',
    brand: 'BABINDOL',
    package: '500 g',
    bgColor: '#FEF2F2',
    accentColor: '#DC2626',
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
    category: 'Ovocie a zelenina',
    svgInner: `
      <g transform="translate(95, 75)">
        <ellipse cx="105" cy="145" rx="85" ry="16" fill="#000" opacity="0.08"/>
        <!-- Vine stem -->
        <path d="M25,85 Q100,60 185,90" stroke="#15803D" stroke-width="4" fill="none"/>
        <!-- 4 tomatoes on vine -->
        <circle cx="45" cy="105" r="22" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
        <circle cx="85" cy="100" r="24" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <circle cx="125" cy="102" r="23" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
        <circle cx="165" cy="108" r="20" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
        <!-- Calyx leaves -->
        <path d="M85,76 L80,70 L85,65 L90,70 Z" fill="#22C55E"/>
        <path d="M125,78 L120,72 L125,67 L130,72 Z" fill="#22C55E"/>
      </g>
    `
  },
  // 34. Uhorka hadovka
  {
    slug: 'uhorka-salatova-hadovka-1ks',
    name: 'Uhorka šalátová hadovka',
    brand: 'ČERSTVÁ',
    package: '1 ks',
    bgColor: '#F0FDF4',
    accentColor: '#16A34A',
    badgeBg: '#DCFCE7',
    badgeText: '#14532D',
    category: 'Ovocie a zelenina',
    svgInner: `
      <g transform="translate(90, 80)">
        <ellipse cx="110" cy="135" rx="95" ry="15" fill="#000" opacity="0.08"/>
        <!-- Curved cucumber in cellophane -->
        <path d="M15,115 C30,70 180,65 205,105 C185,125 35,130 15,115 Z" fill="#15803D" stroke="#166534" stroke-width="3"/>
        <path d="M35,95 Q110,80 185,100" stroke="#4ADE80" stroke-width="2" fill="none" opacity="0.6"/>
        <circle cx="70" cy="98" r="1.5" fill="#BBF7D0"/>
        <circle cx="120" cy="95" r="1.5" fill="#BBF7D0"/>
        <circle cx="160" cy="102" r="1.5" fill="#BBF7D0"/>
      </g>
    `
  },
  // 35. Rajec pramenitá voda
  {
    slug: 'rajec-pramenita-voda-nesytena-1-5l',
    name: 'Pramenitá voda nesýtená',
    brand: 'RAJEC',
    package: '1,5 l',
    bgColor: '#F0F9FF',
    accentColor: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    category: 'Nápoje',
    svgInner: `
      <g transform="translate(130, 60)">
        <ellipse cx="70" cy="180" rx="45" ry="14" fill="#000" opacity="0.08"/>
        <!-- Clear contoured water bottle -->
        <path d="M50,45 L90,45 L95,85 Q80,95 95,110 L95,170 L45,170 L45,110 Q60,95 45,85 Z" fill="#BAE6FD" stroke="#0284C7" stroke-width="2.5" opacity="0.85"/>
        <rect x="62" y="15" width="16" height="30" fill="#E0F2FE"/>
        <rect x="60" y="5" width="20" height="12" rx="2" fill="#0284C7"/>
        <!-- Mountain label -->
        <rect x="47" y="100" width="46" height="42" fill="#0369A1"/>
        <text x="70" y="120" font-family="system-ui, sans-serif" font-weight="900" font-size="12" fill="#FFFFFF" text-anchor="middle">RAJEC</text>
        <text x="70" y="132" font-family="system-ui, sans-serif" font-weight="700" font-size="7" fill="#BAE6FD" text-anchor="middle">PRAMENITÁ 1,5l</text>
      </g>
    `
  },
  // 36. Vinea biela
  {
    slug: 'vinea-biela-hroznovy-napoj-1-5l',
    name: 'Hroznový sýtený nápoj biely',
    brand: 'VINEA',
    package: '1,5 l',
    bgColor: '#F0FDF4',
    accentColor: '#16A34A',
    badgeBg: '#DCFCE7',
    badgeText: '#14532D',
    category: 'Nápoje',
    svgInner: `
      <g transform="translate(130, 60)">
        <ellipse cx="70" cy="180" rx="45" ry="14" fill="#000" opacity="0.08"/>
        <!-- Green bottle -->
        <path d="M50,45 L90,45 L98,170 L42,170 Z" fill="#15803D" stroke="#14532D" stroke-width="2.5"/>
        <rect x="62" y="15" width="16" height="30" fill="#15803D"/>
        <rect x="62" y="5" width="16" height="12" rx="2" fill="#FACC15"/>
        <!-- Vinea gold wrap label with grapes -->
        <rect x="44" y="95" width="52" height="45" fill="#FEF08A"/>
        <text x="70" y="118" font-family="system-ui, sans-serif" font-weight="900" font-size="13" fill="#15803D" text-anchor="middle">vinea</text>
        <text x="70" y="130" font-family="system-ui, sans-serif" font-weight="800" font-size="7" fill="#B45309" text-anchor="middle">BIELA 1,5 l</text>
      </g>
    `
  },
  // 37. Zlatý Bažant 12%
  {
    slug: 'zlaty-bazant-12-lezak-plechovka-500ml',
    name: 'Svetlý ležiak 12 % plechovka',
    brand: 'ZLATÝ BAŽANT',
    package: '500 ml',
    bgColor: '#FFFBEB',
    accentColor: '#B45309',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    category: 'Nápoje',
    svgInner: `
      <g transform="translate(135, 65)">
        <ellipse cx="65" cy="165" rx="45" ry="14" fill="#000" opacity="0.08"/>
        <!-- Beer can cylinder -->
        <rect x="30" y="30" width="70" height="130" rx="10" fill="#15803D" stroke="#047857" stroke-width="2.5"/>
        <ellipse cx="65" cy="30" rx="35" ry="8" fill="#D1D5DB" stroke="#9CA3AF" stroke-width="1.5"/>
        <ellipse cx="65" cy="160" rx="35" ry="8" fill="#D1D5DB" stroke="#9CA3AF" stroke-width="1.5"/>
        <!-- Golden ribbon and pheasant logo -->
        <rect x="30" y="70" width="70" height="50" fill="#FACC15"/>
        <text x="65" y="90" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#14532D" text-anchor="middle">ZLATÝ BAŽANT</text>
        <circle cx="65" cy="106" r="10" fill="#B45309"/>
        <text x="65" y="110" font-family="system-ui, sans-serif" font-weight="900" font-size="9" fill="#FFF" text-anchor="middle">12%</text>
      </g>
    `
  },
  // 38. Emco ovsené vločky
  {
    slug: 'emco-ovsene-vlocky-jemne-500g',
    name: 'Ovsené vločky jemné',
    brand: 'EMCO',
    package: '500 g',
    bgColor: '#FFFBEB',
    accentColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#78350F',
    category: 'Trvanlivé potraviny',
    svgInner: `
      <g transform="translate(125, 65)">
        <ellipse cx="75" cy="165" rx="55" ry="14" fill="#000" opacity="0.08"/>
        <path d="M25,35 L125,35 L120,155 L30,155 Z" fill="#FDE68A" stroke="#CA8A04" stroke-width="2.5"/>
        <rect x="35" y="55" width="80" height="50" rx="4" fill="#DC2626"/>
        <text x="75" y="76" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#FFFFFF" text-anchor="middle">Emco</text>
        <text x="75" y="94" font-family="system-ui, sans-serif" font-weight="800" font-size="8" fill="#FEF08A" text-anchor="middle">OVSENÉ VLOČKY</text>
        <!-- Bowl of oats -->
        <ellipse cx="75" cy="132" rx="25" ry="10" fill="#FFFBEB" stroke="#B45309" stroke-width="1.5"/>
      </g>
    `
  },
  // 39. Tento Ellegance toaletný papier
  {
    slug: 'tento-ellegance-toaletny-papier-3vrstvovy-8ks',
    name: 'Toaletný papier 3-vrstvový biely',
    brand: 'TENTO',
    package: '8 ks',
    bgColor: '#FAF5FF',
    accentColor: '#9333EA',
    badgeBg: '#F3E8FF',
    badgeText: '#581C87',
    category: 'Drogéria a domácnosť',
    svgInner: `
      <g transform="translate(110, 75)">
        <ellipse cx="90" cy="145" rx="80" ry="16" fill="#000" opacity="0.08"/>
        <!-- 8-pack toilet paper block packaging -->
        <rect x="20" y="40" width="140" height="95" rx="12" fill="#FAF5FF" stroke="#A855F7" stroke-width="2.5"/>
        <!-- Rolls embossing -->
        <circle cx="55" cy="70" r="18" fill="#FFFFFF" stroke="#D8B4FE" stroke-width="2"/>
        <circle cx="55" cy="70" r="6" fill="#D8B4FE"/>
        <circle cx="105" cy="70" r="18" fill="#FFFFFF" stroke="#D8B4FE" stroke-width="2"/>
        <circle cx="105" cy="70" r="6" fill="#D8B4FE"/>
        <rect x="30" y="100" width="120" height="26" rx="4" fill="#7E22CE"/>
        <text x="90" y="116" font-family="system-ui, sans-serif" font-weight="900" font-size="10" fill="#FFFFFF" text-anchor="middle">Tento Ellegance</text>
        <text x="90" y="124" font-family="system-ui, sans-serif" font-weight="700" font-size="6" fill="#E9D5FF" text-anchor="middle">3-VRSTVOVÝ 8 KUSOV</text>
      </g>
    `
  },
  // 40. Jar Sensitive na riad
  {
    slug: 'jar-sensitive-cistiaci-prostriedok-na-riad-900ml',
    name: 'Prostriedok na umývanie riadu Sensitive',
    brand: 'JAR',
    package: '900 ml',
    bgColor: '#FDF2F8',
    accentColor: '#DB2777',
    badgeBg: '#FCE7F3',
    badgeText: '#831843',
    category: 'Drogéria a domácnosť',
    svgInner: `
      <g transform="translate(130, 60)">
        <ellipse cx="70" cy="180" rx="45" ry="14" fill="#000" opacity="0.08"/>
        <!-- Dishwashing bottle -->
        <path d="M45,55 C45,45 95,45 95,55 L102,170 C100,175 40,175 38,170 Z" fill="#FCE7F3" stroke="#DB2777" stroke-width="2.5"/>
        <rect x="62" y="25" width="16" height="30" fill="#FFFFFF" stroke="#DB2777" stroke-width="1.5"/>
        <!-- Push-pull red cap -->
        <rect x="60" y="10" width="20" height="15" rx="3" fill="#E11D48"/>
        <!-- Chamomile label -->
        <rect x="46" y="85" width="48" height="50" rx="4" fill="#15803D"/>
        <text x="70" y="108" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">Jar</text>
        <text x="70" y="124" font-family="system-ui, sans-serif" font-weight="700" font-size="8" fill="#BBF7D0" text-anchor="middle">Sensitive</text>
        <!-- Bubbles -->
        <circle cx="85" cy="65" r="5" fill="#F472B6" opacity="0.5"/>
        <circle cx="95" cy="55" r="3" fill="#F472B6" opacity="0.5"/>
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

for (const p of allProductArts) {
  const filePath = path.join(outDir, `${p.slug}.svg`);
  fs.writeFileSync(filePath, generateSvg(p), 'utf-8');
  console.log(`✓ Generated: public/images/products/${p.slug}.svg`);
}

console.log(`\nAll ${allProductArts.length} product images successfully created in public/images/products/`);
