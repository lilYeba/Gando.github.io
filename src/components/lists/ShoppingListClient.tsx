'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  Plus,
  Check,
  CheckCircle2,
  Trash2,
  Share2,
  Copy,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  FileText,
  Edit2,
  ChevronRight,
  Calculator,
  Search,
  Store,
  Layers,
} from 'lucide-react';
import { formatEur } from '@/lib/domain/money';
import type {
  ShoppingListRecord,
  ShoppingListDetail,
  ShoppingListItemRecord,
} from '@/lib/db/repository';
import type { ProductWithOffers } from '@/lib/domain/types';
import { useApp } from '@/components/providers/AppContext';
import { ProductIllustration } from '@/components/ui/ProductIllustration';

interface ShoppingListClientProps {
  initialLists: ShoppingListRecord[];
  initialActiveList: ShoppingListDetail | null;
  allProducts: ProductWithOffers[];
  sharedToken?: string;
}

export function ShoppingListClient({
  initialLists,
  initialActiveList,
  allProducts,
  sharedToken,
}: ShoppingListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast, refreshHeaderCounts } = useApp();

  const [lists, setLists] = useState<ShoppingListRecord[]>(initialLists);
  const [activeList, setActiveList] = useState<ShoppingListDetail | null>(initialActiveList);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(activeList?.name || '');

  // Add Item States
  const [addMode, setAddMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedProductId, setSelectedProductId] = useState<string>(allProducts[0]?.id || '');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Filtered catalog products for picker
  const filteredCatalogProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return allProducts;
    const q = productSearchQuery.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.canonicalName.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }, [allProducts, productSearchQuery]);

  // Switch Active List
  const handleSwitchList = async (listId: string) => {
    try {
      const res = await fetch(`/api/lists/${listId}`);
      if (res.ok) {
        const { list } = await res.json();
        setActiveList(list);
        setEditTitleValue(list.name);
        startTransition(() => {
          router.replace(`/zoznam?list=${list.id}`, { scroll: false });
        });
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa načítať zoznam.',
        variant: 'warning',
      });
    }
  };

  // Create New List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (res.ok) {
        const { list } = await res.json();
        setLists((prev) => [list, ...prev]);
        setActiveList({ ...list, items: [] });
        setEditTitleValue(list.name);
        setNewListName('');
        setIsCreatingList(false);
        showToast({
          title: 'Zoznam vytvorený',
          description: `Zoznam "${list.name}" bol úspešne vytvorený.`,
          variant: 'success',
        });
        await refreshHeaderCounts();
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa vytvoriť zoznam.',
        variant: 'warning',
      });
    }
  };

  // Update List Title
  const handleUpdateTitle = async () => {
    if (!activeList || !editTitleValue.trim() || editTitleValue === activeList.name) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const res = await fetch(`/api/lists/${activeList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'list', name: editTitleValue.trim() }),
      });
      if (res.ok) {
        const { list } = await res.json();
        setActiveList((prev) => (prev ? { ...prev, name: list.name } : null));
        setLists((prev) => prev.map((l) => (l.id === list.id ? { ...l, name: list.name } : l)));
        setIsEditingTitle(false);
        showToast({
          title: 'Názov upravený',
          description: `Zoznam premenovaný na "${list.name}".`,
          variant: 'success',
        });
      }
    } catch {
      setIsEditingTitle(false);
    }
  };

  // Duplicate List
  const handleDuplicateList = async () => {
    if (!activeList) return;
    try {
      const res = await fetch(`/api/lists/${activeList.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate' }),
      });
      if (res.ok) {
        const { list } = await res.json();
        setLists((prev) => [list, ...prev]);
        setActiveList(list);
        setEditTitleValue(list.name);
        showToast({
          title: 'Zoznam skopírovaný',
          description: `Vytvorená kópia "${list.name}".`,
          variant: 'success',
        });
        await refreshHeaderCounts();
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa duplikovať zoznam.',
        variant: 'warning',
      });
    }
  };

  // Delete List
  const handleDeleteList = async () => {
    if (!activeList) return;
    if (!confirm(`Naozaj chcete vymazať zoznam "${activeList.name}"?`)) return;

    try {
      const res = await fetch(`/api/lists/${activeList.id}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = lists.filter((l) => l.id !== activeList.id);
        setLists(remaining);
        if (remaining.length > 0) {
          handleSwitchList(remaining[0].id);
        } else {
          setActiveList(null);
        }
        showToast({
          title: 'Zoznam vymazaný',
          description: 'Nákupný zoznam bol odstránený.',
          variant: 'info',
        });
        await refreshHeaderCounts();
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa vymazať zoznam.',
        variant: 'warning',
      });
    }
  };

  // Share List
  const handleShareList = () => {
    if (!activeList?.shareToken) return;
    const shareUrl = `${window.location.origin}/zoznam?zdielany=${activeList.shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    showToast({
      title: 'Odkaz skopírovaný',
      description: 'Bezpečný odkaz na zoznam bol skopírovaný do schránky.',
      variant: 'success',
    });
  };

  // Add Item to List
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList) return;
    setIsSubmittingItem(true);

    try {
      const body =
        addMode === 'catalog'
          ? { action: 'add_item', productId: selectedProductId, quantity: itemQuantity }
          : { action: 'add_item', customTitle: customItemTitle.trim(), quantity: itemQuantity };

      if (addMode === 'custom' && !customItemTitle.trim()) {
        setIsSubmittingItem(false);
        return;
      }

      const res = await fetch(`/api/lists/${activeList.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const { list } = await res.json();
        setActiveList(list);
        setCustomItemTitle('');
        setItemQuantity(1);
        setProductSearchQuery('');
        showToast({
          title: 'Položka pridaná',
          description: 'Položka bola pridaná do nákupného zoznamu.',
          variant: 'success',
        });
        await refreshHeaderCounts();
      }
    } catch {
      showToast({
        title: 'Chyba',
        description: 'Nepodarilo sa pridať položku.',
        variant: 'warning',
      });
    } finally {
      setIsSubmittingItem(false);
    }
  };

  // Update Item Quantity / Check status
  const handleUpdateItem = async (itemId: string, patch: { quantity?: number; isPurchased?: boolean }) => {
    if (!activeList) return;

    // Optimistic local update
    setActiveList((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, ...patch } : item
        ),
      };
    });

    try {
      const res = await fetch(`/api/lists/${activeList.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'item', itemId, ...patch }),
      });
      if (res.ok) {
        const { list } = await res.json();
        setActiveList(list);
        await refreshHeaderCounts();
      }
    } catch {
      // Revert if error
      handleSwitchList(activeList.id);
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId: string) => {
    if (!activeList) return;

    setActiveList((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      };
    });

    try {
      const res = await fetch(`/api/lists/${activeList.id}?itemId=${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const { list } = await res.json();
        setActiveList(list);
        await refreshHeaderCounts();
      }
    } catch {
      handleSwitchList(activeList.id);
    }
  };

  // Split active list items into unpurchased and purchased
  const unpurchasedItems = useMemo(
    () => activeList?.items.filter((item) => !item.isPurchased) || [],
    [activeList]
  );
  const purchasedItems = useMemo(
    () => activeList?.items.filter((item) => item.isPurchased) || [],
    [activeList]
  );

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <section className="bg-white rounded-2xl border border-stone-200/80 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Inteligentné plánovanie nákupu</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              Nákupné zoznamy
            </h1>
            <p className="text-stone-600 mt-2 text-base max-w-2xl leading-relaxed">
              Pridávajte tovary z katalógu alebo vlastné položky. Kedykoľvek môžete spustiť optimalizátor a zistiť,
              ktorý reťazec (Lidl, Tesco alebo BILLA) vám ponúkne najnižšiu cenu.
            </p>
          </div>

          {/* Quick Optimizer Callout CTA */}
          {activeList && activeList.items.length > 0 && (
            <Link
              href={`/optimalizator?listId=${activeList.id}`}
              className="inline-flex items-center gap-3 bg-[#123524] text-white px-5 py-3.5 rounded-xl font-medium text-sm hover:bg-emerald-950 transition-all shadow-md group shrink-0"
            >
              <Calculator className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <span className="block text-xs text-emerald-300 font-normal">Pripravené na porovnanie</span>
                <span className="font-semibold flex items-center gap-1">
                  Optimalizovať tento košík
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Lists Tabs & New List creation */}
        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-wrap items-center gap-2">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => handleSwitchList(l.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeList?.id === l.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{l.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  activeList?.id === l.id ? 'bg-stone-700 text-stone-200' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {l.itemCount ?? 0}
              </span>
            </button>
          ))}

          {/* Create list button or form */}
          {isCreatingList ? (
            <form onSubmit={handleCreateList} className="flex items-center gap-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Názov zoznamu..."
                className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-emerald-800"
                autoFocus
              />
              <button
                type="submit"
                className="bg-emerald-800 text-white text-xs px-3 py-2 rounded-lg font-medium hover:bg-emerald-900"
              >
                Vytvoriť
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingList(false)}
                className="text-stone-500 hover:text-stone-700 text-xs px-2 py-2"
              >
                Zrušiť
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingList(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nový zoznam</span>
            </button>
          )}
        </div>
      </section>

      {/* Main List Workspace */}
      {activeList ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: List Items & Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active List Header & Toolbar */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      onBlur={handleUpdateTitle}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                      className="font-serif font-bold text-xl text-stone-900 border-b border-stone-400 focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateTitle}
                      className="text-xs bg-emerald-800 text-white px-2.5 py-1 rounded-md"
                    >
                      Uložiť
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-xl text-stone-900">{activeList.name}</h2>
                    <button
                      onClick={() => setIsEditingTitle(true)}
                      className="text-stone-400 hover:text-stone-700 p-1"
                      title="Premenovať zoznam"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-xs text-stone-500 font-mono">
                  ({activeList.items.length} {activeList.items.length === 1 ? 'položka' : 'položiek'})
                </span>
              </div>

              {/* Toolbar Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareList}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                  title="Zdieľať zoznam pomocou tajného odkazu"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Zdieľať</span>
                </button>

                <button
                  onClick={handleDuplicateList}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                  title="Vytvoriť kópiu tohto zoznamu"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Kópia</span>
                </button>

                {lists.length > 1 && (
                  <button
                    onClick={handleDeleteList}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                    title="Vymazať zoznam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Add Bar */}
            <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Pridať položku do zoznamu
                </span>
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setAddMode('catalog')}
                    className={`px-3 py-1 rounded-md transition-all font-medium ${
                      addMode === 'catalog'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Z katalógu (19 overených)
                  </button>
                  <button
                    onClick={() => setAddMode('custom')}
                    className={`px-3 py-1 rounded-md transition-all font-medium ${
                      addMode === 'custom'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Vlastný tovar
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3">
                {addMode === 'catalog' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Hľadať tovar v overenom slovenskom katalógu..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-emerald-800"
                      />
                    </div>

                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm text-stone-900 focus:outline-emerald-800"
                    >
                      {filteredCatalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.canonicalName} ({p.brand ? `${p.brand}, ` : ''}{p.packageQuantity} {p.packageUnit})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Napr. Čerstvý kôpor, cesnak z trhu..."
                      value={customItemTitle}
                      onChange={(e) => setCustomItemTitle(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm text-stone-900 focus:outline-emerald-800"
                    />
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      Vlastné položky budú označené ako neevidované v letákoch a zahrnuté v nákupnom zozname.
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Množstvo:</span>
                    <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                      <button
                        type="button"
                        onClick={() => setItemQuantity((q) => Math.max(1, q - 1))}
                        className="px-2.5 py-1 text-stone-600 hover:text-stone-900"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-sm font-mono font-bold text-stone-900">
                        {itemQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setItemQuantity((q) => q + 1)}
                        className="px-2.5 py-1 text-stone-600 hover:text-stone-900"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingItem}
                    className="flex items-center gap-1.5 bg-[#123524] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-emerald-900 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pridať do zoznamu</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Items List */}
            {activeList.items.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center">
                <ShoppingBag className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <h3 className="font-serif font-bold text-stone-800 text-lg">Zoznam je prázdny</h3>
                <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                  Vyberte produkty z katalógu vyššie alebo zadajte vlastné položky.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Unpurchased Items */}
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {unpurchasedItems.map((item) => {
                      const prod = item.product;
                      // Best price across listings
                      const bestPrice = prod?.historicalMinCents;

                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs flex items-center justify-between gap-4 transition-colors hover:border-stone-300"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox */}
                            <button
                              onClick={() => handleUpdateItem(item.id, { isPurchased: true })}
                              className="w-5 h-5 rounded-md border border-stone-300 flex items-center justify-center hover:border-emerald-600 transition-colors shrink-0"
                              title="Označiť ako kúpené"
                            >
                              <div className="w-3 h-3 rounded-xs opacity-0 hover:opacity-40 bg-emerald-600" />
                            </button>

                            {/* Thumbnail */}
                            {prod ? (
                              <div className="w-12 h-12 bg-stone-50 rounded-lg p-1 border border-stone-100 shrink-0 flex items-center justify-center">
                                <ProductIllustration
                                  slug={prod.slug}
                                  categorySlug={prod.categorySlug}
                                  brand={prod.brand}
                                  imageUrl={prod.imageUrl}
                                  className="w-9 h-9"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 shrink-0">
                                <Layers className="w-5 h-5" />
                              </div>
                            )}

                            {/* Details */}
                            <div className="min-w-0">
                              <h4 className="font-medium text-stone-900 text-sm truncate">
                                {item.customTitle ?? prod?.canonicalName}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                {prod ? (
                                  <>
                                    <span className="text-xs text-stone-500 font-mono">
                                      {prod.packageQuantity} {prod.packageUnit}
                                    </span>
                                    <span className="text-stone-300">•</span>
                                    <span className="text-xs text-emerald-800 font-mono font-medium">
                                      {bestPrice ? `od ${formatEur(bestPrice)} / ks` : 'Cena neoverená'}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200/60 font-medium">
                                    Vlastná položka (bez letákových cien)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Controls: Quantity & Delete */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50 text-xs">
                              <button
                                onClick={() =>
                                  item.quantity > 1
                                    ? handleUpdateItem(item.id, { quantity: item.quantity - 1 })
                                    : handleRemoveItem(item.id)
                                }
                                className="px-2 py-1 text-stone-600 hover:text-stone-900"
                              >
                                -
                              </button>
                              <span className="px-2 py-1 font-mono font-bold text-stone-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateItem(item.id, { quantity: item.quantity + 1 })}
                                className="px-2 py-1 text-stone-600 hover:text-stone-900"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                              title="Odstrániť položku"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Purchased Items Collapsible Section */}
                {purchasedItems.length > 0 && (
                  <div className="pt-4 border-t border-stone-200">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 block mb-2">
                      Zakúpené položky ({purchasedItems.length})
                    </span>
                    <div className="space-y-2 opacity-65">
                      {purchasedItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleUpdateItem(item.id, { isPurchased: false })}
                              className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center shrink-0"
                              title="Vrátiť medzi nezakúpené"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm line-through text-stone-500">
                              {item.customTitle ?? item.product?.canonicalName} ({item.quantity} ks)
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-stone-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Col: Basket Summary & Optimization Strategy */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                  Stav nákupu
                </span>
                <h3 className="font-serif font-bold text-xl text-stone-900">Súhrn košíka</h3>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-stone-600 mb-1.5 font-medium">
                  <span>Pripravené položky</span>
                  <span>
                    {purchasedItems.length} z {activeList.items.length} kúpené
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 transition-all duration-300"
                    style={{
                      width: `${
                        activeList.items.length > 0
                          ? (purchasedItems.length / activeList.items.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Verified vs uncataloged items warning */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-600">Položky v katalógu:</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {activeList.items.filter((i) => i.productId).length}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-600">Vlastné položky:</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {activeList.items.filter((i) => !i.productId).length}
                  </span>
                </div>
              </div>

              {/* Optimizer Callout Card */}
              <div className="bg-[#F7F5F0] p-4 rounded-xl border border-stone-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Porovnanie cien v obchodoch</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Zistite celkový účet v Lidli, Tescu a BILLE, alebo použite kombinovaný nákup vo viacerých obchodoch
                  so započítaním nákladov na dopravu.
                </p>

                <Link
                  href={`/optimalizator?listId=${activeList.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#123524] text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-emerald-950 transition-colors shadow-2xs"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Spustiť optimalizátor košíka</span>
                </Link>
              </div>
            </div>

            {/* Sharing Info */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-500 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-stone-800">
                <Share2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Bezpečné zdieľanie zoznamu</span>
              </div>
              <p className="leading-relaxed">
                Každý zoznam má unikátny kryptografický token. Príjemca odkazu si môže zoznam zobraziť a skopírovať do
                svojho profilu bez nutnosti registrácie.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <p className="text-stone-500">Žiadny zoznam nie je vybraný.</p>
        </div>
      )}
    </div>
  );
}
