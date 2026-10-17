import React from 'react';
import {
  getShoppingLists,
  getShoppingListByIdOrShareToken,
  getAllProducts,
} from '@/lib/db/repository';
import { ShoppingListClient } from '@/components/lists/ShoppingListClient';


export default async function ShoppingListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp: Record<string, string | string[] | undefined> = process.env.GITHUB_PAGES === 'true' ? {} : (await searchParams);
  const listParam = (Array.isArray(sp.list) ? sp.list[0] : sp.list) ||
                    (Array.isArray(sp.zdielany) ? sp.zdielany[0] : sp.zdielany);

  const lists = getShoppingLists();
  const activeListId = listParam || (lists.length > 0 ? lists[0].id : 'list-rodinny-nakup');

  const initialActiveList =
    getShoppingListByIdOrShareToken(activeListId) ||
    (lists.length > 0 ? getShoppingListByIdOrShareToken(lists[0].id) : null);

  const allProducts = getAllProducts();

  return (
    <ShoppingListClient
      initialLists={lists}
      initialActiveList={initialActiveList}
      allProducts={allProducts}
      sharedToken={Array.isArray(sp.zdielany) ? sp.zdielany[0] : sp.zdielany}
    />
  );
}
