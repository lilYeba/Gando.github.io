import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getDataSources,
  getImportJobs,
  getPendingMatchCandidates,
  resolvePendingMatchCandidate,
  runRetailerIngestion,
} from '@/lib/db/repository';
import {
  checkRateLimit,
  extractAuthContext,
  jsonError,
  parseValidatedJson,
} from '@/lib/api-security';

export async function GET() {
  return NextResponse.json({
    dataSources: getDataSources(),
    importJobs: getImportJobs(25),
    pendingMatches: getPendingMatchCandidates(),
  });
}

const IngestPostSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('run_adapter'),
    retailerSlug: z.enum(['lidl', 'tesco', 'billa']),
    mode: z.enum(['LIVE_ADAPTER', 'CSV_FALLBACK']),
    csvContent: z.string().max(250_000).optional(),
  }),
  z.object({
    action: z.literal('resolve_match'),
    listingId: z.string().min(1),
    decision: z.enum(['APPROVE', 'REJECT']),
  }),
]);

export async function POST(req: NextRequest) {
  const { userId } = extractAuthContext(req);
  const rl = checkRateLimit(`ingest:${userId}`, 12, 60_000);
  if (!rl.allowed) {
    return jsonError(
      'Prekročený limit spúšťania importov (max. 12 za minútu).',
      429,
      'RATE_LIMITED'
    );
  }

  const parsed = await parseValidatedJson(req, IngestPostSchema);
  if (!parsed.success) return parsed.response;

  if (parsed.data.action === 'resolve_match') {
    const pendingMatches = resolvePendingMatchCandidate(
      parsed.data.listingId,
      parsed.data.decision
    );
    return NextResponse.json({ pendingMatches });
  }

  const runResult = await runRetailerIngestion({
    retailerSlug: parsed.data.retailerSlug,
    mode: parsed.data.mode,
    csvContent: parsed.data.csvContent,
  });

  return NextResponse.json({
    ...runResult,
    dataSources: getDataSources(),
    importJobs: getImportJobs(25),
  });
}
