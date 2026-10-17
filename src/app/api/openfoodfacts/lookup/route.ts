// ==============================================================================
// PRICE TRACKER SK — OPEN FOOD FACTS LOOKUP API ROUTE
// GET /api/openfoodfacts/lookup?barcode=...&name=...&brand=...
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { resolveProductPhoto } from '@/lib/services/open-food-facts';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  const name = searchParams.get('name');
  const brand = searchParams.get('brand');

  if (!barcode && !name && !brand) {
    return NextResponse.json(
      { error: 'At least one of barcode, name, or brand is required' },
      { status: 400 }
    );
  }

  try {
    const result = await resolveProductPhoto({
      barcode: barcode || undefined,
      productName: name || undefined,
      brand: brand || undefined,
    });

    if (!result) {
      return NextResponse.json(
        { found: false, message: 'No product photograph found on Open Food Facts' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      data: result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error while querying Open Food Facts', details: String(err) },
      { status: 500 }
    );
  }
}
