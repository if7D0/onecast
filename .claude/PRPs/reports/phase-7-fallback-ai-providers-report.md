# Implementation Report: Fase 7 — Fallback AI Providers

## Summary

Rantai fallback AI Gemini → Groq → OpenRouter diimplementasikan penuh:
dua provider baru (`GroqProvider`, `OpenRouterProvider`) via native fetch
OpenAI-compatible (nol dependensi baru), failover otomatis per platform call
di `generateForPlatforms`, dan endpoint `GET /api/health` untuk monitoring
status konfigurasi. Tanpa perubahan UI maupun signature API.

## Assessment vs Reality

| Metric        | Predicted (Plan)                          | Actual                              |
| ------------- | ----------------------------------------- | ----------------------------------- |
| Complexity    | Medium                                    | Medium                              |
| Confidence    | 8                                         | Tercapai — single pass + 1 fix test |
| Files Changed | 4 created, 3 updated (+ test/health/docs) | 6 created, 6 updated                |

## Tasks Completed

| #   | Task                      | Status        | Notes                                                                    |
| --- | ------------------------- | ------------- | ------------------------------------------------------------------------ |
| 1   | Env guards + isConfigured | Done Complete | `geminiEnv` sempat terhapus saat edit, langsung dikembalikan + tsc hijau |
| 2   | GroqProvider              | Done Complete | Sesuai plan                                                              |
| 3   | OpenRouterProvider        | Done Complete | Sesuai plan                                                              |
| 4   | Rantai fallback           | Done Complete | Deviasi kecil — lihat bawah                                              |
| 5   | Colok chain ke service    | Done Complete | Sesuai plan                                                              |
| 6   | Health + docs             | Done Complete | Sesuai plan                                                              |
| 7   | Test + validasi           | Done Complete | 1 fix: stub env key di test (lihat Issues)                               |

## Validation Results

| Level           | Status    | Notes                                                                                                            |
| --------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| Static Analysis | Done Pass | `tsc --noEmit` nol error; `eslint --quiet` bersih                                                                |
| Unit Tests      | Done Pass | 75 passed, 2 skipped (live Groq/OpenRouter tanpa key)                                                            |
| Build           | Done Pass | `npm run build` sukses; `/api/health` terdaftar di route table                                                   |
| Integration     | Done Pass | `GET /api/health` live via `next start`: `{success:true, providers:[gemini:true, groq:false, openrouter:false]}` |
| Edge Cases      | Done Pass | Failover, fail-fast input, chain kosong, tanpa-key — semua ter-cover unit test                                   |
| Format          | Done Pass | Prettier applied ke file baru/ubahan (`CLAUDE.md` warn pre-existing, tak disentuh)                               |

## Files Changed

| File                                      | Action  | Lines                           |
| ----------------------------------------- | ------- | ------------------------------- |
| `src/lib/ai/providers/groq.ts`            | CREATED | +88                             |
| `src/lib/ai/providers/openrouter.ts`      | CREATED | +95                             |
| `src/lib/ai/providers/fallback.test.ts`   | CREATED | +~110                           |
| `src/lib/ai/providers/groq.test.ts`       | CREATED | +~90                            |
| `src/lib/ai/providers/openrouter.test.ts` | CREATED | +~90                            |
| `src/app/api/health/route.ts`             | CREATED | +9                              |
| `src/lib/ai/env.ts`                       | UPDATED | +41                             |
| `src/lib/ai/providers/index.ts`           | UPDATED | +65 / -10                       |
| `src/lib/ai/index.ts`                     | UPDATED | +~25 / -~10                     |
| `.env.example`                            | UPDATED | +2 komentar                     |
| `README.md`                               | UPDATED | +18 (bagian AI Fallback)        |
| `.claude/PRPs/prds/onecast.prd.md`        | UPDATED | status → in-progress + ref plan |

## Deviations from Plan

1. **Typo import di plan** (`from ".//groq"`): diimplementasikan sebagai
   `"./groq"` yang benar. WHAT: satu karakter. WHY: typo plan.
2. **Empty-chain handling**: plan menawarkan 2 opsi (dynamic import
   `geminiEnv` vs throw langsung). Dipilih throw langsung dengan pesan
   gabungan 3 key. WHY: lebih sederhana, tanpa dynamic import.
3. Keduanya dalam toleransi opsi yang diizinkan plan — bukan perubahan desain.
4. **Model Groq diganti** (`llama-3.3-70b-versatile` → `openrouter`
   `openai/gpt-oss-120b`; `GroqProvider.name` → `groq-gpt-oss-120b`):
   live test membuktikan slug lama 404 "does not exist or you do not have
   access". Daftar model aktif dikonfirmasi via `GET /api/groq.../v1/models`
   memakai key user. WHY: risiko "slug pensiun" yang sudah diprediksi plan.
   File ikut disesuaikan: `getProviderStatuses`, ekspektasi chain di
   `fallback.test.ts`, contoh `metadata.provider` di README. Live test Groq
   hijau pasca-ganti (~0,8 dtk).

## Issues Encountered

1. **Edit Task 1 menghapus `geminiEnv`**: `oldString` mencakup seluruh blok
   fungsi dan `newString` tidak menyertakannya. Terdeteksi segera (review
   output tool), diperbaiki dengan edit susulan, verified via `tsc`.
2. **8 unit test gagal `INVALID_KEY`**: test men-stub `fetch` tapi lupa stub
   env key, sehingga env guard throw duluan. Ini perilaku implementasi yang
   BENAR. Fix di test: `beforeEach(vi.stubEnv(<KEY>, "test-key"))` +
   `vi.unstubAllEnvs()` di `afterEach`. Semua hijau setelahnya.

## Tests Written

| Test File            | Tests                  | Coverage                                                                                        |
| -------------------- | ---------------------- | ----------------------------------------------------------------------------------------------- |
| `groq.test.ts`       | 5 stub + 1 live (skip) | Sukses/usage, tanpa-usage, kosong, 429, 401, live                                               |
| `openrouter.test.ts` | 5 stub + 1 live (skip) | Mirror Groq                                                                                     |
| `fallback.test.ts`   | 8                      | Failover, fail-fast, error-terakhir, chain-kosong, urutan chain, 1-key, 0-key, regresi override |

## Manual Validation (dari plan)

- [x] `GET /api/health` → boolean tanpa secret (verified live)
- [x] Tanpa `NEXT_PUBLIC.*API_KEY` di `src` (grep: nol hasil)
- [x] Tanpa dep SDK baru (grep `groq-sdk`/`openai` di package.json: nol hasil)
- [x] Kuota live dipakai: 1 call (Gemini, dari suite lama) + 0 baru
- [ ] Cabut `GOOGLE_AI_API_KEY` → fallback Groq/OpenRouter: butuh key
      Groq/OpenRouter asli (belum ada) — diverifikasi via unit test failover
- [ ] `metadata.provider` fallback di `/api/generate`: sama — butuh key
      kedua untuk e2e penuh

## Follow-up Review (MEDIUM warnings — DONE)

- Dedup: `src/lib/ai/providers/openai-compatible.ts` (helper `chatCompletions`
  - `OpenAICompatConfig`); `groq.ts`/`openrouter.ts` tinggal ~25 baris
    (konstanta + guard + delegasi). Pesan env guard spesifik per provider
    dipertahankan.
- `console.warn` → param opsional `onFallback(name, code)` di
  `generateWithFallback` (default diam) + 1 unit test callback.
- Re-validasi: tsc bersih, lint bersih, prettier bersih, **78/78 test hijau**
  (termasuk 3 live), build sukses.

- [x] Isi `GROQ_API_KEY` / `OPENROUTER_API_KEY` lalu `npm test` — DONE:
      77/77 hijau (live Groq + OpenRouter + Gemini semua jalan)
- [ ] Code review via `/code-review`
- [ ] Commit + PR via `/prp-pr`
