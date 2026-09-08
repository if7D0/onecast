# Plan: Fase 2 — Authentication & Database (OneCast)

## Summary

Implementasi auth penuh memakai Supabase Auth (email/password + Google OAuth)
dengan pola `@supabase/ssr` untuk Next.js 15 App Router, proteksi route via
`middleware.ts`, sinkronisasi `auth.users → public.User` lewat trigger SQL,
skema Prisma lengkap (`User` + `Generation`), dan RLS. Termasuk Task 0
verifikasi kredensial Supabase milik user + panduan perbaikan.

## User Story

As a **content creator yang baru mendaftar**,
I want **register/login (email atau Google) dan tetap login di semua halaman**,
So that **hasil generate saya tersimpan aman dan hanya saya yang bisa akses**.

## Problem → Solution

Skeleton tanpa identitas user (siapa pun membuka `/` yang sama, tidak ada
session, tidak ada tabel app) → user bisa register/login/logout, route
terproteksi redirect ke `/login`, setiap signup otomatis punya baris `User`,
fondasi siap untuk Fase 4–6 (generate + history per-user).

## Metadata

- **Complexity**: Large
- **Source PRD**: `.claude/PRPs/prds/onecast.prd.md`
- **PRD Phase**: Phase 2 — Authentication & Database (dependensi Fase 1 `complete` terpenuhi)
- **Estimated Files**: 13 created, 3 updated
- **Keputusan user sesi ini**: kredensial Supabase "sudah dibuat tapi ragu" → Task 0 verifikasi;
  Google OAuth tetap di Fase 2 (butuh aksi manual user di Google Cloud Console).

---

## UX Design

### Before

```
┌─────────────────────────────┐
│ / (welcome Next.js)         │
│ Tidak ada login/register    │
│ Tidak ada halaman terproteksi│
└─────────────────────────────┘
```

### After

```
┌─────────────────────────────┐
│ / (tetap, belum diubah)     │
│ /login    → form + Google   │
│ /register → form + Google   │
│ /dashboard (placeholder)    │
│   → email user + Logout     │
│ Akses /dashboard tanpa login│
│   → redirect /login         │
└─────────────────────────────┘
```

### Interaction Changes

| Touchpoint          | Before | After                                                           | Notes                            |
| ------------------- | ------ | --------------------------------------------------------------- | -------------------------------- |
| `/login`            | 404    | Form email/password + tombol Google; error tampil inline        | Client Component + Server Action |
| `/register`         | 404    | Form + info "cek email konfirmasi" bila konfirmasi ON           | Teks dinamis dari hasil `signUp` |
| `/dashboard`        | 404    | Placeholder: sapaan + tombol Logout (sementara, diganti Fase 3) | Server Component, bukti proteksi |
| `/dashboard` (anon) | 404    | Redirect `/login`                                               | Via middleware                   |
| OAuth Google        | —      | Klik → Google → callback → `/dashboard`                         | Butuh setup manual (Task 1)      |
| Logout              | —      | Klik → sesi hilang → `/login`                                   | Server Action `signOut`          |

---

## Mandatory Reading

| Priority | File                               | Lines   | Why                                                                                |
| -------- | ---------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| P0       | `.claude/PRPs/prds/onecast.prd.md` | 373–391 | Goal, tasks, success signal, deliverables Fase 2                                   |
| P0       | `.claude/PRPs/prds/onecast.prd.md` | 293–325 | Skema Prisma target (`User`, `Generation`, index)                                  |
| P0       | `prisma/schema.prisma`             | 1–23    | Skema stub Fase 1 yang akan diubah (User cuid → UUID)                              |
| P0       | `src/lib/db/client.ts`             | 1–7     | Singleton Prisma — dipakai helpers auth bila perlu query                           |
| P0       | `src/app/layout.tsx`               | 1–27    | Root layout; TIDAK diubah (tidak ada Auth Provider — lihat keputusan A)            |
| P1       | `.env.example`                     | 1–23    | Kontrak env; kredensial live diverifikasi di Task 0                                |
| P1       | `prisma.config.ts`                 | 1–16    | Datasource dari `env("DATABASE_URL")` — kunci GOTCHA migrasi                       |
| P1       | `src/components/ui/*.tsx`          | —       | Komponen siap pakai: button, card, input (+label dari `@base-ui/react` bila perlu) |
| P2       | `package.json`                     | 1–40    | Dep saat ini; akan tambah 3 paket (Task 2)                                         |

## External Documentation

| Topic                                 | Source                                                      | Key Takeaway                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Klien SSR (browser/server/middleware) | supabase.com/docs/guides/auth/server-side/creating-a-client | 3 klien: `createBrowserClient`, `createServerClient` + adapter `getAll/setAll`                                                                |
| Auth + Next.js App Router             | supabase.com/docs/guides/auth/quickstarts/nextjs            | Alur PKCE + route `/auth/callback` + `exchangeCodeForSession`                                                                                 |
| Pola middleware + `getUser()`         | designrevision.com/blog/supabase-auth-nextjs (2026)         | Middleware refresh tiap request; di server SELALU `getUser()`, jangan `getSession()`; `await cookies()` wajib di Next 15                      |
| Gotcha umum                           | rapidevelopers.com (Mar 2026), iloveblogs.blog (2026)       | Tanpa middleware sesi hilang saat JWT expired; callback URL wajib masuk allowlist Redirect URLs; jangan pakai `auth-helpers-nextjs` (legacy)  |
| Trigger sync `auth.users → public`    | Supabase discussion #306 (kiwicopple), sunapi386 blog       | Fungsi `SECURITY DEFINER` + trigger `AFTER INSERT ON auth.users` + `ON CONFLICT (id) DO NOTHING`; id profil = id auth (jangan generate acak!) |
| RLS + Prisma                          | mihaiandrei97/next13-prisma-supabase-auth                   | Prisma (service_role/pooler) bypass RLS — RLS melindungi akses via anon key; enable RLS per tabel + policy `auth.uid() = id`                  |
| Prisma + Supabase pooling             | supabase.com/docs/guides/database/prisma                    | Migrasi WAJIB koneksi direct (5432), bukan pooler (6543)                                                                                      |

---

## Patterns to Mirror

### NAMING_CONVENTION

// SOURCE: Fase 1 — `src/lib/db/client.ts:1-7`, `src/lib/utils.ts`, `src/components/ui/*`

- Helper/modul: camelCase (`src/lib/supabase/client.ts`, `src/lib/auth/helpers.ts`)
- Komponen: PascalCase (`LoginForm.tsx` bila diekstrak; boleh inline di `page.tsx` untuk Fase 2)
- Alias impor: `@/...` (contoh: `@/lib/supabase/client`)
- Server Action: fungsi `async` dengan `"use server"` di file `actions.ts` per route group

### PRISMA_SINGLETON

// SOURCE: `src/lib/db/client.ts:1-7`

```ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Dipakai ulang tanpa perubahan. Query Prisma HANYA di server (Server Component/Action/Route Handler).

### SUPABASE_CLIENT_TRIO (pola baru dari riset — ikuti persis)

```ts
// src/lib/supabase/client.ts (browser, Client Component)
import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```ts
// src/lib/supabase/server.ts (server ONLY — jangan diimpor Client Component)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export async function createClient() {
  const cookieStore = await cookies(); // Next 15: WAJIB await
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Dipanggil dari Server Component — abaikan, middleware yang refresh.
          }
        },
      },
    }
  );
}
```

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  // WAJIB getUser() (validasi ke server), JANGAN getSession() (bisa dipalsukan).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const protected_ = ["/dashboard", "/history"];
  const isProtected = protected_.some((p) => request.nextUrl.pathname.startsWith(p));
  const isAuthPage = ["/login", "/register"].includes(request.nextUrl.pathname);
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
  return supabaseResponse; // WAJIB kembalikan objek ini (bawa cookie refresh)
}
```

### SERVER_ACTION_FORM (tanpa React Hook Form di Fase 2)

```tsx
// src/app/(auth)/login/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Email atau password tidak valid." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Email atau password salah." }; // pesan generik (anti user-enumeration)
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
```

### TRIGGER_SYNC (SQL idempotent — dijalankan di SQL Editor Supabase)

```sql
-- prisma/triggers.sql — sinkronisasi auth.users -> public."User"
create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public."User" (id, email, name, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing; -- pemicu gagal = signup gagal; baris ini pencegahnya
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- RLS: kunci semua akses anon; app lewat Prisma (service_role) tetap bisa.
alter table public."User" enable row level security;
alter table public."Generation" enable row level security;
drop policy if exists "user_select_own" on public."User";
create policy "user_select_own" on public."User"
  for select using (auth.uid() = id);
drop policy if exists "generation_owner_all" on public."Generation";
create policy "generation_owner_all" on public."Generation"
  for all using (
    exists (select 1 from public."User" u where u.id = "Generation"."userId" and u.id = auth.uid())
  );
```

---

## Files to Change

| File                                              | Action           | Justification                                                                                |
| ------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `package.json`                                    | UPDATE           | Tambah `@supabase/ssr`, `@supabase/supabase-js`, `zod`                                       |
| `prisma/schema.prisma`                            | UPDATE           | `User.id` → UUID (ikut auth), + `updatedAt`/`avatar`; tambah `Generation` + index (dari PRD) |
| `prisma/triggers.sql`                             | CREATE           | Trigger sync + RLS (ter-version, dijalankan manual di SQL Editor)                            |
| `prisma/migrations/*`                             | CREATE (via CLI) | Migrasi `phase2_auth_tables`                                                                 |
| `src/lib/supabase/client.ts`                      | CREATE           | Browser client                                                                               |
| `src/lib/supabase/server.ts`                      | CREATE           | Server client (`await cookies()`)                                                            |
| `src/lib/supabase/middleware.ts`                  | CREATE           | `updateSession` + aturan redirect                                                            |
| `middleware.ts` (root)                            | CREATE           | Panggil `updateSession`; matcher kecuali file statis                                         |
| `src/lib/auth/helpers.ts`                         | CREATE           | `getCurrentUser()`, `requireUser()` (redirect bila anon)                                     |
| `src/lib/validations/auth.ts`                     | CREATE           | Skema zod login/register                                                                     |
| `src/app/(auth)/layout.tsx`                       | CREATE           | Layout kartu tengah (Card shadcn) untuk login/register                                       |
| `src/app/(auth)/login/page.tsx` + `actions.ts`    | CREATE           | Form + Server Action + tombol Google                                                         |
| `src/app/(auth)/register/page.tsx` + `actions.ts` | CREATE           | Form + Server Action + tombol Google                                                         |
| `src/app/auth/callback/route.ts`                  | CREATE           | `exchangeCodeForSession` (email-confirm + OAuth)                                             |
| `src/app/(dashboard)/dashboard/page.tsx`          | CREATE           | PLACEHOLDER sementara (sapaan + Logout; diganti Fase 3)                                      |
| `.env.example`                                    | UPDATE           | Tambah catatan Redirect URL + Google Client ID (opsional, info saja)                         |
| `src/app/layout.tsx`, `src/app/page.tsx`          | TIDAK DIUBAH     | Landing asli = Fase 3                                                                        |

## NOT Building

- Dashboard/landing asli (Fase 3) — placeholder dashboard hanya alat validasi
- Fitur generate/AI/history (Fase 4–6)
- Magic link, reset password, update email (bisa Fase 8+)
- React Hook Form (Fase 5) — Fase 2 cukup Server Actions + zod
- React Context Auth Provider — TIDAK ADA (keputusan A di bawah); session dibaca per-request via helper
- Multi-schema Prisma atas `auth.*` — trigger SQL saja (alasan: hindari pull puluhan tabel auth)
- Test otomatis (Fase 8) — validasi manual E2E per checklist

---

## Keputusan Arsitektur

- **Pendekatan**: Supabase Auth penuh (sumber kebenaran `auth.users`);
  Prisma kelola tabel app di schema `public`; trigger satukan keduanya.
- **A (tanpa Auth Provider)**: `@supabase/ssr` tidak butuh React Context —
  server baca session per-request (`getUser()`), client per-komponen
  (`createBrowserClient`). "Auth context/provider" di PRD dipenuhi oleh
  `src/lib/auth/helpers.ts` + pola SSR, bukan Context.
- **B (Server Actions, bukan API route)**: login/register/logout/callback
  mengikuti quickstart resmi Supabase; API route auth ala NextAuth DITOLAK
  (duplikasi session handling).
- **C (trigger via SQL Editor, bukan otomatis)**: satu kali, terlihat di
  dashboard, file SQL ter-version di repo. Otomatisasi via script `postgres`
  DITOLAK untuk Fase 2 (dependensi + kompleksitas ekstra).
- **Scope**: 6 task di bawah. **Bukan scope**: daftar NOT Building di atas.

---

## Step-by-Step Tasks

### Task 0: Verifikasi kredensial Supabase user + perbaiki bila salah

- **ACTION**: Periksa `.env` (JANGAN tampilkan isi secret ke chat/logs).
  Cek 5 var + formatnya, lalu uji tanpa koneksi lalu dengan koneksi.
- **IMPLEMENT**:
  1. Format benar: `DATABASE_URL` = `...pooler.supabase.com:6543/...?pgbouncer=true`;
     `DIRECT_URL` = port `5432` (pooler session ATAU `db.[REF].supabase.co:5432`);
     `NEXT_PUBLIC_SUPABASE_URL` = `https://[REF].supabase.co`;
     dua key diawali `eyJ` (jangan tertukar anon ↔ service_role).
  2. `npx prisma validate` → skema valid (tanpa koneksi).
  3. Uji koneksi read-only: buat project via dashboard → Database → Connect;
     bandingkan REF di URL vs dashboard. Jika salah: ambil ulang dari
     dashboard (Settings → Database untuk URL, Settings → API untuk keys),
     tulis ke `.env`, JANGAN commit.
  4. Checklist dashboard: Authentication → Providers → Email ON;
     Authentication → URL Configuration → Site URL `http://localhost:3000`
     - Redirect `http://localhost:3000/auth/callback` terdaftar;
       hapus centang "Confirm email" HANYA untuk dev bila ingin skip konfirmasi
       (produksi tetap ON).
- **MIRROR**: ENV_CONTRACT (`.env.example:1-23`)
- **IMPORTS**: tidak ada
- **GOTCHA**: Service-role key masuk ke client bundle = bypass total RLS.
  `grep -r SUPABASE_SERVICE_ROLE_KEY src/` harus kosong.
  Pooler (6543) untuk migrasi = error transaksi PgBouncer.
- **VALIDATE**: `npx prisma validate` hijau + REF konsisten di 4 tempat
  (URL pooler, URL direct, Site URL, API). Lanjut hanya jika ini hijau.

### Task 1: Setup manual di dashboard (Email + Google OAuth)

- **ACTION**: (User, dipandu) aktifkan provider; developer catat hasilnya.
- **IMPLEMENT**:
  1. Email: ON (sudah Task 0).
  2. Google: Google Cloud Console → Credentials → OAuth client (Web) →
     Authorized redirect URI = `https://[REF].supabase.co/auth/v1/callback` →
     masukkan Client ID + Secret ke Supabase (Auth → Providers → Google → ON).
     Tambah `http://localhost:3000/auth/callback` ke Redirect URLs Supabase.
  3. Jika user belum sempat: TULIS panduan di `README.md` (bagian Auth) dan
     lanjutkan Task 2–6 dengan email/password; tombol Google tetap dirender
     tapi menampilkan pesan "Google login belum dikonfigurasi" bila provider OFF.
- **MIRROR**: —
- **IMPORTS**: tidak ada
- **GOTCHA**: Lupa redirect URI di Google Console = `redirect_uri_mismatch`;
  lupa allowlist di Supabase = kode OAuth tidak bisa ditukar sesi.
- **VALIDATE**: Daftar checklist dashboard tercentang; bukti final = login
  Google sungguhan di Task 6.

### Task 2: Install dependensi

- **ACTION**: `npm install @supabase/ssr @supabase/supabase-js zod`
- **IMPLEMENT**: Satu perintah; `package-lock.json` berubah (commit ikut).
  JANGAN install `@supabase/auth-helpers-nextjs` (legacy, tidak dipelihara).
- **MIRROR**: NAMING_CONVENTION (alias `@/`)
- **IMPORTS**: —
- **GOTCHA**: Versi `@supabase/ssr` < 0.3 memakai adapter cookie lama
  (`get/set/remove`) — pastikan ≥ 0.5 (`npm ls @supabase/ssr`).
- **VALIDATE**: `npm ls @supabase/ssr @supabase/supabase-js zod` tanpa error.

### Task 3: Tiga klien Supabase + middleware + helpers + validasi

- **ACTION**: Buat `src/lib/supabase/{client,server,middleware}.ts`,
  `middleware.ts` root, `src/lib/auth/helpers.ts`, `src/lib/validations/auth.ts`.
- **IMPLEMENT**: Salin pola SUPABASE_CLIENT_TRIO persis.
  `middleware.ts` root:
  ```ts
  import { type NextRequest } from "next/server";
  import { updateSession } from "@/lib/supabase/middleware";
  export async function middleware(request: NextRequest) {
    return await updateSession(request);
  }
  export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
  };
  ```
  `helpers.ts`: `getCurrentUser()` → `{ supabase, user }`;
  `requireUser()` → `redirect("/login")` bila anon (pakai di dashboard).
  `validations/auth.ts`: zod — email valid, password min 8 (register) + konfirmasi sama.
- **MIRROR**: SUPABASE_CLIENT_TRIO; PRISMA_SINGLETON bila helper query DB
- **IMPORTS**: `@supabase/ssr`, `next/headers`, `next/server`, `next/navigation`, `zod`
- **GOTCHA**: `cookies()` tanpa `await` = error Next 15. `getSession()` di
  server = JANGAN (pakai `getUser()`). File `server.ts` tidak boleh diimpor
  dari Client Component (nama file + komentar guard).
  Matcher terlalu sempit = sesi kedaluwarsa diam-diam.
- **VALIDATE**: `npx tsc --noEmit` + `npm run lint` hijau.

### Task 4: Skema Prisma + migrasi + trigger + RLS

- **ACTION**: Ubah `User`, tambah `Generation`, migrate via DIRECT, jalankan trigger SQL.
- **IMPLEMENT**:
  1. `schema.prisma`:
     ```prisma
     model User {
       id        String       @id @db.Uuid   // TANPA default — diisi trigger dari auth.users.id
       email     String       @unique
       name      String?
       avatar    String?
       createdAt DateTime     @default(now())
       updatedAt DateTime     @updatedAt
       generations Generation[]
       @@map("User")
     }
     model Generation {
       id         String   @id @default(cuid())
       userId     String   @db.Uuid
       user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
       input      String
       platform   String
       tone       String
       outputs    Json
       provider   String
       tokensUsed Int
       createdAt  DateTime @default(now())
       @@index([userId, createdAt])
       @@map("Generation")
     }
     ```
     (Setara PRD lines 301–325 + `updatedAt`/`avatar` dari metadata OAuth.)
  2. Migrasi via koneksi DIRECT (PowerShell):
     `$env:DATABASE_URL = $env:DIRECT_URL; npx prisma migrate dev --name phase2_auth_tables`
     lalu kembalikan `.env` (jangan simpan override!).
  3. Tulis `prisma/triggers.sql` dari pola TRIGGER_SYNC; jalankan di
     Supabase SQL Editor; verifikasi: `select * from public."User"` kosong,
     RLS enabled (`pg_tables`/`policies`).
- **MIRROR**: TRIGGER_SYNC; skema PRD
- **IMPORTS**: —
- **GOTCHA**: `migrate dev` dengan URL pooler = error PgBouncer (_peak sebab
  gagal #1 di proyek Supabase+Prisma). `cuid()` untuk `User.id` = FK trigger
  gagal (id HARUS UUID auth). Nama tabel `"User"` case-sensitive di SQL —
  pakai tanda kutip ganda persis.
- **VALIDATE**: `npx prisma migrate status` up-to-date; trigger ada
  (`select * from pg_trigger`); `npx prisma generate` + `tsc` hijau.

### Task 5: Halaman auth + callback + dashboard placeholder

- **ACTION**: Buat route group `(auth)` + callback + dashboard placeholder.
- **IMPLEMENT**:
  - `(auth)/layout.tsx`: wrapper tengah + `Card` shadcn + logo/nama OneCast.
  - `login/page.tsx` (Client Component): form email/password → `login` action
    (pola SERVER_ACTION_FORM, `useActionState` untuk error); tombol
    "Login dengan Google" → `supabase.auth.signInWithOAuth({ provider: "google",
options: { redirectTo: "<origin>/auth/callback" } })` via browser client.
  - `register/page.tsx`: sama + field nama + konfirmasi password; sukses →
    jika `identities` kosong tampilkan "cek email"; jika auto-login redirect.
  - `actions.ts` per halaman (login/logout/register) + `logout` action
    (`supabase.auth.signOut()` → redirect `/login`).
  - `auth/callback/route.ts`: tukar `code` → sesi (`exchangeCodeForSession`),
    redirect `/dashboard`; tanpa `code` → `/login?error=...`.
  - `(dashboard)/dashboard/page.tsx` (Server Component): `requireUser()`,
    tampil email + tombol Logout (form action). Tandai file
    `// PLACEHOLDER Fase 2 — diganti dashboard asli di Fase 3`.
- **MIRROR**: SERVER_ACTION_FORM; komponen shadcn (button/card/input);
  Prettier (jalan otomatis, cek via `--check`)
- **IMPORTS**: `@/lib/supabase/{client,server}`, `@/lib/validations/auth`, `zod`, `react` (`useActionState`)
- **GOTCHA**: Lupa `redirectTo` absolut di OAuth = callback salah domain.
  Pesan error auth generik (jangan bocorkan "email tidak terdaftar").
  `revalidatePath("/", "layout")` sebelum redirect agar Server Component baca sesi baru.
- **VALIDATE**: `tsc` + `lint` + `prettier --check .` + `npm run build` hijau.

### Task 6: Uji E2E manual + RLS + finalisasi

- **ACTION**: Jalankan checklist di bawah satu per satu; catat hasil di laporan.
- **IMPLEMENT**:
  1. Register email baru → baris `auth.users` + `public."User"` muncul (bukti trigger).
  2. Login → `/dashboard` tampil email; refresh → tetap login (bukti middleware).
  3. Buka `/dashboard` di incognito → redirect `/login`.
  4. Login sebagai user → buka `/login` → redirect `/dashboard`.
  5. Logout → sesi hilang → `/login`.
  6. Google OAuth (bila Task 1 selesai) → user + avatar terisi.
  7. RLS: query REST dengan anon key tanpa sesi ke `"User"` → 0 baris/ditolak.
  8. `npm run build` + push → CI hijau.
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: Email konfirmasi ON + mailbox tak dibuka = "login gagal" palsu
  (cek Authentication → Users dulu). Trigger error = signup gagal total —
  lihat Postgres Logs di dashboard.
- **VALIDATE**: Semua 8 cek hijau; bukti screenshot/log di laporan implementasi.

---

## Testing Strategy

Tanpa framework test (milik Fase 8). Validasi = statis + manual E2E:

| Test                   | Input                      | Expected Output                                 | Edge? |
| ---------------------- | -------------------------- | ----------------------------------------------- | ----- |
| Register valid         | email+password baru        | User di auth + public, redirect/suruh cek email | —     |
| Register duplikat      | email terdaftar            | Pesan generik, tidak bocorkan                   | Ya    |
| Login salah            | password keliru            | "Email atau password salah."                    | Ya    |
| Email belum konfirmasi | login sebelum klik link    | Pesan Supabase diteruskan ramah                 | Ya    |
| Password lemah         | < 8 char                   | Ditolak zod client+server                       | Ya    |
| OAuth batal            | user cancel di Google      | Kembali `/login?error=`                         | Ya    |
| Sesi kedaluwarsa       | tunggu/hapus access cookie | Middleware refresh diam-diam                    | Ya    |
| Anon buka proteksi     | GET /dashboard incognito   | 302 → /login                                    | Ya    |
| RLS anon               | REST anon tanpa token      | Ditolak/kosong                                  | Ya    |

### Edge Cases Checklist

- [ ] Konfirmasi email ON vs OFF (perilaku register berbeda)
- [ ] Google provider OFF (pesan konfigurasi, bukan crash)
- [ ] `User.id` UUID vs cuid lama (tidak ada data lama — aman)
- [ ] Cookies third-party diblokir browser (catat keterbatasan)
- [ ] Rate limit signup Supabase free tier (catat, bukan diuji beban)

---

## Validation Commands

### Static Analysis

```bash
npx tsc --noEmit
npm run lint
npx prettier --check .
```

EXPECT: Ketiganya bersih.

### Database Validation

```bash
npx prisma validate
npx prisma migrate status
npx prisma generate
```

EXPECT: Skema valid, migrasi up-to-date, client tergenerate.

### Build + CI

```bash
npm run build
git push origin main   # CI: npm ci → tsc → lint → prettier → build
```

EXPECT: Build lokal hijau, workflow CI hijau.

### Browser Validation

```bash
npm run dev   # http://localhost:3000
```

EXPECT: Checklist 8 langkah Task 6 lolos manual.

### Manual Validation

- [ ] `.env` tidak ter-commit (`git status` bersih dari secret)
- [ ] `grep SUPABASE_SERVICE_ROLE_KEY src/` kosong
- [ ] Redirect URLs + Site URL benar di dashboard
- [ ] Trigger + RLS terverifikasi via SQL Editor

---

## Acceptance Criteria

- [ ] Register, login, logout email/password berfungsi E2E
- [ ] Login Google berfungsi (atau terdokumentasi tertunda + pesan ramah)
- [ ] `/dashboard` + `/history` (nanti) terproteksi middleware
- [ ] Setiap signup punya baris `public."User"` (trigger)
- [ ] RLS enabled + policy teruji
- [ ] Semua validation command hijau + CI hijau
- [ ] `.env` aman, tidak ada service key di client

## Completion Checklist

- [ ] Pola SUPABASE_CLIENT_TRIO diikuti persis (getAll/setAll, getUser, await cookies)
- [ ] Tidak ada impor `server.ts` dari Client Component
- [ ] Migrasi memakai DIRECT_URL, app memakai pooler
- [ ] Tidak ada hardcoded secret/URL
- [ ] Placeholder dashboard ditandai jelas untuk Fase 3
- [ ] README bagian Auth diperbarui (setup Google + troubleshooting)
- [ ] Self-contained — implementasi tanpa riset tambahan

## Risks

| Risk                                     | Likelihood       | Impact                | Mitigation                                                   |
| ---------------------------------------- | ---------------- | --------------------- | ------------------------------------------------------------ |
| Kredensial Supabase user salah format    | High (user ragu) | High (blokir migrasi) | Task 0 verifikasi + panduan; migrasi adalah bukti akhir      |
| Google Cloud setup tertunda              | Med              | Med                   | Tombol tetap ada + pesan ramah; email/password jalan dulu    |
| Trigger error → signup gagal total       | Med              | High                  | `ON CONFLICT DO NOTHING`, uji di Task 6.1, cek Postgres Logs |
| `User.id` cuid lama vs UUID              | Low              | Med                   | Belum ada data produksi; skema ditulis ulang bersih          |
| Email konfirmasi membingungkan saat demo | Med              | Low                   | Opsi matikan untuk dev lokal, dokumentasikan                 |
| Cookie diblokir (Safari strict)          | Low              | Med                   | Catat keterbatasan; pola cookie adalah standar resmi         |

## Notes

- PRD menyebut NextAuth sebagai alternatif yang DITOLAK — Supabase Auth
  terintegrasi DB (keputusan PRD 736–748, tetap berlaku).
- `middleware.ts` di root project (bukan `src/`) mengikuti quickstart resmi;
  struktur PRD (`src/middleware.ts`) disesuaikan — keduanya didukung Next 15,
  root dipilih agar cocok dokumentasi.
- Relokasi PRD ke `.claude/PRPs/prds/` ditemukan saat DETECT (user pindahkan
  di luar sesi); rencana ini memakai path baru sebagai kanonis.
- Estimasi: 3 hari solo part-time sesuai PRD; hambatan utama = aksi manual
  user (Google Console, SQL Editor, isi `.env`).
