# Plan: Fase 9 — Deploy & Documentation (OneCast)

## Summary

Finalisasi repo untuk publik: LICENSE MIT + CONTRIBUTING.md + README final (hapus penanda fase basi), lalu verifikasi deployment produksi Vercel (`https://onecast-brown.vercel.app`) via curl: homepage, `/api/health`, `/sitemap.xml`, `/robots.txt`, OG image, security headers. Custom domain, video demo, submit direktori, dan pengumuman sosmed murni manual user (agen tanpa akun/browser).

## User Story

As a **pengunjung GitHub / calon user**,
I want **repo berlinsensi jelas, docs akurat, dan URL produksi yang hidup**,
So that **saya berani memakai, berkontribusi, dan membagikan tool ini**.

## Problem → Solution

Repo publik tanpa LICENSE (GitHub `license: null`), tanpa CONTRIBUTING, README basi (banner "Fase 1", klaim headers "belum ada"), status produksi belum diverifikasi → dokumen lengkap + verifikasi live + serah-terima checklist manual.

## Metadata

- **Complexity**: Small
- **Source PRD**: `.claude/PRPs/prds/onecast.prd.md`
- **PRD Phase**: Phase 9 — Deploy & Documentation, eligible (dependensi Fase 8 `complete`)
- **Estimated Files**: 2 created, 2 updated (+ verifikasi live)

---

## UX Design

N/A — internal + docs. Satu-satunya yang user-facing: README akurat dan situs produksi terverifikasi.

### Interaction Changes

| Touchpoint  | Before                                  | After                       | Notes |
| ----------- | --------------------------------------- | --------------------------- | ----- |
| GitHub repo | Tanpa lisensi, tanpa panduan kontribusi | MIT + CONTRIBUTING          | —     |
| README      | Banner Fase 1, info basi                | Status produksi + link live | —     |
| Produksi    | Belum diverifikasi                      | Terverifikasi via curl      | —     |

---

## Mandatory Reading

| Priority       | File                               | Lines   | Why                                                                                                             |
| -------------- | ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------- |
| P0 (critical)  | `.claude/PRPs/prds/onecast.prd.md` | 558-579 | Goal, tasks, success signal, deliverables Fase 9                                                                |
| P0 (critical)  | `README.md`                        | 1-190   | Titik basi: banner Fase 1 (6-7), struktur (75-78), headers "belum ada" (182-183), lisensi placeholder (188-190) |
| P1 (important) | `package.json`                     | all     | Cek field `license` (tambah `"MIT"` bila absen) + scripts untuk validasi                                        |
| P1 (important) | `.github/workflows/deploy.yml`     | all     | Bukti CI hijau + auto-deploy Vercel (konteks klaim produksi)                                                    |
| P2 (reference) | `.env.example`                     | all     | Sumber tabel env yang dirujuk README/deploy                                                                     |

## External Documentation

Tidak ada riset eksternal — teks MIT standar, konvensi CONTRIBUTING umum, verifikasi via curl. (Docs Next.js sudah diriset di Fase 8.)

---

## Patterns to Mirror

### DOC_STYLE_ID

// SOURCE: `README.md:81-98` (bagian Auth Fase 2)

```md
## Auth (Fase 2)

Login memakai Supabase Auth: email/password + Google OAuth.

### Checklist dashboard Supabase (satu kali)

1. **Authentication → Providers → Email**: ON.
   ...
```

// Aturan: Bahasa Indonesia, heading `##`, langkah bernomor bold-untuk-nama-setting, catatan `>` untuk peringatan, tabel untuk env/gejala. CONTRIBUTING meniru gaya ini.

### ENV_TABLE

// SOURCE: `README.md:41-52`

```md
| Variabel                                                             | Sumber |
| -------------------------------------------------------------------- | ------ |
| ...                                                                  |
| Kunci AI (`GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`) |
| baru dibutuhkan di Fase 4+.                                          |
```

// Aturan: README final pertahankan tabel ini; tambah baris produksi (`NEXT_PUBLIC_APP_URL` = URL Vercel) bila belum ada.

### TROUBLESHOOTING_TABLE

// SOURCE: `README.md:166-176`

```md
| Gejala | Penyebab & solusi |
...
```

// Aturan: tambah baris produksi (lihat Task 3) dengan format sama.

---

## Files to Change

| File              | Action | Justification                                                                                  |
| ----------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `LICENSE`         | CREATE | MIT — GitHub `license: null` saat ini; PRD deliverable                                         |
| `CONTRIBUTING.md` | CREATE | Panduan kontribusi — PRD deliverable                                                           |
| `README.md`       | UPDATE | Finalisasi: banner status, struktur, headers, lisensi, link produksi, troubleshooting produksi |
| `package.json`    | UPDATE | Field `"license": "MIT"` bila absen (sinkron dengan LICENSE)                                   |

## NOT Building

- Custom domain (butuh beli + DNS + akun — manual user)
- GitHub Pages untuk docs (repo ini Next.js app, bukan situs statis; docs = README. Keputusan sadar)
- Demo video 2-3 menit (butuh rekam layar + narasi — manual user)
- Submit Product Hunt / HN / Reddit + pengumuman sosmed (butuh akun — manual user)
- Perubahan kode app (fase docs; bila verifikasi menemukan bug → catat, JANGAN fix di branch ini)
- Dependensi baru

---

## Step-by-Step Tasks

### Task 1: LICENSE MIT

- **ACTION**: Buat `LICENSE` teks MIT standar, Copyright (c) 2026 if7D0.
- **IMPLEMENT**: Teks MIT penuh (permission notice standar). Satu baris pemegang hak: `if7D0`.
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: Tahun = 2026 (tahun berjalan). Nama memakai username GitHub (nama asli tak diketahui) — catat di report agar user bisa koreksi 1 baris.
- **VALIDATE**: `gh api repos/if7D0/onecast --jq .license` tetap null sampai push (wajar) — verifikasi lokal: file ada + `npx prettier --check LICENSE` diabaikan (LICENSE bukan untuk prettier; JANGAN sertakan).

### Task 2: CONTRIBUTING.md

- **ACTION**: Buat `CONTRIBUTING.md` Bahasa Indonesia mengikuti alur repo aktual.
- **IMPLEMENT**: Bagian: Prasyarat (Node ≥24, Supabase), Setup (`npm install`, `cp .env.example .env`), Alur kerja (branch `feat/`/`fix/` dari `main` → ubah → `tsc`+`lint`+`test`+`prettier`+`build` hijau → review → PR → merge otomatis-oleh-maintainer), Aturan (tanpa `.env` di commit, tanpa key di client, test untuk kode baru, tanpa dep baru tanpa diskusi), Lapor bug (sertakan log + langkah reproduksi).
- **MIRROR**: DOC_STYLE_ID
- **IMPORTS**: —
- **GOTCHA**: JANGAN klaim proses yang tak ada (tidak ada issue template, tidak ada CLA). Tulis hanya yang benar-benar berlaku.
- **VALIDATE**: `npx prettier --check CONTRIBUTING.md` hijau.

### Task 3: Finalisasi README

- **ACTION**: Update 5 titik basi + tambah bagian produksi.
- **IMPLEMENT**:
  1. Banner (6-7) → status produksi: link live `https://onecast-brown.vercel.app` + badge fase `9/9 complete`.
  2. Struktur Folder (75-78) → deskripsi akurat singkat (app routes, components, lib/ai, prisma) tanpa klaim "kontrak doc".
  3. Baris headers "belum ada" (182-183) → hapus; rujuk `next.config.ts` (sudah ada sejak Fase 8).
  4. Lisensi (188-190) → `MIT — lihat LICENSE`.
  5. Tambah `## Produksi`: URL live, cara cek (`curl /api/health`), daftar env produksi wajib (DATABASE_URL, Supabase URL/anon/service-role, minimal 1 AI key, NEXT_PUBLIC_APP_URL = URL Vercel), catatan Hobby non-komersial (sudah ada di Deploy — rujuk, jangan duplikasi).
  6. Tambah 2 baris troubleshooting produksi: `prerender gagal di CI` (env Supabase dummy — lihat workflow) dan `metadata berisi localhost` (isi NEXT_PUBLIC_APP_URL produksi).
- **MIRROR**: DOC_STYLE_ID, ENV_TABLE, TROUBLESHOOTING_TABLE
- **IMPORTS**: —
- **GOTCHA**: JANGAN hapus bagian fase lama yang masih akurat (Auth checklist, AI, API docs) — hanya perbaiki yang basi. JANGAN tulis klaim Lighthouse (skor milik user, belum ada).
- **VALIDATE**: `npx prettier --check README.md` hijau; baca ulang diff.

### Task 4: package.json license + validasi statis

- **ACTION**: Tambah `"license": "MIT"` bila absen; jalankan tsc+lint+prettier+test cepat.
- **IMPLEMENT**: Edit JSON 1 baris (posisi alfabetis bila ada pola; jika tidak, setelah `"private"`).
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: JANGAN ubah versi/dep. `npm test` full (live test boleh skip; JANGAN paksa key).
- **VALIDATE**: `npx tsc --noEmit`, `npm run lint -- --quiet`, `npx prettier --check .` (toleransi: `CLAUDE.md` warn pre-existing — catat, jangan sentuh), `npm test`.

### Task 5: Verifikasi produksi live

- **ACTION**: Curl terhadap `https://onecast-brown.vercel.app`: `/` (200), `/api/health` (JSON providers), `/sitemap.xml`, `/robots.txt`, `/opengraph-image` (content-type image), headers keamanan.
- **IMPLEMENT**: `curl.exe -s -o /dev/null -w "%{http_code}" <url>` per endpoint + `-sI` untuk headers. Retry 1x bila gagal (cold start).
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: `/api/health` menampilkan `configured` per provider — bila semua `false`, berarti env produksi belum diisi → CATAT sebagai temuan untuk user (JANGAN bisa perbaiki dari sini; butuh dashboard Vercel). Bila deploy belum ada/404 → catat juga. Temuan BUKAN kegagalan plan — laporkan apa adanya.
- **VALIDATE**: Hasil tiap endpoint tercatat di report (status + bukti ringkas).

---

## Testing Strategy

Fase docs — tanpa unit test baru. Pengujian = verifikasi live + validasi statis.

| Test               | Input                           | Expected Output               | Edge Case?                |
| ------------------ | ------------------------------- | ----------------------------- | ------------------------- |
| Prettier docs      | `LICENSE` dikecualikan; lainnya | Hijau                         | —                         |
| Full suite regresi | `npm test`                      | Hijau (live boleh skip)       | —                         |
| Health produksi    | `GET /api/health` prod          | 200 + boolean (nilai apa pun) | Ya (semua false = temuan) |
| OG produksi        | `GET /opengraph-image`          | `image/png`                   | —                         |

### Edge Cases Checklist

- [ ] Env produksi kosong (catat, bukan gagal)
- [ ] Cold start Vercel (retry 1x)
- [ ] `CLAUDE.md` prettier warn (pre-existing, abaikan)

---

## Validation Commands

### Static Analysis

```bash
npx tsc --noEmit
```

EXPECT: Zero type errors

### Unit Tests

```bash
npm test
```

EXPECT: Hijau (live boleh skip)

### Lint + Format

```bash
npm run lint -- --quiet
npx prettier --check README.md CONTRIBUTING.md package.json
```

EXPECT: Bersih (LICENSE dikecualikan; CLAUDE.md diabaikan)

### Live Production

```bash
curl.exe -s -o NUL -w "%{http_code}\n" https://onecast-brown.vercel.app/
curl.exe -s https://onecast-brown.vercel.app/api/health
curl.exe -sI https://onecast-brown.vercel.app/ | Select-String "Strict|Content-Type|X-Frame"
```

EXPECT: 200 semua; health JSON valid; HSTS dari Vercel

### Manual Validation

- [ ] LICENSE tampil sebagai MIT di GitHub (setelah push)
- [ ] README link live bisa diklik
- [ ] Tidak ada klaim basi tersisa (grep "Fase 1" / "belum ada")

---

## Acceptance Criteria

- [ ] LICENSE + CONTRIBUTING ada dan diformat
- [ ] README akurat (tanpa banner basi)
- [ ] package.json berlisensi MIT
- [ ] Produksi terverifikasi via curl, hasil tercatat
- [ ] Checklist manual user diserahkan (domain, video, submit, sosmed)

## Completion Checklist

- [ ] Bahasa Indonesia, gaya DOC_STYLE_ID
- [ ] Tanpa klaim unverified (skor Lighthouse, custom domain)
- [ ] Temuan produksi dilaporkan apa adanya
- [ ] Self-contained

## Risks

| Risk                                          | Likelihood | Impact | Mitigation                                                    |
| --------------------------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| Env produksi belum diisi (health semua false) | Med        | Med    | Catat temuan + instruksi isi via dashboard Vercel             |
| Deploy produksi belum ada / URL berubah       | Low        | Med    | Verifikasi homepage dulu; bila 404, catat dan stop verifikasi |
| Nama pemegang hak LICENSE salah               | Low        | Low    | Pakai if7D0 + catat agar user koreksi                         |

## Notes

- PRD "Deploy ke Vercel" pada praktiknya sudah berjalan (auto-deploy tiap merge + Vercel SUCCESS di semua PR). Fase ini = verifikasi + docs, bukan setup baru.
- GitHub Pages sengaja tidak dibangun: repo ini aplikasi Next.js (render server), bukan docs statis; dokumentasi = README + report PRP.
