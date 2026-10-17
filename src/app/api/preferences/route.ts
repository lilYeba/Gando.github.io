import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserPreferences, updateUserPreferences } from '@/lib/db/repository';
import { extractAuthContext, parseValidatedJson } from '@/lib/api-security';

export async function GET(req: NextRequest) {
  const { userId } = extractAuthContext(req);
  const preferences = getUserPreferences(userId);
  return NextResponse.json({ preferences });
}

const UpdatePreferencesSchema = z.object({
  language: z.enum(['sk', 'en']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  reducedMotion: z.boolean().optional(),
  includeLidlPlus: z.boolean().optional(),
  includeTescoClubcard: z.boolean().optional(),
  includeBillaBonus: z.boolean().optional(),
  defaultMaxStores: z.number().int().min(1).max(3).optional(),
  defaultTripCostCents: z.number().int().min(0).max(5000).optional(),
  inAppNotificationsEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  analyticsPrivacyOptOut: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const { userId } = extractAuthContext(req);
  const parsed = await parseValidatedJson(req, UpdatePreferencesSchema);
  if (!parsed.success) return parsed.response;

  const preferences = updateUserPreferences(parsed.data, userId);
  return NextResponse.json({ preferences });
}
