import React from 'react';
import { getAllProducts } from '@/lib/db/repository';
import { PriceComparisonClient } from '@/components/compare/PriceComparisonClient';


export default async function PriceComparisonPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp: Record<string, string | string[] | undefined> = process.env.GITHUB_PAGES === 'true' ? {} : (await searchParams);
  const allProducts = getAllProducts();
  const produktParam = Array.isArray(sp.produkt) ? sp.produkt[0] : sp.produkt;

  return (
    <PriceComparisonClient
      allProducts={allProducts}
      initialProductSlug={produktParam}
    />
  );
}
