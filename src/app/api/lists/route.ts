import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createShoppingList, getShoppingLists } from '@/lib/db/repository';
import {
  checkRateLimit,
  extractAuthContext,
  jsonError,
  parseValidatedJson,
} from '@/lib/api-security';

export async function GET(req: NextRequest) {
  const auth = extractAuthContext(req);
  const lists = getShoppingLists(auth);
  return NextResponse.json({ lists });
}

const CreateListSchema = z.object({
  name: z.string().trim().min(1, 'Názov zoznamu je povinný.').max(120),
  description: z.string().trim().max(300).optional().nullable(),
  includeLoyaltyPrices: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const auth = extractAuthContext(req);
  const rl = checkRateLimit(`create-list:${auth.userId}`, 20, 60_000);
  if (!rl.allowed) {
    return jsonError('Príliš veľa požiadaviek. Skúste to znova o chvíľu.', 429, 'RATE_LIMITED');
  }

  const parsed = await parseValidatedJson(req, CreateListSchema);
  if (!parsed.success) return parsed.response;

  const list = createShoppingList({
    name: parsed.data.name,
    description: parsed.data.description,
    includeLoyaltyPrices: parsed.data.includeLoyaltyPrices,
    userId: auth.userId,
    guestSessionId: auth.guestSessionId,
  });

  return NextResponse.json({ list }, { status: 201 });
}
