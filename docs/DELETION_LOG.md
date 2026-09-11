# Code Deletion Log

## [2026-09-11] Refactor Session — dead-code sweep (SAFE only)

Metode: `npx tsc --noEmit` + `npm run lint` + `npm test` sebagai baseline (104 test lolos),
lalu grep referensi + cek dynamic import + review git history per kandidat.
Hanya kategori SAFE yang dihapus. Kategori CAREFUL/RISKY dicatat di bawah untuk review manual.
Backup branch: `backup-pre-cleanup-2026-09-11`.

### Unused Exports Removed

- `src/lib/db/queries.ts` — `countRecentGenerations()` — 0 caller, wrapper tipis `recentGenerationUsage().count`. Route `/api/generate` memakai `recentGenerationUsage` langsung.
- `src/lib/db/queries.ts` — `oldestRecentGeneration()` — 0 caller, wrapper tipis `recentGenerationUsage().oldest`. Route memakai field `oldest` dari `recentGenerationUsage` langsung.
- `src/lib/db/queries.ts` — `saveGeneration()` (singular) — 0 caller, duplikat dari `saveGenerations()` (plural). Semua caller (`src/app/api/generate/route.ts`) memakai versi batch `createMany` 1 roundtrip.
- `src/lib/ai/providers/index.ts` — `getDefaultProvider()` — 0 caller, kompat legacy Fase 4/5 ("selalu Gemini"). Rantai aktif adalah `getFallbackChain()` + `generateWithFallback()`.

### Dead Branch Removed

- `src/components/results/copy-button.tsx` — blok `if (!ok) { /* komentar saja */ }` kosong di `handleClick`. Dihapus, perilaku identik (tombol tetap "Salin" bila gagal, `title` sudah menangani status).

### Duplicate Code Consolidated

- `saveGeneration` + `saveGenerations` -> `saveGenerations` (satu jalur simpan batch, termasuk single-element).
- Alasan: implementasi singular hanya `prisma.generation.create`, sepenuhnya tercakup `createMany`.

### Unused Dependencies Removed

- (Tidak ada yang dihapus sesi ini — konservatif.)

### Unused Files Deleted

- (Tidak ada — semua file di `src/` punya importer; entry Next.js `page/layout/route/loading` dikecualikan.)

### Remaining (manual review needed — JANGAN hapus otomatis)

- `shadcn@^4.21.0` (dependencies): 0 import di kode. Kemungkinan CLI scaffolding (`npx shadcn`), bukan runtime. Opsi: pindah ke devDependencies atau hapus bila workflow tak memakainya — butuh konfirmasi tim.
- `@supabase/supabase-js@^2.116.0` (direct dep): 0 import langsung, hanya `@supabase/ssr` yang dipakai (`createBrowserClient`/`createServerClient`). Kemungkinan transitif via `@supabase/ssr`. Jangan hapus tanpa cek `npm ls` + build production.
- `cn@^0.2.6`: dipakai (7 file UI import langsung dari `"cn"` + re-export `src/lib/utils.ts`). Inkonsistensi: 2 file (`platform-selector`, `nav-links`) import dari `@/lib/utils`, 7 file dari `"cn"`. Unifikasi ke satu jalur disarankan, tapi ubah 7 file — tunda ke sesi khusus.
- Tipe tanpa importer langsung (`GenerateRequest`, `HistoryQuery`, `LoginInput`, `RegisterInput`, `GenerationMetadata`): bagian kontrak publik (skema zod / return type). Sengaja dipertahankan.
- `wrapContent`, `toneInstruction`, `CONTENT_DELIMITER_END` (`src/lib/ai/prompts/templates.ts`): hanya dipakai internal + test memakai `CONTENT_DELIMITER_START`. Ekspor dipertahankan sebagai API modul prompt.
- Duplikat terdocumentasi (tidak direfaktor sesi ini, perlu keputusan desain):
  - `estimateTokens()` identik di `gemini.ts` + `openai-compatible.ts` -> kandidat `src/lib/ai/tokens.ts` bersama. Ditunda: kopling gemini -> openai-compatible tidak tepat tanpa file baru.
  - `PLATFORM_ICONS` identik di `platform-selector.tsx` + `result-card.tsx` (+ array mentah di `app/page.tsx`) -> kandidat `src/components/platform-icons.tsx`. Ditunda: 2 pemakaian, risiko churn > manfaat.
  - Suffix judul `"— hasil AI"` di `src/lib/ai/index.ts` (`toOutput`) + `src/app/(dashboard)/dashboard/page.tsx` (mapping respons) -> kandidat helper `aiResultTitle()` di `src/types/generation.ts`. Ditunda: sinkronisasi server/client, sentuh UX.
  - `CONTENT_MAX = 5000` (`content-input.tsx`, client) vs `MAX_CONTENT_CHARS = 5000` (`prompts/templates.ts`, server): duplikasi disengaja agar client tak import modul SERVER-ONLY. Pertahankan sinkron manual.
  - `excerpt()` (mock) vs `truncate()` (ai/index): konteks beda (demo deterministik vs output AI), nama beda disengaja.

### Impact

- Files deleted: 0
- Dependencies removed: 0
- Files modified: 3 (`queries.ts`, `providers/index.ts`, `copy-button.tsx`)
- Lines of code removed: 42 (deletions only, 0 additions)
- Bundle size reduction: negligible (~0 KB runtime — yang dihapus hanya server-side helper tak ter-bundle ke client + 1 cabang kosong)

### Testing

- `npx tsc --noEmit` — lolos (sebelum & sesudah)
- `npm run lint` — lolos (sebelum & sesudah)
- `npx eslint . --report-unused-disable-directives` — lolos, 0 unused directive
- `npm test` — 21 file / 104 test lolos (sebelum & sesudah, termasuk 3 live AI test bila key tersedia)
- `npx prettier --write` pada 3 file yang diubah, lalu `--check` lolos
- Rollback bila regresi: `git revert HEAD` atau `git reset --hard backup-pre-cleanup-2026-09-11`, lalu `npm install`
