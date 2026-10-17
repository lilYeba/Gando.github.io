import React from 'react';
import { getWeeklyOffers, getAllProducts } from '@/lib/db/repository';
import { WeeklyOffersClient } from '@/components/offers/WeeklyOffersClient';


export default async function WeeklyOffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp: Record<string, string | string[] | undefined> = process.env.GITHUB_PAGES === 'true' ? {} : (await searchParams);
  const offersData = getWeeklyOffers();
  const allProducts = getAllProducts();

  // Extract unique categories
  const categoriesMap = new Map<string, string>();
  for (const p of allProducts) {
    if (p.categorySlug && p.categoryName) {
      categoriesMap.set(p.categorySlug, p.categoryName);
    }
  }
  const categories = Array.from(categoriesMap.entries()).map(([slug, name]) => ({
    slug,
    name,
  }));

  const getStr = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  return (
    <WeeklyOffersClient
      initialData={offersData}
      categories={categories}
      initialRetailer={getStr(sp.retailer)}
      initialCategory={getStr(sp.category)}
      initialSort={getStr(sp.sort) as any}
      initialTab={getStr(sp.tab) as any}
    />
  );
}
