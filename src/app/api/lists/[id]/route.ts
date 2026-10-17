import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addShoppingListItem,
  deleteShoppingList,
  duplicateShoppingList,
  getShoppingListByIdOrShareToken,
  removeShoppingListItem,
  updateShoppingList,
  updateShoppingListItem,
} from '@/lib/db/repository';
import {
  checkRateLimit,
  extractAuthContext,
  jsonError,
  parseValidatedJson,
} from '@/lib/api-security';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = extractAuthContext(req);

  try {
    const list = getShoppingListByIdOrShareToken(id, auth);
    if (!list) {
      return jsonError('Nákupný zoznam sa nenašiel.', 404, 'LIST_NOT_FOUND');
    }
    return NextResponse.json({ list });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED_SHOPPING_LIST_ACCESS') {
      return jsonError('Nemáte oprávnenie na prístup k tomuto nákupnému zoznamu.', 403, 'FORBIDDEN');
    }
    return jsonError('Chyba pri načítaní nákupného zoznamu.', 500, 'INTERNAL_ERROR');
  }
}

const PostActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add_item'),
    productId: z.string().optional().nullable(),
    customTitle: z.string().trim().max(160).optional().nullable(),
    quantity: z.number().int().min(1).max(999).optional(),
    notes: z.string().trim().max(240).optional().nullable(),
  }),
  z.object({
    action: z.literal('duplicate'),
  }),
]);

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = extractAuthContext(req);
  const rl = checkRateLimit(`list-mut:${auth.userId}`, 45, 60_000);
  if (!rl.allowed) {
    return jsonError('Príliš veľa požiadaviek.', 429, 'RATE_LIMITED');
  }

  const parsed = await parseValidatedJson(req, PostActionSchema);
  if (!parsed.success) return parsed.response;

  try {
    if (parsed.data.action === 'duplicate') {
      const list = duplicateShoppingList(id, auth);
      return NextResponse.json({ list }, { status: 201 });
    }

    if (!parsed.data.productId && !parsed.data.customTitle) {
      return jsonError('Zadajte produkt z katalógu alebo vlastný názov položky.', 400, 'MISSING_ITEM_TARGET');
    }

    const list = addShoppingListItem(
      id,
      {
        productId: parsed.data.productId,
        customTitle: parsed.data.customTitle,
        quantity: parsed.data.quantity ?? 1,
        notes: parsed.data.notes,
      },
      auth
    );
    return NextResponse.json({ list });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED_SHOPPING_LIST_ACCESS') {
      return jsonError('Nemáte oprávnenie upravovať tento zoznam.', 403, 'FORBIDDEN');
    }
    return jsonError('Nákupný zoznam sa nenašiel.', 404, 'LIST_NOT_FOUND');
  }
}

const PatchActionSchema = z.discriminatedUnion('target', [
  z.object({
    target: z.literal('list'),
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(300).optional().nullable(),
    includeLoyaltyPrices: z.boolean().optional(),
  }),
  z.object({
    target: z.literal('item'),
    itemId: z.string().min(1),
    quantity: z.number().int().min(1).max(999).optional(),
    isPurchased: z.boolean().optional(),
    notes: z.string().trim().max(240).optional().nullable(),
  }),
]);

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = extractAuthContext(req);
  const parsed = await parseValidatedJson(req, PatchActionSchema);
  if (!parsed.success) return parsed.response;

  try {
    if (parsed.data.target === 'list') {
      const list = updateShoppingList(
        id,
        {
          name: parsed.data.name,
          description: parsed.data.description,
          includeLoyaltyPrices: parsed.data.includeLoyaltyPrices,
        },
        auth
      );
      return NextResponse.json({ list });
    }

    const list = updateShoppingListItem(
      id,
      parsed.data.itemId,
      {
        quantity: parsed.data.quantity,
        isPurchased: parsed.data.isPurchased,
        notes: parsed.data.notes,
      },
      auth
    );
    return NextResponse.json({ list });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED_SHOPPING_LIST_ACCESS') {
      return jsonError('Nemáte oprávnenie upravovať tento zoznam.', 403, 'FORBIDDEN');
    }
    return jsonError('Položka alebo zoznam sa nenašiel.', 404, 'NOT_FOUND');
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = extractAuthContext(req);
  const itemId = req.nextUrl.searchParams.get('itemId');

  try {
    if (itemId) {
      const list = removeShoppingListItem(id, itemId, auth);
      return NextResponse.json({ list });
    }
    deleteShoppingList(id, auth);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED_SHOPPING_LIST_ACCESS') {
      return jsonError('Nemáte oprávnenie odstrániť tento zoznam.', 403, 'FORBIDDEN');
    }
    return jsonError('Zoznam sa nenašiel.', 404, 'NOT_FOUND');
  }
}
