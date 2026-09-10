# Plan: Fase 8 — Testing & Optimization (OneCast)

## Summary

Tutup gap test (helper `openai-compatible`, route `/api/health` + `/api/history`, wiring fallback end-to-end), lengkapi SEO (metadataBase + OG + `sitemap.ts` + `robots.ts` + OG image generatif), keraskan security headers, tambah `loading.tsx` boundaries, dan verifikasi via Lighthouse manual + skrip load native + checklist browser/mobile/a11y. Tanpa dependensi baru, tanpa perubahan alur/fitur.

## User Story

As a **calon user dari Google/media sosial**,
I want **preview link yang bagus, halaman cepat (Lighthouse >90), dan app bebas bug kritis**,
So that **saya percaya dan mau mendaftar**.

## Problem → Solution

78 test hijau tapi ada gap (4 area belum teruji), SEO minimal (tanpa OG/sitemap/robots), tanpa security headers, tanpa loading boundary → audit terukur + isi gap + verifikasi manual terdokumentasi di report.

## Metadata

- **Complexity**: Large
- **Source PRD**: `.claude/PRPs/prds/onecast.prd.md`
- **PRD Phase**: Phase 8 — Testing & Optimization, eligible (dependensi Fase 6, 7 `complete`)
- **Estimated Files**: 10 created, 4 updated

---

## UX Design

Sebagian besar internal. Yang user-facing: preview share (OG), skeleton saat navigasi.

### Before

```
┌──────────────────────────────────┐
│ Share link → preview polos       │
│ Navigasi dashboard/history →     │
│ layar kosong sesaat              │
│ SEO: title+desc saja             │
└──────────────────────────────────┘
```

### After

```
┌──────────────────────────────────┐
│ Share link → kartu OG + judul    │
│ Navigasi → skeleton loading      │
│ SEO: OG + sitemap + robots       │
│ Alur & tampilan lain TAK berubah │
└──────────────────────────────────┘
```

### Interaction Changes

| Touchpoint                    | Before        | After                               | Notes                               |
| ----------------------------- | ------------- | ----------------------------------- | ----------------------------------- |
| Share link sosmed             | Preview polos | Kartu OG 1200×630 + judul/deskripsi | File convention, tanpa ubah halaman |
| Navigasi /dashboard, /history | Blank sesaat  | Skeleton `loading.tsx`              | Streaming App Router                |
| Lainnya                       | —             | Tak berubah                         | Murni audit + hardening             |

---

## Mandatory Reading

| Priority       | File                                        | Lines   | Why                                                                     |
| -------------- | ------------------------------------------- | ------- | ----------------------------------------------------------------------- |
| P0 (critical)  | `.claude/PRPs/prds/onecast.prd.md`          | 529-552 | Goal, tasks, success signal, deliverables Fase 8                        |
| P0 (critical)  | `src/app/layout.tsx`                        | 1-35    | Metadata root yang akan diperluas (metadataBase, template, OG)          |
| P0 (critical)  | `src/lib/ai/providers/openai-compatible.ts` | all     | Helper tanpa test langsung — target Task 1                              |
| P0 (critical)  | `src/app/api/generate/route.test.ts`        | 1-40    | Pola `vi.mock` route test yang ditiru untuk history/health              |
| P1 (important) | `src/app/api/history/route.ts`              | 1-50    | Target `history/route.test.ts` (pola error 401/400/500)                 |
| P1 (important) | `src/app/api/history/[id]/route.ts`         | all     | Target `[id]/route.test.ts` (404 seragam, milik-sendiri)                |
| P1 (important) | `src/app/api/health/route.ts`               | all     | Target `health/route.test.ts` (boolean tanpa secret)                    |
| P1 (important) | `next.config.ts`                            | 1-5     | Kosong — tempat security `headers()`                                    |
| P1 (important) | `src/components/ui/skeleton.tsx`            | all     | Komponen reuse untuk `loading.tsx`                                      |
| P2 (reference) | `src/lib/ai/providers/fallback.test.ts`     | all     | Pola stubEnv + FakeProvider untuk wiring test                           |
| P2 (reference) | `src/components/forms/content-input.tsx`    | 47-101  | Bukti pola a11y mapan (`label`, `aria-live`, `role=alert`)              |
| P2 (reference) | `middleware.ts`                             | 8-10    | Matcher static-asset — pastikan `/sitemap.xml`, `/robots.txt`, OG lolos |

## External Documentation

| Topic                | Source                                                                                       | Key Takeaway                                                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| File metadata + OG   | nextjs.org/docs/app/getting-started/metadata-and-og-images                                   | `opengraph-image.tsx` (ImageResponse) / statis; `sitemap.xml` + `robots.txt` via konvensi file                              |
| `metadataBase` wajib | nextjs.org/docs/app/api-reference/functions/generate-metadata                                | Tanpa `metadataBase`, URL relatif OG jadi build error / preview rusak. Set sekali di root layout dari `NEXT_PUBLIC_APP_URL` |
| `robots.ts` typed    | nextjs.org/docs/app/api-reference/file-conventions/metadata/robots                           | Export `MetadataRoute.Robots`; sertakan `sitemap`; disallow `/api/`, area auth                                              |
| `sitemap.ts` typed   | nextjslaunchpad.com/article/nextjs-seo-metadata-api-sitemaps-json-ld-og-images (mirror docs) | Export `MetadataRoute.Sitemap`; hanya rute publik (`/`, `/login`, `/register`)                                              |
| Panduan Next lokal   | `node_modules/next/dist/docs/`                                                               | TIDAK ADA di Next 15 — diverifikasi via ls; riset memakai docs resmi di atas                                                |

---

## Patterns to Mirror

### ROUTE_TEST_MOCK

// SOURCE: `src/app/api/generate/route.test.ts:8-15,17-30`

```ts
vi.mock("@/lib/auth/helpers", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/ai", () => ({ generateForPlatforms: vi.fn() }));
function mockAuth(user: unknown) {
  vi.mocked(getCurrentUser).mockResolvedValue({ supabase: {}, user } as never);
}
function req(payload: unknown) {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
```

// Aturan: mock auth + service + db di batas modul; request via `new NextRequest`; assert status + `success` + header (`Retry-After`).

### STUB_ENV_PATTERN

// SOURCE: `src/lib/ai/providers/groq.test.ts` (beforeEach/afterEach)

```ts
beforeEach(() => {
  vi.stubEnv("GROQ_API_KEY", "test-key");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
```

// Aturan: key dummy agar lolos env guard; SELALU restore agar tak bocor antar file. Live: `describe.skipIf(!process.env.<KEY>)`, 1 call, timeout 120_000.

### AI_ERROR_PATH

// SOURCE: `src/lib/ai/errors.ts:41-56`, `src/app/api/generate/route.ts:18-34`

```ts
// mapProviderError: 429 → RATE_LIMITED; 401/403 → INVALID_KEY; dst.
// Route: INVALID_INPUT → 400; RATE_LIMITED → 503 + Retry-After; INVALID_KEY/PROVIDER_DOWN → 502.
```

// Aturan: test baru wajib assert kode AIError (bukan cuma throw) dan mapping status HTTP route.

### SERVER_ONLY_GUARD

// SOURCE: `src/lib/ai/providers/index.ts:1`

```ts
// SERVER-ONLY — jangan impor dari Client Component.
```

// Aturan: baris 1 di tiap file server baru (`sitemap.ts`, `robots.ts` tak perlu — route metadata, tapi JANGAN impor dari client).

### SKELETON_UI

// SOURCE: `src/components/ui/skeleton.tsx` (+ `aria-live` di `content-input.tsx:53-55,96-98`)

```tsx
// loading.tsx: reuse <Skeleton /> + teks aria-live="polite", tanpa fetch data.
```

### METADATA_ROOT

// SOURCE: `src/app/layout.tsx:17-21`

```ts
export const metadata: Metadata = {
  title: "OneCast — Ubah Satu Konten Jadi Banyak Format",
  description: "Tempel satu konten, ... Gratis dan open-source.",
};
```

// Aturan: perluas object ini (JANGAN pindah file); tambah `metadataBase`, `title.template`, `openGraph`, `twitter`, `robots`, `alternates.canonical`.

---

## Files to Change

| File                                             | Action | Justification                                                                    |
| ------------------------------------------------ | ------ | -------------------------------------------------------------------------------- |
| `src/lib/ai/providers/openai-compatible.test.ts` | CREATE | Helper baru tanpa test langsung (sukses/usage/kosong/429/timeout)                |
| `src/lib/ai/chain-wiring.test.ts`                | CREATE | Integration wiring: stubEnv + stub fetch → `generateForPlatforms` tanpa override |
| `src/app/api/health/route.test.ts`               | CREATE | Assert boolean configured, tanpa secret                                          |
| `src/app/api/history/route.test.ts`              | CREATE | GET: 401/400/paginasi/500 (pola ROUTE_TEST_MOCK)                                 |
| `src/app/api/history/[id]/route.test.ts`         | CREATE | DELETE: 401/404/bukan-milik/sukses                                               |
| `src/app/layout.tsx`                             | UPDATE | metadataBase + template + openGraph + twitter + robots + canonical               |
| `src/app/opengraph-image.tsx`                    | CREATE | OG 1200×630 via `next/og` ImageResponse (tanpa dep baru)                         |
| `src/app/sitemap.ts`                             | CREATE | Rute publik saja                                                                 |
| `src/app/robots.ts`                              | CREATE | allow `/`, disallow `/api/`, `/dashboard`, `/history`                            |
| `next.config.ts`                                 | UPDATE | Security `headers()`: nosniff, DENY frame, referrer, permissions                 |
| `src/app/(dashboard)/dashboard/loading.tsx`      | CREATE | Skeleton boundary (reuse Skeleton + aria-live)                                   |
| `src/app/(dashboard)/history/loading.tsx`        | CREATE | Skeleton boundary                                                                |
| `scripts/load-test.mjs`                          | CREATE | Pool konkuren native → `/` + `/api/health` + p95 (BUKAN `/api/generate`)         |
| `README.md`                                      | UPDATE | Bagian Testing & Optimasi: perintah, Lighthouse, load script                     |
| `.claude/PRPs/reports/phase-8-*.report.md`       | CREATE | (Saat implementasi) skor + checklist manual                                      |

## NOT Building

- Playwright/Cypress/e2e browser automation (dep + infra baru; diganti checklist manual + Lighthouse)
- Test DB sungguhan / Supabase staging (mock batas modul cukup; live AI test sudah cover integrasi provider)
- Load test ke `/api/generate` (429 + boros kuota AI — EKSPLISIT dilarang)
- `next-seo` atau plugin SEO (konflik dengan Metadata API; docs resmi melarang)
- i18n, JSON-LD rich results, CDN tuning (di luar PRD MVP)
- Refactor besar temuan audit (temua
  ...[truncated 10969 chars]
