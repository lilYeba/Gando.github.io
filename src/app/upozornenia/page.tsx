import React from 'react';
import {
  getPriceAlerts,
  getNotifications,
  getAllProducts,
} from '@/lib/db/repository';
import { PriceAlertsClient } from '@/components/alerts/PriceAlertsClient';

export const dynamic = 'force-dynamic';

export default async function PriceAlertsPage() {
  const alerts = getPriceAlerts();
  const notifications = getNotifications();
  const allProducts = getAllProducts();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  return (
    <PriceAlertsClient
      initialAlerts={alerts}
      initialNotifications={notifications}
      allProducts={allProducts}
      smtpConfigured={smtpConfigured}
    />
  );
}
