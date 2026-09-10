# Berkontribusi ke OneCast

Terima kasih mau berkontribusi! OneCast adalah proyek solo open-source (MIT),
jadi prosesnya dibuat sesederhana mungkin.

## Prasyarat

- Node.js ≥ 24 (`node -v`)
- npm (bawaan Node)
- Project Supabase gratis ([supabase.com](https://supabase.com)) untuk kredensial DB

## Setup Lokal

```bash
npm install
cp .env.example .env   # isi dari dashboard Supabase + minimal 1 AI key
npm run dev            # http://localhost:3000
```

## Alur Kerja

1. Buat branch dari `main`: `feat/nama-fitur` atau `fix/nama-perbaikan`.
2. Kerjakan perubahan dalam langkah kecil.
3. Sebelum push, semua ini WAJIB hijau:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm test             # live AI test skip otomatis tanpa key
   npx prettier --check .
   npm run build
   ```
4. Buat Pull Request ke `main` dengan deskripsi: ringkasan, perubahan,
   dan cara menguji. Tunggu review + CI hijau sebelum merge.

## Aturan

- **Jangan commit `.env`** (sudah di-ignore). Contoh nilai hanya di `.env.example`.
- **Jangan taruh key di client** — API key hanya di server (tanpa prefix `NEXT_PUBLIC_`).
- **Tulis test** untuk kode baru (lihat pola `*.test.ts` yang sudah ada).
- **Tanpa dependensi baru** tanpa diskusi dulu di issue/PR.
- Ikuti gaya kode yang ada (Bahasa Indonesia untuk pesan user, Inggris untuk identifier).

## Lapor Bug

Sertakan: langkah reproduksi, yang diharapkan vs yang terjadi, dan log
relevan (tanpa secret!). Screenshot bila membantu.
