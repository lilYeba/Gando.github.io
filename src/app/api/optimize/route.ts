import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getAllProducts,
  optimizeShoppingListById,
} from '@/lib/db/repository';
import { optimizeShoppingBasket } from '@/lib/domain/basket-optimizer';
import { jsonError, parseValidatedJson } from '@/lib/api-security';
import type { ShoppingListItemInput } from '@/lib/domain/types';

const OptimizeRequestSchema = z.object({
  listId: z.string().optional(),
  customItems: z
    .array(
      z.object({
        id: z.string(),
        productId: z.string().nullable(),
        customTitle: z.string().nullable().optional(),
        quantity: z.number().int().min(1).max(999),
        isPurchased: z.boolean().optional(),
      })
    )
    .optional(),
  loyalty: z
    .object({
      includeLidlPlus: z.boolean(),
      includeTescoClubcard: z.boolean(),
      includeBillaBonus: z.boolean(),
    })
    .optional(),
  maxStoresAllowed: z.number().int().min(1).max(3).optional(),
  tripCostPerExtraStoreCents: z.number().int().min(0).max(5000).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = await parseValidatedJson(req, OptimizeRequestSchema);
  if (!parsed.success) return parsed.response;

  const {
    listId,
    customItems,
    loyalty,
    maxStoresAllowed,
    tripCostPerExtraStoreCents,
  } = parsed.data;

  try {
    if (customItems && customItems.length > 0) {
      const productMap = new Map(getAllProducts().map((p) => [p.id, p]));
      const itemsInput: ShoppingListItemInput[] = customItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        customTitle: item.customTitle ?? null,
        quantity: item.quantity,
        isPurchased: item.isPurchased ?? false,
        product: item.productId ? productMap.get(item.productId) ?? null : null,
      }));

      const optimization = optimizeShoppingBasket(itemsInput, {
        loyaltyPreferences: loyalty ?? {
          includeLidlPlus: true,
          includeTescoClubcard: true,
          includeBillaBonus: true,
        },
        maxStores: maxStoresAllowed ?? 2,
        tripCostPerExtraStoreCents: tripCostPerExtraStoreCents ?? 150,
      });

      return NextResponse.json({ optimization });
    }

    const targetListId = listId ?? 'list-rodinny-nakup';
    const optimization = optimizeShoppingListById(targetListId, {
      loyalty,
      maxStoresAllowed,
      tripCostPerExtraStoreCents,
    });

    return NextResponse.json({ optimization });
  } catch {
    return jsonError('Nákupný zoznam sa nenašiel.', 404, 'LIST_NOT_FOUND');
  }
}
