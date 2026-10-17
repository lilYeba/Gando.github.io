import React from 'react';
import {
  getShoppingLists,
  optimizeShoppingListById,
} from '@/lib/db/repository';
import { BasketOptimizerClient } from '@/components/optimizer/BasketOptimizerClient';


export default async function OptimizerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp: Record<string, string | string[] | undefined> = process.env.GITHUB_PAGES === 'true' ? {} : (await searchParams);
  const listIdParam = Array.isArray(sp.listId) ? sp.listId[0] : sp.listId;

  const lists = getShoppingLists();
  const selectedListId = listIdParam || (lists.length > 0 ? lists[0].id : 'list-rodinny-nakup');

  let initialOptimization = null;
  try {
    initialOptimization = optimizeShoppingListById(selectedListId, {
      loyalty: {
        includeLidlPlus: true,
        includeTescoClubcard: true,
        includeBillaBonus: true,
      },
      maxStoresAllowed: 2,
      tripCostPerExtraStoreCents: 150,
    });
  } catch {
    if (lists.length > 0) {
      initialOptimization = optimizeShoppingListById(lists[0].id);
    }
  }

  return (
    <BasketOptimizerClient
      lists={lists}
      initialListId={selectedListId}
      initialOptimization={initialOptimization}
    />
  );
}
