import { NextRequest, NextResponse } from 'next/server';
import {
  getFavoriteProductIds,
  getProductBySlugOrId,
  getProductPriceHistory,
  getSimilarProducts,
} from '@/lib/db/repository';
import { extractAuthContext, jsonError } from '@/lib/api-security';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const product = getProductBySlugOrId(slug);
  if (!product) {
    return jsonError('Produkt sa v katalógu nenašiel.', 404, 'PRODUCT_NOT_FOUND');
  }

  const { userId } = extractAuthContext(req);
  const history = getProductPriceHistory(product.id);
  const similarProducts = getSimilarProducts(product.id, 4);
  const favoriteProductIds = getFavoriteProductIds(userId);

  return NextResponse.json({
    product,
    history,
    similarProducts,
    isFavorite: favoriteProductIds.includes(product.id),
  });
}
