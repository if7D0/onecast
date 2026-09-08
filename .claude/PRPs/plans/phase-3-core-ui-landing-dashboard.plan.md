# Plan: Fase 3 — Core UI Landing + Dashboard (OneCast)

## Summary

Bangun landing page Bahasa Indonesia (hero, fitur, cara kerja, CTA, header/footer)
dan dashboard fungsional tanpa AI: layout sidebar + form input (textarea + upload
.txt/.md) + pemilih platform/tone + tombol Generate yang menampilkan hasil MOCK
interaktif (dengan skeleton loading) + copy-to-clipboard + dark mode toggle,
mobile-first. Copywriting didrafkan dari PRD.

## User Story

As a **pengunjung baru**,
I want **memahami value OneCast dalam 30 detik dan mencoba alur generate (mock)**,
So that **saya mau daftar dan memakai tool saat AI-nya live di Fase 5**.

## Problem → Solution

Welcome page bawaan Next.js + dashboard placeholder kartu → landing profesional
ID + dashboard siap-pakai yang alurnya sudah teruji ujung-ke-ujung dengan mock
(tinggal colok API di Fase 5 tanpa ubah UI).

## Metadata

- **Complexity**: Large
- **Source PRD**: `.claude/PRPs/prds/onecast.prd.md`
- **PRD Phase**: Phase 3 — Core UI (dependensi Fase 1 `complete` terpenuhi)
- **Estimated Files**: 16 created, 3 updated
- **Keputusan user**: Bahasa Indonesia; copy saya drafkan; dashboard mock interaktif.

---

## UX Design

### Before

```
┌─────────────────────────────┐
│ / = welcome Next.js (EN)    │
│ /dashboard = kartu "sementara"│
│ Tidak ada tema gelap        │
└─────────────────────────────┘
```

### After

```
┌─────────────────────────────┐
│ / = Header + Hero + Fitur   │
│     + Cara kerja + CTA +    │
│     Footer (ID, dark-ready) │
│ /dashboard = Sidebar + Form │
│   (input/upload/platform/   │
│   tone) → skeleton → hasil  │
│   mock per platform + copy  │
└─────────────────────────────┘
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| `/` | Template Inggris | Landing ID lengkap | Server Component statis |
| Toggle tema | — | Sun/Moon di header + dashboard | Persist `next-themes`, default system |
| Form konten | — | Textarea + counter + upload .txt/.md (maks 200 KB, error bila salah) | Client state |
| Platform | — | 4 checkbox card (X, LinkedIn, Instagram, Email) | Min. 1 dipilih |
| Tone | — | Dropdown 4 opsi + deskripsi | Default professional |
| Generate | — | 1,2 dtk skeleton → hasil mock per platform | Siap diganti API Fase 5 |
| Copy | — | Tombol per hasil → "Disalin ✓" 2 dtk | Clipboard + fallback |
| `/dashboard` placeholder | Kartu sementara | Dihapus, diganti dashboard asli | `requireUser()` tetap |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `.claude/PRPs/prds/onecast.prd.md` | 398–419 | Goal, tasks, success signal, deliverables Fase 3 |
| P0 | `.claude/PRPs/prds/onecast.prd.md` | 589–632 | Kontrak API generate (bentuk data per platform — mock mengikutinya) |
| P0 | `src/app/layout.tsx` | 1–27 | Diubah: provider tema + metadata ID + `lang="id"` |
| P0 | `src/app/globals.css` | 1–6, 86–118 | `@custom-variant dark` + token `.dark` SUDAH ada — jangan duplikasi |
| P0 | `src/app/(dashboard)/dashboard/page.tsx` | 1–30 | Placeholder yang DIGANTI total |
| P1 | `src/app/(auth)/layout.tsx` | — | Pola kartu tengah + Header shadcn untuk ditiru |
| P1 | `src/components/ui/*` | — | button, card, input, textarea, select, checkbox, skeleton (pakai, jangan buat baru) |
| P1 | `src/lib/auth/helpers.ts` | — | `requireUser()` tetap dipakai dashboard layout |
| P1 | `src/app/(auth)/login/login-form.tsx` | — | Pola Client Component + `role="alert"` + shadcn |
| P2 | `middleware.ts` (root) | — | Proteksi `/dashboard` tak berubah; pastikan toggle/landing publik |

## External Documentation

Tidak ada riset eksternal — semua pola internal mapan (shadcn, `next-themes`
standar: `ThemeProvider attribute="class" defaultTheme="system" enableSystem`
+ `suppressHydrationWarning` di `<html>`).

---

## Patterns to Mirror

### NAMING_CONVENTION

// SOURCE: Fase 2 — `src/app/(auth)/login/login-form.tsx`, `src/lib/validations/auth.ts`
- Komponen: PascalCase per file (`ContentInput.tsx`), helper: camelCase
- Client interaktif: `"use client"` baris pertama; Server: default
- Konstanta bersama di `src/lib/*` (contoh: `PASSWORD_MIN`) — tiru untuk `PLATFORMS`, `TONES`
- Alias `@/...` untuk semua impor lintas folder

### THEME_PATTERN (baru, standar next-themes)

```tsx
// src/components/theme-provider.tsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
// layout.tsx: <html lang="id" suppressHydrationWarning>
```

### MOCK_DATA_PATTERN (kontrak: tiru bentuk API PRD 589–632)

```ts
// src/types/generation.ts
export const PLATFORMS = ["twitter", "linkedin", "instagram", "email"] as const;
export type Platform = (typeof PLATFORMS)[number];
export const TONES = ["professional", "casual", "witty", "inspirational"] as const;
export type Tone = (typeof TONES)[number];
export interface MockResult { platform: Platform; title: string; body: string; footer?: string }
// src/lib/mock/generation.ts
export function mockGenerate(content: string, platform: Platform, tone: Tone): MockResult
// Aturan mock: twitter body ≤ 280 char; linkedin = hook + isi + CTA; instagram = caption + hashtag;
// email = subjek + badan. Awali body dengan label tone agar perbedaan terlihat.
```

### FORM_STATE_PATTERN (dashboard client, siap colok API Fase 5)

```tsx
"use client";
type Status = "idle" | "loading" | "done";
const [content, setContent] = useState("");
const [platforms, setPlatforms] = useState<Platform[]>(["twitter", "linkedin"]);
const [tone, setTone] = useState<Tone>("professional");
const [status, setStatus] = useState<Status>("idle");
const [results, setResults] = useState<MockResult[]>([]);
function handleGenerate() {
  if (!content.trim() || platforms.length === 0) return;
  setStatus("loading");
  window.setTimeout(() => {
    setResults(platforms.map((p) => mockGenerate(content, p, tone)));
    setStatus("done");
  }, 1200);
}
// Fase 5: ganti isi setTimeout dengan fetch POST /api/generate.
```

### COPY_PATTERN (dengan fallback non-HTTPS)

```tsx
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch { return false; }
  }
}
// Tombol: "Salin" → "Disalin ✓" 2 dtk (setTimeout + cleanup), role="status".
```

### TEST_STRUCTURE

// SOURCE: `src/lib/validations/auth.test.ts`, `src/lib/rate-limit.test.ts`, `vitest.config.ts`
- Lokasi: berdampingan (`*.test.ts`), `npm test` = `vitest run`
- Untuk Fase 3: `src/lib/mock/generation.test.ts` — tiap platform hasil non-kosong,
  twitter ≤ 280, tone berbeda → body berbeda.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/components/theme-provider.tsx` | CREATE | Provider next-themes |
| `src/components/theme-toggle.tsx` | CREATE | Tombol Sun/Moon (lucide), dipakai header + dashboard |
| `src/components/layout/header.tsx` | CREATE | Nav landing (logo, tautan, Masuk/Dashboard adaptif?) |
| `src/components/layout/footer.tsx` | CREATE | Footer landing |
| `src/components/layout/sidebar.tsx` | CREATE | Nav dashboard (Buat, Riwayat-disabled "Segera", Keluar) |
| `src/components/layout/dashboard-header.tsx` | CREATE | Topbar mobile (menu + toggle + email) |
| `src/types/generation.ts` | CREATE | `PLATFORMS`, `TONES`, `MockResult` |
| `src/lib/mock/generation.ts` | CREATE | Generator mock per platform+tone |
| `src/lib/mock/generation.test.ts` | CREATE | 5+ unit test mock |
| `src/components/forms/content-input.tsx` | CREATE | Textarea + counter (maks 5000) + upload .txt/.md 200 KB |
| `src/components/forms/platform-selector.tsx` | CREATE | 4 checkbox card + validasi min 1 |
| `src/components/forms/tone-selector.tsx` | CREATE | Select 4 tone + deskripsi |
| `src/components/forms/generate-button.tsx` | CREATE | Tombol + state disabled/loading (ikut struktur PRD) |
| `src/components/results/result-card.tsx` | CREATE | Kartu per platform |
| `src/components/results/result-list.tsx` | CREATE | Grid + empty state + skeleton saat loading |
| `src/components/results/copy-button.tsx` | CREATE | Clipboard + fallback + status |
| `src/app/(dashboard)/layout.tsx` | CREATE | Shell sidebar (server: requireUser + email ke sidebar) |
| `src/app/page.tsx` | UPDATE (tulis ulang) | Landing ID lengkap |
| `src/app/layout.tsx` | UPDATE | Provider + metadata ID + `lang="id"` |
| `src/app/(dashboard)/dashboard/page.tsx` | UPDATE (tulis ulang) | Dashboard mock interaktif, hapus placeholder |
| `src/app/(dashboard)/dashboard/actions.ts` | UPDATE | JSDoc + pindah logout? TETAP (dipakai sidebar) |

## NOT Building

- Panggilan AI / `/api/generate` (Fase 4–5) — mock sengaja terisolasi 1 file
- Halaman `/history` (Fase 6) — nav ada tapi disabled + badge
- `hooks/useGenerate` (Fase 5 ikut API) — state lokal `useState` cukup
- Reset password, profil user, settings (Fase 8+)
- SEO lanjut (sitemap/OG image — Fase 8); metadata dasar saja
- Logo/gambar kustom — teks + ikon lucide saja

---

## Step-by-Step Tasks

### Task 1: Tema (provider + toggle + layout)

- **ACTION**: Buat `theme-provider.tsx`, `theme-toggle.tsx`; update `layout.tsx`
  (metadata ID, `lang="id"`, provider, `suppressHydrationWarning`).
- **IMPLEMENT**: Pola THEME_PATTERN. Toggle: `useTheme()` (`theme/systemTheme`),
  ikon Sun/Moon lucide-react, `aria-label="Ganti tema"`. Metadata:
  title "OneCast — Ubah Satu Konten Jadi Banyak Format",
  description ID 1 kalimat dari PRD (hemat 80% waktu repurposing).
- **MIRROR**: THEME_PATTERN; NAMING_CONVENTION
- **IMPORTS**: `next-themes`, `lucide-react` (Sun, Moon), `@/components/ui/button`
- **GOTCHA**: Tanpa `suppressHydrationWarning` → hydration mismatch (tema dibaca
  client). Tanpa `attribute="class"` → varian `dark:` tak aktif (CSS pakai `.dark`).
- **VALIDATE**: `tsc` + `lint`; toggle manual di browser (dicatat di Task 7).

### Task 2: Landing page

- **ACTION**: Buat `header.tsx`, `footer.tsx`; tulis ulang `page.tsx`.
- **IMPLEMENT** (draf copy ID, revisi saat review user):
  Header sticky: logo teks "OneCast" + nav (Fitur, Cara kerja) + tombol Masuk/Dashboard.
  Hero: badge "Gratis & Open-source", H1 "Ubah satu konten jadi siap-post di semua platform",
  sub dari PRD (<5 menit, hemat 80% waktu), CTA "Mulai Gratis" → `/register` +
  "Lihat cara kerja" (anchor). Fitur: 4 kartu (per platform target). Cara kerja:
  3 langkah (Tempel → Pilih → Salin). CTA bawah + Footer (© + GitHub + "Dibuat dengan Next.js + Supabase").
  Semua Server Component; `next/link` untuk internal.
- **MIRROR**: Pola kartu `(auth)/layout`; `role`/semantik (h1 sekali, section + aria-labelledby)
- **IMPORTS**: `next/link`, shadcn button/card, lucide (Twitter/X?, Linkedin, Instagram, Mail, Zap, Clock, Copy, Check)
- **GOTCHA**: Ikon brand X tidak ada di lucide — pakai `Share2`/`AtSign` generik,
  jangan import yang tak ada. Anchor `#fitur` butuh `id` + `scroll-mt`.
- **VALIDATE**: `tsc` + `lint`; curl `/` mengandung "OneCast" + "Mulai Gratis".

### Task 3: Shell dashboard (layout + sidebar + topbar)

- **ACTION**: Buat `(dashboard)/layout.tsx`, `sidebar.tsx`, `dashboard-header.tsx`;
  pindah logout ke sidebar (actions.ts tetap).
- **IMPLEMENT**: Layout server: `requireUser()` → email diteruskan ke sidebar.
  Desktop: sidebar tetap kiri (navigasi: Buat Baru `/dashboard`, Riwayat disabled
  + badge "Segera" + `aria-disabled`, Keluar via form action logout).
  Mobile: topbar dengan menu drawer sederhana (state client di dashboard-header)
  + theme-toggle + email. Aktif link via `usePathname` (komponen client kecil
  `nav-links.tsx` bila perlu — boleh gabung di sidebar sebagai client).
- **MIRROR**: SERVER_ACTION_FORM Fase 2 (form logout); helper `requireUser`
- **IMPORTS**: `@/lib/auth/helpers`, `./actions`, `next/navigation` (usePathname), lucide (PlusCircle, History, LogOut, Menu, X)
- **GOTCHA**: `usePathname` hanya di Client Component — pisahkan nav-links client
  dari layout server. Sidebar `hidden md:flex`, drawer `md:hidden`.
- **VALIDATE**: `tsc` + `lint`; anon ke `/dashboard` tetap 307 → `/login`.

### Task 4: Tipe + mock + test-nya

- **ACTION**: Buat `types/generation.ts`, `lib/mock/generation.ts`, test-nya.
- **IMPLEMENT**: Pola MOCK_DATA_PATTERN. Label platform ID:
  twitter "X (Twitter)", linkedin "LinkedIn", instagram "Instagram", email "Email Newsletter".
  Label tone ID untuk awalan body. Twitter: potong 277 + "…" bila lewat.
  Test: 4 platform non-kosong; twitter ≤ 280; tone beda → body beda; email punya subjek.
- **MIRROR**: TEST_STRUCTURE (vitest berdampingan)
- **IMPORTS**: `vitest`, `./generation`
- **GOTCHA**: Mock deterministik (tanpa random/Date) agar test stabil.
- **VALIDATE**: `npm test` (skrg 9 → ≥14 test hijau).

### Task 5: Komponen form

- **ACTION**: Buat 4 file di `components/forms/`.
- **IMPLEMENT**:
  - `content-input.tsx` (client): `Textarea` shadcn + counter `n/5000` +
    upload: `<Input type="file" accept=".txt,.md,text/plain,text/markdown">`,
    baca via `FileReader` → `onChange(text)`; tolak tipe lain/ukuran > 200 KB
    dengan pesan `role="alert"`; tampil nama file terpilih.
  - `platform-selector.tsx` (client): 4 label-checkbox card (Checkbox shadcn +
    ikon + nama + hint batasan: "≤280 karakter", "Hook + CTA", "+ hashtag",
    "Subjek + isi"); toggle array; error bila kosong (disampaikan ke parent via
    validitas, bukan alert sendiri).
  - `tone-selector.tsx` (client): `Select` shadcn (value + onValueChange) 4 tone
    + deskripsi 1 baris per tone di bawahnya.
  - `generate-button.tsx` (client): props `disabled`, `loading`; label
    "Generate" → spinner "Membuat..." (ikon Loader2 `animate-spin`).
- **MIRROR**: FORM pola `(auth)` (label htmlFor, pesan `role="alert"`)
- **IMPORTS**: shadcn textarea/input/checkbox/select/button, lucide (Upload, Loader2, FileText), `@/types/generation`
- **GOTCHA**: `Select` shadcn v4 butuh `SelectTrigger/Value/Content/Item` lengkap;
  FileReader async — tangani `onerror`. Controlled component penuh (value dari parent).
- **VALIDATE**: `tsc` + `lint`.

### Task 6: Hasil + halaman dashboard

- **ACTION**: Buat 3 file `results/`; tulis ulang `dashboard/page.tsx` (client).
- **IMPLEMENT**: `copy-button.tsx` pola COPY_PATTERN. `result-card.tsx`:
  Card + header (ikon platform + title + badge tone) + body whitespace-pre-wrap +
  footer (char count + copy). `result-list.tsx`: props `results`, `loading`;
  loading → 2–3 `Skeleton`; kosong → empty state ("Isi konten, pilih minimal
  1 platform, klik Generate"). Page: FORM_STATE_PATTERN + validasi
  (content kosong / 0 platform → pesan alert, tidak generate);
  `aria-live="polite"` pada area hasil; komentar `// Fase 5:` di handleGenerate.
- **MIRROR**: FORM_STATE_PATTERN; COPY_PATTERN; MOCK_DATA_PATTERN
- **IMPORTS**: shadcn card/skeleton/button, lucide (Copy, Check, Sparkles, FileWarning?), `@/lib/mock/generation`, `@/types/generation`
- **GOTCHA**: `setTimeout` di client — simpan id + `clearTimeout` di cleanup
  `useEffect` (hindari setState setelah unmount). `whitespace-pre-wrap` untuk
  line break mock.
- **VALIDATE**: `tsc` + `lint` + `npm test` + `npm run build`.

### Task 7: Responsif + validasi akhir

- **ACTION**: Audit breakpoint (sm/md/lg) semua halaman baru; jalankan validasi penuh.
- **IMPLEMENT**: Checklist manual: 390px (form 1 kolom, drawer), 768px (grid hasil
  2 kolom), 1280px (hero 2 kolom?, sidebar tetap). Perintah:
  `tsc`, `lint`, `npm test`, `prettier --check .`, `npm run build`,
  smoke curl `/` + `/login` 200 + `/dashboard` anon → `/login`.
  Screenshot diminta ke user (AI tak bisa screenshot browser).
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: `dark:` hanya terlihat bila toggle diklik — uji kedua tema.
  Skeleton tanpa `aria-busy` membingungkan SR — tambah `aria-busy` + `aria-label`.
- **VALIDATE**: Semua hijau + checklist manual terisi di laporan.

---

## Testing Strategy

| Test | Input | Expected Output | Edge? |
|---|---|---|---|
| Mock tiap platform | konten sample + tiap tone | Non-kosong, format sesuai aturan | — |
| Batas twitter | konten 1000 char | Body ≤ 280 | Ya |
| Tone berbeda | sama konten, 2 tone | Body berbeda | — |
| Upload salah | file .pdf / >200 KB | Pesan error, konten tak berubah | Ya |
| Generate kosong | konten "" / 0 platform | Alert, tanpa hasil | Ya |
| Copy | klik Salin | "Disalin ✓" 2 dtk | — |
| Proteksi | anon GET /dashboard | 307 → /login | Ya |
| Tema | klik toggle 2x | light→dark→light persist reload | — |

### Edge Cases Checklist

- [ ] Upload .md dengan frontmatter (tampilkan mentah — OK untuk mock)
- [ ] Konten > 5000 char (tolak dengan pesan, sarankan ringkas)
- [ ] Clipboard API diblokir (fallback execCommand / pesan gagal)
- [ ] `prefers-color-scheme` dark + toggle manual (manual menang)
- [ ] Mobile drawer + logout (aksi tetap jalan)

---

## Validation Commands

```bash
npx tsc --noEmit          # EXPECT: bersih
npm run lint              # EXPECT: bersih
npm test                  # EXPECT: ≥14 hijau (9 lama + ≥5 baru)
npx prettier --check .    # EXPECT: bersih
npm run build             # EXPECT: hijau, route /, /login, /dashboard terdaftar
npm run dev               # smoke: / 200, /dashboard anon → /login
```

### Manual Validation

- [ ] Landing terbaca 30 detik (headline, CTA jelas) — light + dark
- [ ] 390/768/1280px tidak ada overflow horizontal
- [ ] Alur mock: isi → pilih → generate → skeleton → hasil → salin
- [ ] Toggle tema persist setelah reload
- [ ] Screenshot landing + dashboard (user, lampirkan di PR)

---

## Acceptance Criteria

- [ ] Landing ID lengkap (hero, fitur, cara kerja, CTA, header, footer)
- [ ] Dashboard: sidebar + form + mock interaktif + copy + skeleton + toggle
- [ ] Dark mode toggle bekerja + persist, mobile-first responsif
- [ ] Semua validation command hijau + CI hijau
- [ ] Test mock hijau (deterministik)
- [ ] Tanpa API/AI/history — mock terisolasi 1 file + komentar Fase 5

## Completion Checklist

- [ ] Pola repo diikuti (client/server split, alias `@/`, pesan `role="alert"`)
- [ ] Tanpa hardcoded secret; tanpa `console.log`
- [ ] Placeholder Fase 2 terhapus total
- [ ] Copy ID konsisten (tidak campur EN kecuali istilah produk)
- [ ] Self-contained — implementasi tanpa riset tambahan

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Copywriting draf kurang nendang | Med | Low | User revisi saat review PR (teks terisolasi di page) |
| Mock terlalu mirip "asli" → user bingung | Low | Med | Badge "Contoh" pada tiap result-card mock |
| Select/Checkbox shadcn v4 API beda | Low | Med | Ikuti file ui yang ada, cek props sebelum pakai |
| Scope merambat (SEO, OG, animasi) | Med | Med | NOT Building tegas; animasi = `tw-animate-css` seperlunya |

## Notes

- Badge "Contoh hasil" wajib di tiap kartu mock agar jujur (belum AI).
- Struktur folder mengikuti PRD Fase 1 (`forms/`, `results/`, `layout/`).
  Deviasi sadar: `generate-button.tsx` dibuat (sesuai PRD), `hooks/` DITUNDA ke Fase 5.
- Estimasi 4 hari solo part-time sesuai PRD.
