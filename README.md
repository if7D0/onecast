# OneCast — AI Content Repurposing Tool

Ubah satu konten menjadi berbagai format siap-post (Twitter/X, LinkedIn,
Instagram, Newsletter) dalam < 5 menit. Gratis, open-source, self-hostable.

> Status: **Fase 1 — Project Setup & Infrastructure** (lihat `onecast.prd.md`).
> Landing page asli, auth, dan AI menyusul di Fase 2–5.

## Tech Stack

| Layer    | Teknologi                          |
| -------- | ---------------------------------- |
| Frontend | Next.js 15 (App Router) + React 19 |
| Styling  | Tailwind CSS v4 + shadcn/ui        |
| Backend  | Next.js API Routes                 |
| Database | Supabase (PostgreSQL) via Prisma 6 |
| Deploy   | Vercel                             |

## Prasyarat

- Node.js ≥ 24 (`node -v`) — test suite (jsdom 30) butuh API Node 22+;
  versi ini juga dipakai CI (lihat `.github/workflows/deploy.yml`)
- npm (bawaan Node)
- Project Supabase gratis ([supabase.com](https://supabase.com)) untuk kredensial DB

## Mulai Cepat

```bash
# 1. Install dependencies (menjalankan `prisma generate` otomatis)
npm install

# 2. Salin env dan isi dari dashboard Supabase
cp .env.example .env

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Environment

| Variabel                        | Sumber                                                               |
| ------------------------------- | -------------------------------------------------------------------- |
| `DATABASE_URL`                  | Supabase → Connect → Transaction Pooler (`6543` + `?pgbouncer=true`) |
| `DIRECT_URL`                    | Supabase → Connect → Session/Direct (`5432`), untuk migrasi          |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API                                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API (server saja, jangan ke client!)   |

Kunci AI (`GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`)
baru dibutuhkan di Fase 4+.

## Skrip

| Perintah                 | Fungsi                 |
| ------------------------ | ---------------------- |
| `npm run dev`            | Dev server (Turbopack) |
| `npm run build`          | Production build       |
| `npm run lint`           | ESLint                 |
| `npx prettier --check .` | Cek format             |
| `npx prisma studio`      | GUI database           |

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import di [vercel.com/new](https://vercel.com/new).
3. Isi environment variables (lihat tabel di atas + `NEXT_PUBLIC_APP_URL`
   = URL produksi, `NEXT_PUBLIC_APP_NAME=OneCast`).
4. Deploy — setiap push ke `main` otomatis redeploy.

> Catatan: Vercel Hobby hanya untuk non-komersial. Untuk komersial,
> migrasi ke Cloudflare Pages (gratis) atau Railway (lihat PRD).

## Struktur Folder

Lihat `.claude/PRPs/prds/onecast.prd.md` → bagian **Folder Structure** (kontrak doc).
Fase 1 baru menyediakan fondasi: `src/app/`, `src/components/ui/`,
`src/lib/db/`, `prisma/`.

## Auth (Fase 2)

Login memakai Supabase Auth: email/password + Google OAuth.

### Checklist dashboard Supabase (satu kali)

1. **Authentication → Providers → Email**: ON.
2. **Authentication → URL Configuration**: Site URL = `http://localhost:3000`
   (produksi: URL Vercel); Redirect URLs tambah
   `http://localhost:3000/auth/callback` (+ versi produksi).
3. **Google**: Google Cloud Console → Credentials → OAuth client ID (Web) →
   Authorized redirect URI = `https://[PROJECT-REF].supabase.co/auth/v1/callback`
   → masukkan Client ID + Secret ke Auth → Providers → Google → ON.
   Bila dilewati, tombol Google menampilkan pesan ramah (tidak crash).
4. **SQL Editor**: jalankan `prisma/triggers.sql` (trigger sync user + RLS),
   lalu query verifikasi di bawah file tersebut.
5. **Database**: migrasi via koneksi DIRECT (bukan pooler):
   `$env:DATABASE_URL = $env:DIRECT_URL; npx prisma migrate dev`

## AI (Fase 4)

Provider primer: Google Gemini Flash (`@google/genai`, model `gemini-3.6-flash`).

1. Buat key gratis di **aistudio.google.com/apikey**.
2. Isi `GOOGLE_AI_API_KEY` di `.env` (server-only, tanpa `NEXT_PUBLIC_`).
3. Uji: `npm test` (test live otomatis jalan bila key ada, skip bila tidak).

Catatan: `gemini-2.5-flash` sudah pensiun untuk user baru (API 404) — jangan dipakai.

## AI Fallback (Fase 7)

Urutan fallback otomatis: **Gemini → Groq → OpenRouter**. Provider yang
key-nya belum diisi di-skip otomatis (cukup isi minimal satu key).

1. Groq: buat key gratis di **console.groq.com/keys** → isi `GROQ_API_KEY`.
2. OpenRouter: buat key gratis di **openrouter.ai/keys** → isi `OPENROUTER_API_KEY`.
3. `metadata.provider` di respons `/api/generate` = provider aktual yang
   dipakai (mis. `groq-gpt-oss-120b`, atau gabungan `a+b` bila campuran).
4. Cek konfigurasi: `GET /api/health` → `{success, providers:
[{name, configured}]}` (tanpa secret).
5. Uji hemat kuota (±3 calls total): `npm test` (live test per provider
   otomatis skip bila key-nya tidak ada).

Catatan: model OpenRouter `openrouter/free` non-deterministik (dipilih acak
dari model gratis) — disengaja untuk ketersediaan. Untuk determinisme, ganti
1 baris `OPENROUTER_MODEL` ke slug `:free` spesifik.

## Testing & Optimasi (Fase 8)

```bash
npm test                  # full suite (live AI test skip otomatis tanpa key)
npx vitest run <file>     # satu file test
node scripts/load-test.mjs http://localhost:3100 20 50
```

- **Load test**: hanya ke `/` dan `/api/health` (20 konkuren × 50 req).
  JANGAN ke `/api/generate` (rate limit 5/jam + boros kuota AI).
- **Lighthouse** (manual, Chrome DevTools → tab Lighthouse, mode Navigation,
  Desktop + Mobile, target >90): `npm run build && npm run start`,
  buka `http://localhost:3000`, jalankan audit untuk `/`. Catat skor di
  report Fase 8 bila di bawah target sebelum merge.
- **Checklist browser/mobile manual**: Chrome + Firefox (+ Safari bila ada),
  viewport 360px: landing → register → login → generate → history → hapus.
  Pastikan tanpa error console dan layout tak rusak.
- **Security headers** global: nosniff, DENY frame, referrer ketat, tanpa
  kamera/mikrofon/lokasi (lihat `next.config.ts`). Tanpa CSP — keputusan
  sadar (rapuh untuk inline style Tailwind + ThemeProvider).

## API Generate (Fase 5)

`POST /api/generate` (login wajib) — body: `{content, platforms[], tone}`.
Respons sukses: `{success, data: {[platform]: {variations: [{text, characterCount}]}},
metadata: {provider, tokensUsed, generationTime}}`.

- **Rate limit**: 5x/jam per user (dihitung dari DB). Habis → `429` +
  `retryAfterSec`. Setiap generate tersimpan (1 baris/platform) untuk histori Fase 6.
- **Error**: 400 validasi, 401 anon, 502 AI gangguan, 500 tak dikenal.

## API History (Fase 6)

- `GET /api/history?page=1&limit=10&platform=twitter` (login wajib) →
  `{success, data: [{id, input(100 char), platform, tone, outputs, createdAt}],
pagination: {page, limit, total, hasMore}}`. Query salah → 400.
- `DELETE /api/history/[id]` → `{success:true}`; tak ada/bukan milik → 404 seragam.

### Troubleshooting

| Gejala                                  | Penyebab & solusi                                         |
| --------------------------------------- | --------------------------------------------------------- |
| `redirect_uri_mismatch` saat Google     | Redirect URI di Google Console salah; samakan persis      |
| Login "gagal" setelah register          | Konfirmasi email ON — cek inbox / matikan untuk dev lokal |
| Signup error "Database error"           | Trigger gagal — cek Postgres Logs di dashboard            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` kosong  | Ambil ulang di Settings → API (publishable/anon key)      |
| Jangan bungkus nilai `.env` dengan `[]` | Tempel mentah tanpa kurung siku/spasi                     |
| AI "Model tidak tersedia" (404)         | Model pensiun — ganti konstanta `GEMINI_MODEL`            |
| AI timeout berulang                     | Model thinking lambat; timeout 60 dtk, coba lagi          |

### Batas yang diketahui (tracking)

- **Rate limit in-memory** (`src/lib/rate-limit.ts`): berlaku per instance
  saja — di serverless multi-instance, batas longgar. Ganti Upstash Redis
  saat butuh limit terdistribusi. Throttling bawaan Supabase Auth tetap jalan.
- **Security headers/CSP**: belum ada — masuk Fase 3 (`next.config.ts`).
- **Dependensi**: `npm audit` melaporkan HIGH transitif (postcss via Next 15,
  deepmerge-ts via Prisma). Jangan `audit fix --force` (menarik breaking
  Next 16/Prisma 8); bump terjadwal saat versi stabil + Dependabot.

## Lisensi

MIT (ditambahkan di Fase 9).
