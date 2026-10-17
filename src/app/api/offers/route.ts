import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyOffers } from '@/lib/db/repository';
import type { RetailerSlug } from '@/lib/domain/types';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const retailerParam = sp.get('retailer');
  const retailer =
    retailerParam && ['lidl', 'tesco', 'billa'].includes(retailerParam)
      ? (retailerParam as RetailerSlug)
      : undefined;
  const category = sp.get('category') ?? undefined;
  const sortByParam = sp.get('sortBy');
  const sortBy =
    sortByParam && ['discount_desc', 'price_asc', 'expiring_soon'].includes(sortByParam)
      ? (sortByParam as 'discount_desc' | 'price_asc' | 'expiring_soon')
      : 'discount_desc';

  const offers = getWeeklyOffers({ retailer, category, sortBy });
  return NextResponse.json(offers);
}
