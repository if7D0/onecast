# Implementation Report: Fase 4 — AI Integration Primer

## Summary

Lapisan AI server-only selesai: abstraksi `AIProvider`, implementasi Gemini
(`@google/genai` v2, model `gemini-3.6-flash`), 4 template prompt + builder
dengan delimiter anti-injection, service `generateForPlatforms` (sequential +
post-process lokal), error mapping + timeout 60s, dan 12 test (11 fake selalu
hijau + 1 live hijau). Branch: `feat/phase-4-ai-primary`.

## Assessment vs Reality

| Metric     | Predicted (Plan)      | Actual                                      |
| ---------- | --------------------- | ------------------------------------------- |
| Complexity | Medium                | Medium                                      |
| Confidence | 8/10                  | 9/10 (uji live menemukan 2 fakta API nyata) |
| Files      | 10 created, 2 updated | 11 created, 3 updated (+types, README, env) |

## Tasks Completed

| #   | Task                             | Status | Notes                                           |
| --- | -------------------------------- | ------ | ----------------------------------------------- |
| 0   | API key                          | done   | User buatkan; terverifikasi via live call       |
| 1   | SDK + abstraksi + guard + errors | done   | Pin `@google/genai@^2`                          |
| 2   | 4 prompt + builder               | done   | Digabung `templates.ts` (deviasi, bawah)        |
| 3   | Provider + factory               | done   | Timeout 60s; tanpa thinkingBudget (API menolak) |
| 4   | Service                          | done   | Sequential; shape = kontrak UI                  |
| 5   | Test + validasi                  | done   | 36/36 (12 baru: 11 fake + 1 live)               |

## Validation Results

| Level           | Status | Notes                                  |
| --------------- | ------ | -------------------------------------- |
| Static Analysis | Pass   | `tsc`, `lint` bersih                   |
| Unit Tests      | Pass   | 36/36 termasuk live Gemini (8,2 dtk)   |
| Format          | Pass   | `prettier --check .` bersih            |
| Build           | Pass   | Hijau                                  |
| Import check    | Pass   | Nol impor `@google/genai` dari `*.tsx` |
| Kuota           | OK     | ±6 calls live selama implementasi      |

## Files Changed

| File                                         | Action            |
| -------------------------------------------- | ----------------- |
| `src/lib/ai/{types,errors,env}.ts`           | CREATED           |
| `src/lib/ai/providers/{gemini.ts,index.ts}`  | CREATED           |
| `src/lib/ai/prompts/{templates.ts,index.ts}` | CREATED           |
| `src/lib/ai/index.ts`                        | CREATED           |
| `src/lib/ai/{prompts,index}.test.ts`         | CREATED (12 test) |
| `package.json`, `.env.example`, `README.md`  | UPDATED           |

## Deviations from Plan

- **Prompt 1 file** (`templates.ts`) bukan 4 file: fungsi kecil, lebih kohesif.
- **`providers.ts` → `types.ts`**: konflik nama file vs folder `providers/`.
- **Model `gemini-3.6-flash`** bukan 2.5: API 404 "no longer available to new users".
- **Timeout 60s** bukan 30s: thinking model kadang >30s (terbukti 8-30s).
- **Tanpa `thinkingBudget: 0`**: API 400 INVALID_ARGUMENT untuk model ini.
- **Cabang 404 + pesan server** di error mapping (tak ada di plan).

## Issues Encountered

1. **404 model pensiun** → ganti model + cabang error 404 + pesan server.
2. **Live UNKNOWN persisten** → akar ganda: thinking lambat (>30s abort tak
   termapping) + thinkingBudget ditolak. Fix: timeout 60s, hapus thinkingBudget,
   mapping abort longgar. Terbukti via 3 skrip debug (dihapus).
3. **vitest tak load `.env`** → `import "dotenv/config"` di live test.
4. **Path impor test salah** (`./templates` vs `./prompts/templates`) → fixed.

## Tests Written

| Test File                    | Tests | Coverage                                 |
| ---------------------------- | ----- | ---------------------------------------- |
| `src/lib/ai/prompts.test.ts` | 8     | Penanda platform, tone, delimiter, batas |
| `src/lib/ai/index.test.ts`   | 4     | Fake shape/batas/validasi + live twitter |

## Next Steps

- [ ] Code review via `/code-review`
- [ ] PR via `/prp-pr`
- [ ] Fase 5: route `POST /api/generate` (wajib zod + rate limit + simpan DB Fase 6)
