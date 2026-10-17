import React from 'react';
import {
  getAllProducts,
  getProductPriceHistory,
  getDataSources,
  getImportJobs,
  getPendingMatchCandidates,
} from '@/lib/db/repository';
import { PriceHistoryExplorerClient } from '@/components/history/PriceHistoryExplorerClient';


export default async function PriceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp: Record<string, string | string[] | undefined> = process.env.GITHUB_PAGES === 'true' ? {} : (await searchParams);
  const allProducts = getAllProducts();
  const productParam = Array.isArray(sp.produkt) ? sp.produkt[0] : sp.produkt;

  const targetProduct =
    (productParam && allProducts.find((p) => p.slug === productParam || p.id === productParam)) ||
    allProducts[0];

  const initialHistory = targetProduct
    ? getProductPriceHistory(targetProduct.id)
    : null;

  const dataSources = getDataSources();
  const importJobs = getImportJobs(15);
  const pendingMatches = getPendingMatchCandidates();

  return (
    <PriceHistoryExplorerClient
      allProducts={allProducts}
      selectedProductId={targetProduct ? targetProduct.id : ''}
      initialHistory={initialHistory}
      dataSources={dataSources}
      importJobs={importJobs}
      initialPendingMatches={pendingMatches}
    />
  );
}
