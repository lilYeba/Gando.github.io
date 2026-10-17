import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/components/providers/AppContext';
import { HeaderShell } from '@/components/layout/HeaderShell';
import { Footer } from '@/components/layout/Footer';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const fontSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const fontMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Price Checker SK — Inteligentné porovnanie cien potravín (Lidl, Tesco, BILLA)',
  description:
    'Porovnávajte overené ceny potravín, jednotkové ceny (€/kg, €/l), vernostné akcie (Lidl Plus, Clubcard, BILLA Bonus) a optimalizujte svoj nákupný košík na Slovensku.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sk"
      className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] antialiased">
        <AppProvider>
          <HeaderShell />
          <main className="flex-1">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
