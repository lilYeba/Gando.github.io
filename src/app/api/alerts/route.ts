import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createPriceAlert,
  deleteNotification,
  deletePriceAlert,
  getNotifications,
  getPriceAlerts,
  markNotificationAsRead,
} from '@/lib/db/repository';
import {
  checkRateLimit,
  extractAuthContext,
  jsonError,
  parseValidatedJson,
} from '@/lib/api-security';

export async function GET(req: NextRequest) {
  const { userId } = extractAuthContext(req);
  const alerts = getPriceAlerts(userId);
  const notifications = getNotifications(userId);
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  return NextResponse.json({
    alerts,
    notifications,
    emailDeliveryStatus: {
      configured: smtpConfigured,
      mode: smtpConfigured ? 'SMTP_ACTIVE' : 'IN_APP_ONLY_NO_SMTP_CONFIGURED',
    },
  });
}

const AlertActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create_alert'),
    productId: z.string().min(1),
    targetPriceCents: z.number().int().min(1).max(100_000),
    notifyOnAnyPromotion: z.boolean().optional(),
    includeLoyaltyPrices: z.boolean().optional(),
    retailerFilter: z.enum(['lidl', 'tesco', 'billa']).nullable().optional(),
  }),
  z.object({
    action: z.literal('mark_notification_read'),
    notificationId: z.string().min(1),
  }),
]);

export async function POST(req: NextRequest) {
  const { userId } = extractAuthContext(req);
  const rl = checkRateLimit(`alerts:${userId}`, 30, 60_000);
  if (!rl.allowed) {
    return jsonError('Príliš veľa požiadaviek.', 429, 'RATE_LIMITED');
  }

  const parsed = await parseValidatedJson(req, AlertActionSchema);
  if (!parsed.success) return parsed.response;

  try {
    if (parsed.data.action === 'create_alert') {
      const alert = createPriceAlert(
        {
          productId: parsed.data.productId,
          targetPriceCents: parsed.data.targetPriceCents,
          notifyOnAnyPromotion: parsed.data.notifyOnAnyPromotion,
          includeLoyaltyPrices: parsed.data.includeLoyaltyPrices,
          retailerFilter: parsed.data.retailerFilter ?? null,
        },
        userId
      );
      return NextResponse.json(
        {
          alert,
          alerts: getPriceAlerts(userId),
          notifications: getNotifications(userId),
        },
        { status: 201 }
      );
    }

    markNotificationAsRead(parsed.data.notificationId, userId);
    return NextResponse.json({
      notifications: getNotifications(userId),
    });
  } catch {
    return jsonError('Produkt sa nenašiel.', 404, 'PRODUCT_NOT_FOUND');
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = extractAuthContext(req);
  const alertId = req.nextUrl.searchParams.get('alertId');
  const notificationId = req.nextUrl.searchParams.get('notificationId');

  if (alertId) {
    deletePriceAlert(alertId, userId);
  }
  if (notificationId) {
    deleteNotification(notificationId, userId);
  }

  return NextResponse.json({
    alerts: getPriceAlerts(userId),
    notifications: getNotifications(userId),
  });
}
