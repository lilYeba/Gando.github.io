import { runRetailerIngestion, getImportJobs, getDataSources } from '../src/lib/db/repository';
import type { RetailerSlug } from '../src/lib/domain/types';

async function main() {
  console.log('==================================================');
  console.log('PRICE TRACKER SK — LIVE RETAILER INGESTION PIPELINE');
  console.log('==================================================');

  const args = process.argv.slice(2);
  const targetRetailerArg = args.find((a) => a.startsWith('--retailer='))?.split('=')[1] as RetailerSlug | undefined;
  const targetRetailers: RetailerSlug[] = targetRetailerArg ? [targetRetailerArg] : ['lidl', 'billa', 'tesco'];

  for (const slug of targetRetailers) {
    console.log(`\n[${slug.toUpperCase()}] Spúšťam synchronizáciu dát...`);
    const startTime = Date.now();

    try {
      const mode = slug === 'tesco' ? 'CSV_FALLBACK' : 'LIVE_ADAPTER';
      const result = await runRetailerIngestion({
        retailerSlug: slug,
        mode,
      });

      const durationMs = Date.now() - startTime;
      console.log(`✓ Stav úlohy: ${result.job.status} (trvanie: ${durationMs} ms)`);
      console.log(`  - Nájdených položiek: ${result.job.itemsDiscovered}`);
      console.log(`  - Importovaných nových cien: ${result.job.itemsImported}`);
      console.log(`  - Deduplikovaných existujúcich: ${result.job.itemsDeduplicated}`);
      console.log(`  - Chýb: ${result.job.errorCount}`);
      if (result.job.summaryNotes) {
        console.log(`  - Poznámka: ${result.job.summaryNotes}`);
      }
    } catch (err) {
      console.error(`✗ Chyba pri synchronizácii ${slug}:`, err);
    }
  }

  console.log('\n==================================================');
  console.log('Súhrn registrovaných dátových zdrojov:');
  const sources = getDataSources();
  for (const s of sources) {
    console.log(`- [${s.reliabilityStatus}] ${s.name} (posledný úspech: ${s.lastSuccessAt || 'nikdy'})`);
  }
  console.log('==================================================\n');
}

main().catch((err) => {
  console.error('Kritická chyba pipeline:', err);
  process.exit(1);
});
