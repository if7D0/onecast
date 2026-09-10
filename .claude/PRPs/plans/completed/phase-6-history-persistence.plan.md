# Plan: Fase 6 — History & Persistence (OneCast)

## Summary

Tampilkan riwayat generate: route `GET /api/history` (paginasi + filter platform)
dan `DELETE /api/history/[id]` (kepemilikan diverifikasi), query baca di
`lib/db/queries.ts`, halaman `/history` (server-render awal + client "Muat lagi"
dan Hapus), dan aktifkan nav Riwayat. E2E tanpa AI calls (data dummy langsung DB).

## User Story

As a **user yang sudah generate**,
I want **melihat, memuat lebih banyak, dan menghapus riwayat saya**,
So that **saya tak perlu regenerate dan bisa bersih-bersih**.

## Problem → Solution

Hasil tersimpan tapi tak terlihat → histori per-user yang bisa dibaca,
difilter, dimuat bertahap, dan dihapus aman (hanya milik sendiri).

## Metadata

- **Complexity**: Small-Medium (fondasi write/limit ada; ~6 file)
- **Source PRD**: `.claude/PRPs/prds/onecast.prd.md`
- **PRD Phase**: Phase 6 — History & Persistence, eligible (dependensi Fase 5 `complete`)
- **Estimated Files**: 5 created, 2 updated

---

## UX Design

### Before

```
┌─────────────────────────────┐
│ Nav "Riwayat" disabled      │
│ /history → 404              │
└─────────────────────────────┘
```

### After

```
┌─────────────────────────────┐
│ Nav Riwayat aktif           │
│ /history: filter platform + │
│ daftar kartu (teks + tanggal│
│ + salin + hapus) + Muat lagi│
│ Kosong: empty state ramah   │
└─────────────────────────────┘
```

### Interaction Changes

| Touchpoint  | Before            | After                                                     | Notes                             |
| ----------- | ----------------- | --------------------------------------------------------- | --------------------------------- |
| Nav Riwayat | Disabled "Segera" | Link aktif + highlight                                    | Hapus badge                       |
| `/history`  | 404               | Daftar + filter + hapus                                   | Server-render + client interaktif |
| Hapus       | —                 | Konfirmasi bawaan browser? Tidak — hapus langsung + pesan | Sederhana MVP (undo = Fase 8+)    |
| Muat lagi   | —                 | Append halaman berikut                                    | Hilang bila habis                 |

---

## Mandatory Reading

| Priority | File                                     | Lines                  | Why                                                  |
| -------- | ---------------------------------------- | ---------------------- | ---------------------------------------------------- |
| P0       | `.claude/PRPs/prds/onecast.prd.md`       | 481–499                | Goal, tasks, deliverables Fase 6                     |
| P0       | `.claude/PRPs/prds/onecast.prd.md`       | API `GET /api/history` | Kontrak respons + pagination (ikuti)                 |
| P0       | `src/lib/db/queries.ts`                  | all                    | Gaya query + konstanta (tambah baca/hapus di sini)   |
| P0       | `src/app/api/generate/route.ts`          | all                    | Pola route: auth, zod, `fail()`, tanpa PII di log    |
| P0       | `prisma/schema.prisma`                   | model Generation       | Kolom yang dibaca                                    |
| P1       | `src/components/results/result-card.tsx` | all                    | Reuse untuk item (prop badge="Riwayat"?)             |
| P1       | `src/components/layout/nav-links.tsx`    | all                    | Aktifkan link Riwayat                                |
| P1       | `src/lib/validations/generation.ts`      | all                    | Gaya zod query                                       |
| P2       | `src/app/(dashboard)/dashboard/page.tsx` | fetch                  | Pola fetch client + error inline (Muat/Hapus meniru) |

## External Documentation

Tanpa riset eksternal — pola internal mapan.

---

## Patterns to Mirror

### HISTORY_API (kontrak PRD)

```
GET /api/history?page=1&limit=10&platform=twitter
→ { success:true, data:[{id, input(≤100 char), platform, tone, outputs, createdAt }],
    pagination:{page, limit, total, hasMore} }
DELETE /api/history/[id] → { success:true } | 404 bila bukan milik/tak ada
```

### DB_READ (tambah ke queries.ts)

```ts
export interface ListHistoryOptions {
  page?: number;
  limit?: number;
  platform?: Platform;
}
export interface HistoryItem {
  id: string;
  input: string;
  platform: Platform;
  tone: Tone;
  outputs: unknown;
  createdAt: Date;
}
export async function listGenerations(
  userId: string,
  opts?: ListHistoryOptions
): Promise<{ items: HistoryItem[]; total: number }>;
export async function deleteGeneration(userId: string, id: string): Promise<boolean>;
// list: where userId (+platform), orderBy createdAt desc, skip/take.
// delete: deleteMany({where:{id, userId}}) → return count > 0 (tak bocorkan milik orang).
```

### QUERY_SCHEMA (zod untuk searchParams)

```ts
// src/lib/validations/history.ts
export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  platform: z.enum(PLATFORMS).optional(),
});
// searchParams Next: string | string[] | undefined — coerce + pick pertama.
```

### HISTORY_PAGE (server awal + client interaktif)

```tsx
// src/app/(dashboard)/history/page.tsx (server):
const { user } = await requireUser();
const first = await listGenerations(user.id, { page: 1, limit: 10 });
return <HistoryList initial={first} />;
// src/app/(dashboard)/history/history-list.tsx (client):
// state items/total/page/filter; "Muat lagi" fetch GET; filter ubah → reset page 1;
// Hapus: fetch DELETE → hapus dari state + hitung total-1; error inline role=alert.
// Item: reuse ResultCard (body dari outputs[0].text, badge=tanggal singkat?) +
// tombol Hapus (Trash2) di samping CopyButton — bungkus flex, jangan ubah ResultCard
// kecuali perlu prop action. Putuskan: prop `action?: ReactNode` di ResultCard? Minimal:
// render ResultCard + baris aksi terpisah di bawahnya (tanpa ubah ResultCard).
```

---

## Files to Change

| File                                           | Action | Justification                         |
| ---------------------------------------------- | ------ | ------------------------------------- |
| `src/lib/validations/history.ts` + test        | CREATE | Skema query + 5 test                  |
| `src/lib/db/queries.ts`                        | UPDATE | `listGenerations`, `deleteGeneration` |
| `src/app/api/history/route.ts`                 | CREATE | GET paginasi + filter                 |
| `src/app/api/history/[id]/route.ts`            | CREATE | DELETE kepemilikan                    |
| `src/app/(dashboard)/history/page.tsx`         | CREATE | Server-render awal                    |
| `src/app/(dashboard)/history/history-list.tsx` | CREATE | Muat lagi + hapus + filter            |
| `src/components/layout/nav-links.tsx`          | UPDATE | Aktifkan Riwayat                      |
| `README.md`                                    | UPDATE | Dokumentasi API history               |

## NOT Building

- Edit konten histori (hanya baca + hapus)
- Multi-variasi / regenerasi dari histori (pasca-MVP)
- Undo hapus (Fase 8+)
- Search teks / filter tanggal (cukup filter platform)
- Infinite scroll otomatis (tombol eksplisit, hemat request)

---

## Step-by-Step Tasks

### Task 1: Skema query + test

- **ACTION**: Buat `history.ts` + test (coerce string→number, default, batas, platform invalid).
- **IMPLEMENT**: QUERY_SCHEMA. Helper `parseHistoryQuery(searchParams)` kembalikan
  `{page, limit, platform?}` (ambil elemen pertama bila array).
- **MIRROR**: `src/lib/validations/generation.ts`; TEST_STRUCTURE
- **IMPORTS**: `zod`, `@/types/generation`
- **GOTCHA**: `searchParams` di Route Handler = `URL.searchParams` (string murni) —
  helper terima `Record<string, string | string[] | undefined>` agar reusable.
- **VALIDATE**: `npm test` (42→≥47).

### Task 2: Query baca + hapus

- **ACTION**: Tambah 2 fungsi + tipe ke `queries.ts`.
- **IMPLEMENT**: DB_READ. `input` dipotong 100 char di SERVICE (bukan DB) agar
  DB tetap penuh? Kontrak PRD: respons berisi 100 char pertama — potong di route
  saat format (DB simpan penuh, tak berubah). `outputs` bertipe `unknown`
  (Json) — route teruskan apa adanya.
- **MIRROR**: `src/lib/db/queries.ts` (gaya + komentar server-only)
- **IMPORTS**: `./client`, `@/types/generation`
- **GOTCHA**: `deleteMany` (bukan `delete`) agar tak throw bila tak ada → boolean.
- **VALIDATE**: `tsc`.

### Task 3: Dua route API

- **ACTION**: Buat `GET` + `DELETE`.
- **IMPLEMENT**:
  - GET: auth 401 → parse query (400 bila invalid) → `listGenerations` →
    format item (input slice 0,100) + `hasMore = page*limit < total`.
  - DELETE: auth 401 → `deleteGeneration(user.id, id)` → true: `{success:true}`;
    false: 404 `{success:false, error:"Data tidak ditemukan."}` (sama untuk
    milik-orang — anti enumeration).
  - Log tanpa PII (id saja).
- **MIRROR**: `src/app/api/generate/route.ts` (`fail()`, switch error sederhana)
- **IMPORTS**: `next/server`, helpers, queries, validasi history
- **GOTCHA**: `params` di Next 15 = Promise (`{ params }: { params: Promise<{id:string}> }`)
  — wajib `await params`. Lupa = runtime error.
- **VALIDATE**: `tsc` + `lint`.

### Task 4: UI history + nav

- **ACTION**: Buat page + history-list; aktifkan nav.
- **IMPLEMENT**: HISTORY_PAGE. Filter platform: Select shadcn (Semua + 4).
  Item tanggal: `new Date(createdAt).toLocaleDateString("id-ID", {...})` +
  badge platform. Hapus: `confirm()` bawaan? Putuskan TIDAK (langsung + pesan
  "Dihapus." sementara? sederhana: hapus + hilangkan kartu). Error → alert inline.
  Nav: `/history` link aktif via pathname yang sudah ada; hapus badge + aria-disabled.
- **MIRROR**: `dashboard/page.tsx` (fetch + error); `result-list` (empty state);
  `tone-selector` (Select); FORM `role="alert"`
- **IMPORTS**: shadcn select/button, lucide (Trash2, History?), `@/types/generation`
- **GOTCHA**: `outputs` dari JSON: guard `Array.isArray` + `typeof text === "string"`,
  fallback "—" bila rusak (data lama/test). Jangan crash render.
  State halaman: saat filter berubah, reset items + page=1 (fetch ulang).
- **VALIDATE**: `tsc` + `lint` + `npm test` + `build`.

### Task 5: E2E tanpa AI + validasi akhir

- **ACTION**: Skrip temp: akun demo yang ADA (jangan buat baru) → insert 12 dummy
  via REST service (id eksplisit!) → GET page1 (10) + page2 (2, hasMore false) +
  filter platform → DELETE 1 (200) → DELETE lagi (404) → DELETE milik orang?
  (buat user kedua? hemat: cukup 404 ulang) → anon GET (401) → cleanup dummy.
  0 AI calls.
- **IMPLEMENT**: Validasi penuh + smoke `/history` anon → `/login` (middleware
  sudah mencakup prefix — verifikasi) + login render daftar.
- **MIRROR**: Pola skrip E2E Fase 5 (temp, cookie sesi, hapus setelahnya)
- **IMPORTS**: —
- **GOTCHA**: Insert REST wajib `id` eksplisit (pelajaran Fase 5). Bersihkan semua
  dummy agar DB user rapi.
- **VALIDATE**: Semua hijau + bukti di laporan.

---

## Testing Strategy

| Test             | Input              | Expected Output                                      | Edge? |
| ---------------- | ------------------ | ---------------------------------------------------- | ----- |
| Query coerce     | `?page=2&limit=5`  | {2,5}                                                | —     |
| Query batas      | `?page=0&limit=99` | default/clamp atau 400? Putuskan: coerce gagal → 400 | Ya    |
| Platform invalid | `?platform=fb`     | 400                                                  | Ya    |
| DELETE чужой     | id milik user lain | 404 (bukan 403)                                      | Ya    |
| E2E paging       | 12 baris           | p1=10 hasMore, p2=2                                  | —     |
| E2E filter       | platform           | hanya cocok                                          | —     |
| Outputs rusak    | `outputs: "x"`     | render fallback                                      | Ya    |

### Edge Cases Checklist

- [ ] Histori kosong (empty state + CTA ke dashboard)
- [ ] Limit/offset ekstrem (`?limit=1000` → clamp 50 atau 400 — konsisten: 400)
- [ ] Hapus saat halaman terakhir kosong → mundur halaman? Sederhana: tampilkan empty
- [ ] Zona waktu tanggal (paket `id-ID`, lokal browser — OK)

---

## Validation Commands

```bash
npx tsc --noEmit
npm run lint
npm test                  # EXPECT: ≥47 hijau
npx prettier --check .
npm run build
curl localhost:3000/api/history  # EXPECT: 401
```

### Manual Validation

- [ ] Login → /history tampil 10 pertama + filter bekerja
- [ ] Muat lagi append + hilang di akhir
- [ ] Hapus hilangkan kartu tanpa reload
- [ ] Akun lain tak bisa hapus (uji via API bila sempat)

---

## Acceptance Criteria

- [ ] GET paginasi + filter sesuai kontrak PRD
- [ ] DELETE aman kepemilikan (404 seragam)
- [ ] UI baca/hapus/muat/filter + empty state
- [ ] Nav aktif; middleware melindungi (sudah ada, verifikasi)
- [ ] Semua command hijau + CI hijau

## Completion Checklist

- [ ] Tanpa log PII; `await params` benar
- [ ] Guard outputs rusak
- [ ] README API diperbarui
- [ ] Data uji dibersihkan
- [ ] Self-contained

## Risks

| Risk                        | Likelihood | Impact | Mitigation                                                     |
| --------------------------- | ---------- | ------ | -------------------------------------------------------------- |
| Lupa `await params` Next 15 | Med        | High   | GOTCHA + tsc tak menangkap (runtime) — E2E DELETE wajib        |
| N+1 / berat (limit 50)      | Low        | Low    | Clamp 50; select kolom perlu saja                              |
| Hapus tak sengaja           | Med        | Med    | Tanpa undo MVP — teks tombol jelas "Hapus" + warna destructive |

## Notes

- Save (tulis) milik Fase 5 — Fase 6 murni baca + hapus, tanpa migrasi.
- `result-card` dipakai ulang tanpa ubah (aksi hapus di baris terpisah).
