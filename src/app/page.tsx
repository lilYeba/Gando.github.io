import React from 'react';
import { getHomeDashboardData } from '@/lib/db/repository';
import { HomeInteractiveClient } from '@/components/home/HomeInteractiveClient';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const dashboardData = getHomeDashboardData();

  return (
    <HomeInteractiveClient
      storedMetrics={dashboardData.storedMetrics}
      todaysVerifiedOffers={dashboardData.todaysVerifiedOffers}
      popularProducts={dashboardData.popularProducts}
      categories={dashboardData.categories}
      recentlyUpdatedPrices={dashboardData.recentlyUpdatedPrices}
      dataSources={dashboardData.dataSources}
      defaultBasketOptimization={dashboardData.defaultBasketOptimization}
    />
  );
}
