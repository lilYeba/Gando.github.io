import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getFavoriteProductIds,
  queryProducts,
  toggleFavoriteProduct,
} from '@/lib/db/repository';
import {
  checkRateLimit,
  extractAuthContext,
  jsonError,
  parseValidatedJson,
} from '@/lib/api-security';
import type { RetailerSlug } from '@/lib/domain/types';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q') ?? undefined;
  const category = sp.get('category') ?? undefined;
  const retailerParam = sp.get('retailer');
  const retailer =
    retailerParam && ['lidl', 'tesco', 'billa'].includes(retailerParam)
      ? (retailerParam as RetailerSlug)
      : undefined;
  const brand = sp.get('brand') ?? undefined;
  const minPriceCents = sp.get('minPriceCents') ? Number(sp.get('minPriceCents')) : undefined;
  const maxPriceCents = sp.get('maxPriceCents') ? Number(sp.get('maxPriceCents')) : undefined;
  const onlyPromotions = sp.get('onlyPromotions') === 'true';
  const onlyLoyalty = sp.get('onlyLoyalty') === 'true';
  const includeLoyalty = sp.get('includeLoyalty') !== 'false';
  const sortByParam = sp.get('sortBy');
  const sortBy =
    sortByParam &&
    ['price_asc', 'price_desc', 'unit_price_asc', 'discount_desc', 'updated_desc', 'name_asc'].includes(
      sortByParam
    )
      ? (sortByParam as
          | 'price_asc'
          | 'price_desc'
          | 'unit_price_asc'
          | 'discount_desc'
          | 'updated_desc'
          | 'name_asc')
      : 'discount_desc';

  const page = sp.get('page') ? Number(sp.get('page')) : 1;
  const pageSize = sp.get('pageSize') ? Number(sp.get('pageSize')) : 24;

  const { userId } = extractAuthContext(req);
  const result = queryProducts({
    q,
    category,
    retailer,
    brand,
    minPriceCents,
    maxPriceCents,
    onlyPromotions,
    onlyLoyalty,
    includeLoyalty,
    sortBy,
    page,
    pageSize,
  });

  const favoriteProductIds = getFavoriteProductIds(userId);

  return NextResponse.json({
    ...result,
    favoriteProductIds,
  });
}

const FavoriteToggleSchema = z.object({
  productId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const { userId } = extractAuthContext(req);
  const rl = checkRateLimit(`fav:${userId}`, 30, 60_000);
  if (!rl.allowed) {
    return jsonError('Príliš veľa požiadaviek. Skúste to znova o chvíľu.', 429, 'RATE_LIMITED');
  }

  const parsed = await parseValidatedJson(req, FavoriteToggleSchema);
  if (!parsed.success) return parsed.response;

  const res = toggleFavoriteProduct(parsed.data.productId, userId);
  return NextResponse.json(res);
}
