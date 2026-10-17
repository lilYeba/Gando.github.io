import React from 'react';
import { notFound } from 'next/navigation';
import {
  getAllProducts,
  getProductBySlugOrId,
  getProductPriceHistory,
  getSimilarProducts,
} from '@/lib/db/repository';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlugOrId(slug);
  if (!product) {
    notFound();
  }

  const history = getProductPriceHistory(product.id)!;
  const similarProducts = getSimilarProducts(product.id, 4);

  return (
    <ProductDetailClient
      product={product}
      history={history}
      similarProducts={similarProducts}
    />
  );
}
