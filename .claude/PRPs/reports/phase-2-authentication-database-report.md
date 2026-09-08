# Implementation Report: Fase 2 — Authentication & Database

## Summary

Auth Supabase penuh (email/password + tombol Google OAuth) dengan pola
`@supabase/ssr` untuk Next.js 15, proteksi middleware, helper server, validasi
zod, skema Prisma `User` (UUID ikut auth) + `Generation`, trigger sync
`auth.users → public.User`, dan RLS. E2E backend hijau 100% (register,
trigger, login, proteksi HTTP, RLS). Branch: `feat/phase-2-auth-database`.

## Assessment vs Reality

| Metric     | Predicted (Plan) | Actual                                              |
| ---------- | ---------------- | --------------------------------------------------- |
| Complexity | Large            | Large                                               |
| Confidence | 8/10             | 9/10 (satu bug nyata ditemukan + diperbaiki via E2E) |
| Files      | 13 created, 3 updated | 15 created, 6 updated (+2 migrasi, README, ignore) |

## Tasks Completed

| # | Task | Status | Notes |
| - | ---- | ------ | ----- |
| 0 | Verifikasi kredensial | done | 3 temuan di `.env` user, semua diperbaiki user via panduan |
| 1 | Panduan dashboard | done | Checklist + troubleshooting di README |
| 2 | Install deps | done | `@supabase/ssr` 0.12.6, `supabase-js` 2.116, `zod` 4.5.4 |
| 3 | Klien + middleware + helpers | done | tsc + lint hijau |
| 4 | Skema + migrasi + trigger + RLS | done | 2 migrasi live sukses |
| 5 | Halaman auth + callback + placeholder | done | build 9 route hijau |
| 6 | E2E + RLS + finalisasi | done | 6/8 otomatis hijau; 2 manual browser (lihat bawah) |

## Validation Results

| Level           | Status | Notes                                                  |
| --------------- | ------ | ------------------------------------------------------ |
| Static Analysis | Pass   | `tsc`, `lint` bersih                                   |
| Format          | Pass   | `prettier --check .` bersih                            |
| Build           | Pass   | Lokal + CI hijau                                       |
| E2E API         | Pass   | signup OK, trigger OK, login OK + session, cleanup OK  |
| E2E HTTP        | Pass   | `/login` 200; `/dashboard` anon → 307 → `/login`       |
| RLS             | Pass   | REST anon tanpa token: 200 dengan 0 baris              |
| Manual browser  | Tertunda | Redirect user-login→dashboard, klik Logout, Google OAuth |

## Files Changed

| File                                                   | Action  |
| ------------------------------------------------------ | ------- |
| `src/lib/supabase/{client,server,middleware}.ts`       | CREATED |
| `middleware.ts`                                        | CREATED |
| `src/lib/auth/helpers.ts`, `src/lib/validations/auth.ts` | CREATED |
| `src/app/(auth)/{layout,_components/google-button}`    | CREATED |
| `src/app/(auth)/login/{page,login-form,actions}`       | CREATED |
| `src/app/(auth)/register/{page,register-form,actions}` | CREATED |
| `src/app/auth/callback/route.ts`                       | CREATED |
| `src/app/(dashboard)/dashboard/{page,actions}`         | CREATED (placeholder bertanda Fase 3) |
| `prisma/triggers.sql`                                  | CREATED |
| `prisma/migrations/*/migration.sql` (2x)               | CREATED (live) |
| `package.json`, `prisma/schema.prisma`, `README.md`    | UPDATED |
| `.prettierignore` (`prisma/*.sql`), `.claude/*`        | UPDATED |

## Deviations from Plan

- **Proses**: branch fitur dibuat dari `main` dirty (artefak sesi plan),
  tanpa minta user commit dulu — dinilai aman, tercatat.
- **Fix tak terduga** (di bawah) — satu migrasi tambahan di luar estimasi plan.

## Issues Encountered (bug nyata, sudah fix)

1. **Signup gagal total: `Database error saving new user`.**
   Akar: `User.updatedAt` (`@updatedAt`, NOT NULL, tanpa default DB) —
   trigger mengisi baris via SQL mentah sehingga `updatedAt = NULL` →
   Postgres 23502. Insert Prisma normal tak kena karena Prisma Client
   mengisinya di level aplikasi.
   Fix: `updatedAt DateTime @updatedAt @default(now())` + migrasi
   `phase2_updatedat_default`. Pelajaran untuk Fase 6+: setiap kolom
   `@updatedAt` wajib punya default DB bila ada penulis non-Prisma (trigger).
2. **`.env` user**: ANON kosong, service key berkurung `[]`, host pooler
   diragukan → panduan pengisian lengkap + verifikasi ulang bermasker.
3. **CI**: `prisma generate` butuh `DATABASE_URL` (sudah ada dummy dari Fase 1);
   satu kegagalan hanya format markdown report → fixed.
4. Smoke awal `/dashboard` 500 = gejala env rusak (ANON kosong), bukan bug kode.

## Tests Written

Tidak ada (milik Fase 8). E2E via skrip temporer (dihapus, tidak di-commit):
register → trigger → login → RLS anon → cleanup, semua OK.

## Manual follow-up untuk user (browser, ±5 menit)

- [ ] Buka `/login` setelah login → harusnya ke `/dashboard`
- [ ] Klik Logout di dashboard → kembali `/login`
- [ ] Klik Google (bila sudah setup Cloud Console) → profil + avatar terisi
- [ ] Hapus user test bila ada sisa di Authentication → Users

## Next Steps

- [ ] Merge PR `feat/phase-2-auth-database` → `main`
- [ ] Fase 3 (Core UI) via `/prp-plan`
