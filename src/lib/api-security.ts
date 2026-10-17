// ==============================================================================
// PRICE TRACKER SK — API VALIDATION, RATE LIMITING & AUTHORIZATION HELPERS
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_USER_ID } from './db/repository';

interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= maxRequests) {
    const oldest = bucket.timestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, windowMs - (now - oldest)),
    };
  }

  bucket.timestamps.push(now);
  rateLimitStore.set(key, bucket);
  return {
    allowed: true,
    remaining: maxRequests - bucket.timestamps.length,
    resetInMs: windowMs,
  };
}

export function extractAuthContext(req: NextRequest): {
  userId: string;
  guestSessionId: string | null;
} {
  const headerUser = req.headers.get('x-user-id')?.trim();
  const headerGuest = req.headers.get('x-guest-session-id')?.trim() ?? null;
  return {
    userId: headerUser || DEFAULT_USER_ID,
    guestSessionId: headerGuest,
  };
}

export function jsonError(
  message: string,
  status = 400,
  code = 'BAD_REQUEST',
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null,
      },
    },
    { status }
  );
}

export async function parseValidatedJson<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const raw = await req.json();
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        response: jsonError(
          'Neplatné vstupné údaje požiadavky.',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten()
        ),
      };
    }
    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      response: jsonError('Neplatný formát JSON tela požiadavky.', 400, 'INVALID_JSON'),
    };
  }
}
