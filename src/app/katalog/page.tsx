import React from 'react';
import { getAllProducts, queryProducts } from '@/lib/db/repository';
import { CatalogClient } from '@/components/catalog/CatalogClient';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const allProducts = getAllProducts();
  const { facets } = queryProducts({});

  const getStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <CatalogClient
      allProducts={allProducts}
      facets={facets}
      initialParams={{
        q: getStr(sp.q),
        category: getStr(sp.category),
        retailer: getStr(sp.retailer),
        brand: getStr(sp.brand),
        onlyPromotions: getStr(sp.onlyPromotions) === 'true',
        onlyLoyalty: getStr(sp.onlyLoyalty) === 'true',
        maxPriceEur: getStr(sp.maxPriceEur),
        sortBy: getStr(sp.sortBy),
        view: getStr(sp.view) === 'list' ? 'list' : 'grid',
      }}
    />
  );
}
