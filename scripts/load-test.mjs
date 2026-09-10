// Smoke load-test native (tanpa dependensi): pool konkuren ke endpoint MURAH.
// DILARANG menarget /api/generate (rate limit 5/jam + boros kuota AI).
// Cara pakai: npm run build; npm run start -- --port 3100 &
//   node scripts/load-test.mjs [baseUrl] [concurrency] [requestsPerTarget]
// Contoh: node scripts/load-test.mjs http://localhost:3100 20 50

const rawBase = process.argv[2] ?? "http://localhost:3100";
if (!/^https?:\/\/.+/.test(rawBase)) {
  console.error("base harus URL http(s), contoh: http://localhost:3100");
  process.exit(1);
}
const base = rawBase;
const concurrency = Math.min(100, Math.max(1, Number(process.argv[3] ?? 20) || 20));
const perTarget = Math.min(500, Math.max(1, Number(process.argv[4] ?? 50) || 50));
const targets = ["/", "/api/health"];

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

async function hit(path) {
  const start = performance.now();
  try {
    // Timeout per request agar hang tak mengacaukan p95.
    const res = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(15_000) });
    await res.arrayBuffer().catch(() => null);
    return { ok: res.ok, ms: performance.now() - start, status: res.status };
  } catch (e) {
    return { ok: false, ms: performance.now() - start, status: 0, error: String(e).slice(0, 120) };
  }
}

async function pool(paths) {
  const results = new Array(paths.length);
  let next = 0;
  async function worker() {
    // next++ sinkron sebelum await pertama → race-safe di JS single-thread.
    while (next < paths.length) {
      const i = next++;
      results[i] = await hit(paths[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, worker));
  return results;
}

const paths = targets.flatMap((t) => Array.from({ length: perTarget }, () => t));
console.log(`Target: ${base} | konkuren: ${concurrency} | req: ${paths.length}`);
const t0 = performance.now();
const results = await pool(paths);
const wallMs = performance.now() - t0;

for (const t of targets) {
  const lat = results
    .filter((_, i) => paths[i] === t && results[i].ok)
    .map((r) => r.ms)
    .sort((a, b) => a - b);
  const fails = results.filter((_, i) => paths[i] === t && !results[i].ok);
  const statuses = {};
  for (const r of results.filter((_, i) => paths[i] === t)) {
    statuses[r.status] = (statuses[r.status] ?? 0) + 1;
  }
  console.log(
    `${t}: ok=${lat.length} gagal=${fails.length} status=${JSON.stringify(statuses)} ` +
      `p50=${percentile(lat, 50).toFixed(0)}ms p95=${percentile(lat, 95).toFixed(0)}ms`
  );
  for (const f of fails.slice(0, 3)) console.log(`  gagal: status=${f.status} ${f.error ?? ""}`);
}
console.log(
  `Total: ${(paths.length / (wallMs / 1000)).toFixed(1)} req/detik dalam ${(wallMs / 1000).toFixed(1)}s`
);
const failed = results.filter((r) => !r.ok).length;
if (failed > 0) process.exitCode = 1;
