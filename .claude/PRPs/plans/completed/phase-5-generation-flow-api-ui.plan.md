# Plan: Fase 5 — Generation Flow API + UI (OneCast)

## Summary

Sambungkan dashboard ke AI nyata: route `POST /api/generate` (auth + validasi
zod + rate limit DB 5/jam + panggil `generateForPlatforms` + simpan minimal per
platform ke `Generation`), dan dashboard beralih dari mock ke fetch (loading,
error inline, badge "AI"). Tanpa RHF/toast — useState + pesan inline (keputusan
user). Simpan DB minimal = fondasi baca Fase 6.

## User Story

As a **user login**,
I want **klik Generate dan dapat hasil AI nyata yang tersimpan**,
So that **saya bisa menyalin dan melihatnya lagi nanti (Fase 6)**.

## Problem → Solution

Hasil mock tak tersimpan + tak nyata → alur E2E produksi: validasi → limit →
AI → simpan → tampil, dengan error ramah tiap lapis.

## Metadata

- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/onecast.prd.md`
- **PRD Phase**: Phase 5 — Generation Flow, eligible (dependensi Fase 2, 3 `complete`)
- **Estimated Files**: 5 created, 3 updated
- **Keputusan user**: Rate limit DB-backed; error inline; useState + fetch.

---

## UX Design

### Before

```
┌─────────────────────────────┐
│ Generate → skeleton 1,2 dtk │
│ → kartu badge "Contoh"      │
│ Tak tersimpan, tak nyata    │
└─────────────────────────────┘
```

### After

```
┌─────────────────────────────┐
│ Generate → skeleton (s/d    │
│ ~35 dtk) → kartu badge "AI" │
│ Error: pesan inline jelas   │
│ Limit habis: pesan + kapan  │
│ bisa lagi. Tersimpan DB.    │
└─────────────────────────────┘
```

### Interaction Changes

| Touchpoint  | Before              | After                                   | Notes                         |
| ----------- | ------------------- | --------------------------------------- | ----------------------------- |
| Generate    | mock instan         | fetch API, loading lama (progress teks) | Nonaktifkan form saat loading |
| Error       | validasi lokal saja | + error server (limit/AI down) inline   | `role="alert"`                |
| Badge kartu | "Contoh"            | "AI"                                    | Prop badge                    |
| Anon POST   | — (tak ada API)     | 401                                     | Middleware + cek route        |

---

## Mandatory Reading

| Priority | File                                     | Lines            | Why                                                     |
| -------- | ---------------------------------------- | ---------------- | ------------------------------------------------------- |
| P0       | `.claude/PRPs/prds/onecast.prd.md`       | 454–475          | Goal, tasks, deliverables Fase 5                        |
| P0       | `.claude/PRPs/prds/onecast.prd.md`       | 589–632          | Kontrak request/response `/api/generate` (ikuti persis) |
| P0       | `src/lib/ai/index.ts`                    | all              | `generateForPlatforms` + `AIError` + metadata           |
| P0       | `src/app/(dashboard)/dashboard/page.tsx` | all              | Client yang diubah (mock → fetch)                       |
| P0       | `prisma/schema.prisma`                   | model Generation | Kolom simpan (tanpa migrasi baru)                       |
| P1       | `src/app/auth/callback/route.ts`         | all              | Pola Route Handler (NextRequest/NextResponse)           |
| P1       | `src/lib/auth/helpers.ts`                | all              | `getCurrentUser()` untuk 401                            |
| P1       | `src/lib/validations/auth.ts`            | all              | Gaya zod + pesan ID (ditiru)                            |
| P1       | `src/components/results/result-card.tsx` | all              | Badge hardcode → prop                                   |
| P2       | `src/lib/rate-limit.ts`                  | all              | Batas aksi (tetap untuk callback/auth; API pakai DB)    |

## External Documentation

Tanpa riset eksternal — pola internal (Route Handler, zod, Prisma) mapan.

---

## Patterns to Mirror

### ROUTE_HANDLER (tiru callback + auth actions)

```ts
// src/app/api/generate/route.ts
import { NextResponse, type NextRequest } from "next/server";
export async function POST(request: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: "…login…" }, { status: 401 });
  const parsed = generateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "…" }, { status: 400 });
  // …limit → service → simpan → respons PRD
}
```

### REQUEST_SCHEMA (zod, pesan ID)

```ts
// src/lib/validations/generation.ts
import { z } from "zod";
import { MAX_CONTENT_CHARS } from "@/lib/ai/prompts";
import { PLATFORMS, TONES } from "@/types/generation";
export const generateRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Konten wajib diisi.")
    .max(MAX_CONTENT_CHARS, `Maks ${MAX_CONTENT_CHARS} karakter.`),
  platforms: z.array(z.enum(PLATFORMS)).min(1, "Pilih minimal 1 platform.").max(4),
  tone: z.enum(TONES),
});
```

### DB_QUERIES (sesuai struktur PRD `lib/db/queries.ts`)

```ts
// src/lib/db/queries.ts — Prisma, server-only
import { prisma } from "./client";
export const GENERATE_LIMIT_PER_HOUR = 5;
export async function countRecentGenerations(userId: string, windowMs = 3_600_000): Promise<number>;
export async function saveGeneration(input: {
  userId;
  platform;
  tone;
  outputs;
  provider;
  tokensUsed;
}): Promise<void>;
// outputs: Json array [{text}] per baris platform (ikut skema PRD: 1 baris/platform).
```

### ERROR_MAP_HTTP (AIError → status)

| AIError code                | HTTP                | Pesan user                                        |
| --------------------------- | ------------------- | ------------------------------------------------- |
| RATE_LIMITED (provider)     | 503 + Retry-After   | "AI sibuk, coba lagi."                            |
| INVALID_INPUT               | 400                 | pesan asli                                        |
| INVALID_KEY / PROVIDER_DOWN | 502                 | "Layanan AI gangguan."                            |
| UNKNOWN                     | 500                 | "Terjadi kesalahan."                              |
| Limit user habis            | 429 + retryAfterSec | "Batas 5x/jam tercapai. Coba lagi dalam N menit." |

### UI_FETCH (ganti mock, skeleton + error tetap)

```tsx
const [error, setError] = useState("");
async function handleGenerate() {
  // validasi lokal tetap → setLoading → clearTimeout guard
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, platforms, tone }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) { setError(json.error ?? "…"); setStatus("idle"); return; }
  // json.data: Record<platform, {variations:[{text}]}> → map ke MockResult[]
  setResults(...); setStatus("done");
}
// Fase 5: hapus impor mockGenerate + setTimeout; tandai file mock "legacy Fase 6? tidak — biarkan + test".
```

---

## Files to Change

| File                                     | Action        | Justification                                                        |
| ---------------------------------------- | ------------- | -------------------------------------------------------------------- |
| `src/lib/validations/generation.ts`      | CREATE        | Skema request zod                                                    |
| `src/lib/validations/generation.test.ts` | CREATE        | Test skema (7+ kasus)                                                |
| `src/lib/db/queries.ts`                  | CREATE        | Count limit + simpan (fondasi Fase 6)                                |
| `src/app/api/generate/route.ts`          | CREATE        | Endpoint (auth, validasi, limit, AI, simpan)                         |
| `src/app/api/generate/route.test.ts`     | PERTIMBANGKAN | Route test = mock berat; ganti E2E live + unit query (lihat Testing) |
| `src/app/(dashboard)/dashboard/page.tsx` | UPDATE        | Fetch API, error server, badge "AI"                                  |
| `src/components/results/result-card.tsx` | UPDATE        | Prop `badge` (default "Contoh")                                      |
| `src/components/results/result-list.tsx` | UPDATE        | Teruskan badge (atau hapus badge? teruskan)                          |
| `README.md`                              | UPDATE        | Dokumentasi API + limit 5/jam                                        |

## NOT Building

- React Hook Form, toast/Sonner (keputusan user — inline)
- Halaman history/baca/delete (Fase 6 — write-only di sini)
- SSE/streaming (tetap request respons tunggal; sequential ~35 dtk worst case)
- Failover Groq/OpenRouter (Fase 7 — error provider diteruskan apa adanya)
- Optimasi paralel (sengaja sequential hemat kuota; catat)
- Hapus file mock (dibiarkan + test hijau; hapus pemakaian di page saja)

---

## Step-by-Step Tasks

### Task 1: Skema validasi + test

- **ACTION**: Buat `generation.ts` + test-nya. Jalankan.
- **IMPLEMENT**: REQUEST_SCHEMA persis. Test: valid; konten kosong; >5000;
  platforms kosong/>4/invalid; tone invalid; body bukan JSON ditangani route.
- **MIRROR**: `src/lib/validations/auth.ts` (gaya + pesan); TEST_STRUCTURE
- **IMPORTS**: `zod`, `@/types/generation`, `@/lib/ai/prompts` (MAX_CONTENT_CHARS)
- **GOTCHA**: `z.enum(PLATFORMS)` butuh tuple const — PLATFORMS sudah `as const` ✓.
- **VALIDATE**: `npm test` (skrg 42 → ≥49).

### Task 2: Query DB (limit + simpan)

- **ACTION**: Buat `src/lib/db/queries.ts`.
- **IMPLEMENT**: DB_QUERIES. `countRecentGenerations`: `prisma.generation.count`
  where userId + createdAt gte now-window. `saveGeneration`: `create` per platform
  (`outputs` Json = `[{text}]`, provider, tokensUsed proporsional? service hanya
  total — bagi rata per platform atau simpan total di tiap baris? Putuskan: bagi
  rata bulat (`Math.round(total/n)`), catat di komentar).
  Komentar "server-only".
- **MIRROR**: `src/lib/db/client.ts` (singleton); SERVICE error style
- **IMPORTS**: `@prisma/client` (tipe Json via `Prisma.InputJsonValue`? gunakan
  `object` + cast — Prisma menerima `JsonNull`? Untuk array: `outputs: [{text}]`
  langsung cocok dengan Json. Ketik param sebagai `{ text: string }[]`.)
- **GOTCHA**: `userId` UUID string — where langsung. Jam: `Date.now() - windowMs`.
- **VALIDATE**: `tsc`.

### Task 3: Route POST /api/generate

- **ACTION**: Buat `route.ts` mengikuti ROUTE_HANDLER + ERROR_MAP_HTTP.
- **IMPLEMENT**:
  1. `getCurrentUser()` → 401 `{success:false, error:"Silakan login dulu."}`.
  2. Parse JSON aman (`.catch(() => null)`) → zod → 400 pesan pertama.
  3. `countRecentGenerations(user.id)` ≥ 5 → 429 `{success:false, error, retryAfterSec}`
     (hitung sisa menit dari baris tertua dalam window? Sederhana: 60 menit.
     Lebih baik: query `findFirst orderBy createdAt asc` dalam window → sisa =
     60 - elapsed. Implementasi: tambah query `oldestRecentGeneration`.)
  4. `generateForPlatforms(...)` dalam try/catch AIError → ERROR_MAP_HTTP.
     Catch-all → 500 log server (tanpa PII: log code saja).
  5. Simpan per platform (await sekuensial; gagal simpan → log + TETAP kembalikan
     hasil? Putuskan: ya, hasil lebih penting; log error simpan. Catat di komentar).
  6. Respons PRD: `{success:true, data:{[p]:{variations:[{text, characterCount?, ...}]}},
metadata:{provider, tokensUsed, generationTime}}`.
     `characterCount` untuk twitter = body.length; linkedin/instagram/email: sertakan
     `text` saja (+ characterCount umum = length, murah dan konsisten).
- **MIRROR**: ROUTE_HANDLER; ERROR_MAP_HTTP; `getCurrentUser`
- **IMPORTS**: `next/server`, `@/lib/auth/helpers`, `./validations`? (path: `@/lib/validations/generation`), `@/lib/db/queries`, `@/lib/ai`
- **GOTCHA**: Route berjalan dengan kredensial user (anon key cookie) untuk auth,
  tapi Prisma service (bypass RLS by design — server-side, sudah pola Fase 2).
  Jangan log `content` (PII) — log metadata saja.
  `request.json()` throw bila body kosong → `.catch`.
- **VALIDATE**: `tsc` + `lint`.

### Task 4: UI colok API

- **ACTION**: Update dashboard page + badge prop di result-card/list.
- **IMPLEMENT**: UI_FETCH. Map respons: untuk tiap platform key di `data`,
  `variations[0].text` → `{platform, title: label + " — hasil AI", body}`.
  Footer: twitter? API tak kirim footer — tampilkan tanpa footer (atau hashtag
  dari teks bila ada? tidak — tampilkan apa adanya).
  Badge: `result-list` terima `badge="AI"`, teruskan ke card; default "Contoh"
  agar mock/test lama tak rusak. Error server → `formError` (role=alert).
  Nonaktifkan input saat loading? Minimal: tombol disabled (sudah) + `aria-busy`
  area hasil (sudah). Hapus impor `mockGenerate`/setTimeout; hapus `timer` bila
  tak terpakai (cleanup effect ikut hapus bila tak perlu).
  Progress teks saat loading lama: "Membuat… (bisa ~30 detik)" — ubah label
  GenerateButton? Tambah hint statis di bawah tombol saat loading.
- **MIRROR**: UI_FETCH; FORM_STATE_PATTERN (tetap)
- **IMPORTS**: tanpa mock; tipe `MockResult` tetap (bentuk sama)
- **GOTCHA**: `fetch` tanpa timeout client — browser menunggu; server max ~4×60s
  teori. Praktis ~35s. Tambah `AbortSignal.timeout(120_000)` + pesan "terlalu lama".
  Hasil parsial bila 1 platform gagal? Service throw total (Fase 4) — Fase 5
  teruskan error total (parsial = Fase 7+).
- **VALIDATE**: `tsc` + `lint` + `npm test` + `build`.

### Task 5: E2E live + validasi akhir

- **ACTION**: Skrip temp (seperti Fase 2): login API → cookie → POST generate
  (2 platform) → assert 200 + shape + baris DB + limit (ulang hingga 429?
  hemat: cukup 1 generate + cek count bertambah; 429 diuji via unit dengan
  fake counter? Unit: skema + map cukup; limit logic diuji via DB live sekali:
  generate 1x lalu count=1. Untuk 429: buat 5 cepat? 5×2 calls = 10 AI calls —
  boros. Ganti: uji 429 dengan memanggil route 6x memakai... tetap kena AI.
  Solusi hemat: unit test fungsi limit dengan DB live (insert 5 baris dummy via
  prisma langsung, panggil endpoint → 429 tanpa AI call, lalu hapus). Total AI
  calls: 2 (1 E2E).)
- **IMPLEMENT**: Validasi penuh: `tsc`, `lint`, `npm test`, `prettier`, `build`,
  smoke `/api/generate` anon → 401 (curl tanpa cookie).
- **MIRROR**: Pola skrip E2E Fase 2 (temp, hapus setelahnya)
- **IMPORTS**: —
- **GOTCHA**: Bersihkan data uji (hapus baris Generation + user test) agar DB rapi.
  Jangan commit skrip temp.
- **VALIDATE**: Semua hijau + bukti E2E di laporan.

---

## Testing Strategy

| Test                        | Input                  | Expected Output                                    | Edge? |
| --------------------------- | ---------------------- | -------------------------------------------------- | ----- |
| Skema valid                 | konten+2 platform+tone | pass                                               | —     |
| Skema kosong/panjang/salah  | variasi                | pesan ID tepat                                     | Ya    |
| Limit: 5 baris dummy → POST | auth valid             | 429 + retryAfterSec, tanpa AI call                 | Ya    |
| E2E: POST 2 platform        | auth valid             | 200 + shape PRD + 2 baris DB                       | —     |
| Anon POST                   | tanpa cookie           | 401                                                | Ya    |
| Body bukan JSON             | "xxx"                  | 400                                                | Ya    |
| AI down (fake throw)        | unit service?          | 502 mapping (unit via mapProviderError, sudah ada) | —     |

### Edge Cases Checklist

- [ ] Platforms duplikat (dedupe di route? zod tak dedupe — tambah `.transform` unik? Putuskan: dedupe via `[...new Set()]` sebelum service)
- [ ] Tone/platform case acak ("Twitter") → 400 (ketat, benar)
- [ ] Content whitespace saja → 400
- [ ] Simpan gagal → hasil tetap kembali + log
- [ ] Concurrent 2 generate (limit race — terima best-effort, catat)

---

## Validation Commands

```bash
npx tsc --noEmit
npm run lint
npm test                  # EXPECT: ≥49 hijau
npx prettier --check .
npm run build
curl -X POST localhost:3000/api/generate -H "Content-Type: application/json" -d "{}"  # EXPECT: 401
```

### Manual Validation

- [ ] Browser login → generate 2 platform → hasil AI + badge "AI" + salin bekerja
- [ ] Generate ke-6 dalam sejam → pesan limit ramah
- [ ] Logout → POST → 401

---

## Acceptance Criteria

- [ ] Route sesuai kontrak PRD (status + shape + metadata)
- [ ] Validasi zod + limit 5/jam DB-backed + error mapping
- [ ] UI E2E nyata, mock tak dipakai page (file boleh tetap)
- [ ] Hasil tersimpan (1 baris/platform)
- [ ] Semua command hijau + CI hijau

## Completion Checklist

- [ ] Tanpa log PII/kunci; tanpa impor AI di client
- [ ] Dedupe platform; pesan ID konsisten
- [ ] README API + limit diperbarui
- [ ] Data uji dibersihkan
- [ ] Self-contained

## Risks

| Risk                        | Likelihood | Impact | Mitigation                           |
| --------------------------- | ---------- | ------ | ------------------------------------ |
| Latensi 30s+ (sequential)   | High       | Med    | Hint loading jujur; paralel = Fase 7 |
| Race limit konkuren         | Low        | Low    | Best-effort; catat                   |
| Kuota Gemini habis saat E2E | Low        | Med    | Total ±2 AI calls; hemat             |
| Simpan gagal → data hilang  | Low        | Med    | Hasil tetap dikembalikan + log       |

## Notes

- Deviasi sadar vs bunyi PRD: tanpa RHF (useState cukup), tanpa toast (inline),
  simpan DB minimal di Fase 5 (fondasi Fase 6, disetujui user).
- `variations` selalu 1 item di Fase 5 (multi-variasi = pasca-MVP).
- `oldestRecentGeneration` ditambahkan untuk `retryAfterSec` akurat.
