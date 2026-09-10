# Plan: Fase 7 — Fallback AI Providers (OneCast)

## Summary

Tambahkan dua provider AI yang mengimplementasikan kontrak `AIProvider` yang sudah ada — Groq (`llama-3.3-70b-versatile`) dan OpenRouter (`openrouter/free`) — via native `fetch` OpenAI-compatible (tanpa dependensi baru), plus rantai fallback otomatis Gemini → Groq → OpenRouter di `providers/index.ts` dengan failover per-platform-call di `generateForPlatforms`. Tanpa perubahan UI, tanpa perubahan signature API route.

## User Story

As a **user OneCast**,
I want **generate tetap berhasil walau Gemini Flash rate-limited atau down**,
So that **saya tidak melihat error 503/502 saat kuota gratis habis**.

## Problem → Solution

Satu provider (Gemini) = single point of failure saat 429/down → rantai 3 provider dengan failover otomatis per platform call; provider yang dipakai tercatat di `metadata.provider` dan API response tetap sama bentuknya.

## Metadata

- **Complexity**: Medium
- **Source PRD**: `.claude/PRPs/prds/onecast.prd.md`
- **PRD Phase**: Phase 7 — Fallback AI Providers, eligible (dependensi Fase 4 `complete`)
- **Estimated Files**: 4 created, 3 updated

---

## UX Design

N/A — internal change. Tidak ada perubahan komponen, halaman, atau copy UI.

### Before

```
┌──────────────────────────────────┐
│ Dashboard → Generate             │
│ Gemini 429/down → toast error    │
│ "AI sedang sibuk. Coba lagi."    │
│ (user harus retry manual)        │
└──────────────────────────────────┘
```

### After

```
┌──────────────────────────────────┐
│ Dashboard → Generate             │
│ Gemini 429 → otomatis Groq → OK  │
│ Hasil tampil normal; metadata    │
│ .provider = "groq-..."           │
│ (hanya bila SEMUA down → toast)  │
└──────────────────────────────────┘
```

### Interaction Changes

| Touchpoint                                   | Before                           | After                                                 | Notes                                   |
| -------------------------------------------- | -------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Dashboard generate                           | Gagal saat Gemini 429/down       | Berhasil via fallback                                 | UI tak berubah                          |
| `/api/generate` response `metadata.provider` | Selalu `"gemini-flash"`          | Nama provider aktual / gabungan `"a+b"` bila campuran | Bentuk respons sama                     |
| `/api/health`                                | Tidak ada (belum diimplementasi) | `GET` kembalikan status configured per provider       | Tanpa bocor key; monitoring minimal PRD |

---

## Mandatory Reading

Files yang WAJIB dibaca sebelum implementasi:

| Priority       | File                                                                  | Lines  | Why                                                                                                              |
| -------------- | --------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| P0 (critical)  | `src/lib/ai/types.ts`                                                 | 1-23   | Kontrak `AIProvider`/`GenerateArgs`/`AIResult` — provider baru WAJIB implement ini persis                        |
| P0 (critical)  | `src/lib/ai/providers/gemini.ts`                                      | 1-65   | Pola provider acuan: `buildPrompt`, env guard, timeout, `usageMetadata` → `tokensUsed`, `mapProviderError`       |
| P0 (critical)  | `src/lib/ai/providers/index.ts`                                       | 1-12   | Factory yang akan diubah jadi rantai fallback                                                                    |
| P0 (critical)  | `src/lib/ai/index.ts`                                                 | 36-72  | Orkestrasi sequential per platform — titik failover                                                              |
| P0 (critical)  | `src/lib/ai/errors.ts`                                                | 40-106 | `mapProviderError` dipakai ulang; pahami kode mana retryable                                                     |
| P0 (critical)  | `src/lib/ai/env.ts`                                                   | 1-17   | Pola guard env (`geminiEnv`) yang ditiru untuk Groq/OpenRouter                                                   |
| P1 (important) | `src/lib/ai/prompts/index.ts`                                         | 1-41   | `buildPrompt` dipakai ulang oleh provider baru (JANGAN duplikasi prompt)                                         |
| P1 (important) | `src/lib/ai/index.test.ts`                                            | 1-65   | Pola `FakeProvider` + `describe.skipIf` live test yang ditiru                                                    |
| P1 (important) | `src/lib/ai/errors.test.ts`                                           | 1-51   | Pola test mapping error tanpa jaringan                                                                           |
| P1 (important) | `src/app/api/generate/route.ts`                                       | 95-138 | Kontrak pemanggil: `generateForPlatforms(content, platforms, tone)` 3 argumen — signature HARUS tetap kompatibel |
| P2 (reference) | `.env.example`                                                        | 14-18  | Key `GROQ_API_KEY`/`OPENROUTER_API_KEY` sudah dikontrak (kosong) — tinggal tambah komentar cara dapat            |
| P2 (reference) | `vitest.config.ts`                                                    | 1-18   | `src/**/*.test.{ts,tsx}`, alias `@`                                                                              |
| P2 (reference) | `.claude/PRPs/plans/completed/phase-4-ai-integration-primary.plan.md` | 71-158 | Rasional pola (interface, error, prompt, service)                                                                |

## External Documentation

| Topic                       | Source                                                               | Key Takeaway                                                                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Groq OpenAI-compat endpoint | console.groq.com/docs/openai                                         | `POST https://api.groq.com/openai/v1/chat/completions`, `Authorization: Bearer $GROQ_API_KEY`, body `{model, messages, temperature, max_tokens}`; `response.choices[0].message.content`, `usage.{prompt_tokens,completion_tokens,total_tokens}` |
| Groq model stabil gratis    | console.groq.com/docs/models + theneuralbase.com (verified Apr 2026) | `llama-3.3-70b-versatile`, 131K context, ~30 req/min free tier. Jangan pakai `logprobs`/`logit_bias`/`n≠1` (400)                                                                                                                                |
| OpenRouter chat completions | openrouter.ai/docs/quickstart + api_reference                        | `POST https://openrouter.ai/api/v1/chat/completions`, header `Authorization: Bearer`, `Content-Type: application/json`, opsional `HTTP-Referer` + `X-Title`; body sama OpenAI-style; `model: "openrouter/free"` = router model gratis resmi     |
| OpenRouter free router      | openrouter.ai/openrouter/free/api                                    | `openrouter/free` memilih acak model gratis yang support fitur request — cocok untuk fallback (ketersediaan > determinisme)                                                                                                                     |
| Fetch timeout Node 18+      | Node docs (established)                                              | `AbortSignal.timeout(ms)` untuk `fetch(..., {signal})` — sama seperti dipakai Gemini via SDK                                                                                                                                                    |

---

## Patterns to Mirror

Code patterns dari codebase. Ikuti persis.

### PROVIDER_CONTRACT

// SOURCE: `src/lib/ai/types.ts:19-23`

```ts
export interface AIProvider {
  /** Nama untuk metadata + log, mis. "gemini-flash". */
  readonly name: string;
  generate(args: GenerateArgs): Promise<AIResult>;
}
```

// Aturan: provider baru = class dengan `readonly name` + `generate`, tanpa mengubah interface.

### PROVIDER_IMPLEMENTATION

// SOURCE: `src/lib/ai/providers/gemini.ts:32-64`

```ts
export class GeminiProvider implements AIProvider {
  readonly name = "gemini-flash";

  async generate({ content, platform, tone }: GenerateArgs): Promise<AIResult> {
    const prompt = buildPrompt(content, platform, tone); // throw INVALID_INPUT bila buruk
    const { apiKey } = geminiEnv();
    try {
      // ... call ...
      const text = res.text?.trim();
      if (!text) {
        throw new AIError("PROVIDER_DOWN", "Provider AI mengembalikan respons kosong.", true);
      }
      // tokens dari usage, fallback estimasi len/4
      return { text, tokensUsed };
    } catch (e) {
      if (e instanceof AIError) throw e;
      throw mapProviderError(e, this.name);
    }
  }
}
```

// Aturan: (1) `buildPrompt` dulu (validasi input di muka), (2) env guard di dalam `generate`, (3) respons kosong → `AIError PROVIDER_DOWN retryable`, (4) `catch`: rethrow `AIError`, else `mapProviderError(e, this.name)`.

### ENV_GUARD

// SOURCE: `src/lib/ai/env.ts:5-17`

```ts
export function geminiEnv() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new AIError(
      "INVALID_KEY",
      "Konfigurasi AI belum lengkap: isi GOOGLE_AI_API_KEY di .env " +
        "(ambil gratis di aistudio.google.com/apikey).",
      false
    );
  }
  return { apiKey };
}
```

// Aturan: pesan Indonesia jelas + cara dapat key; `INVALID_KEY` non-retryable; server-only.

### SERVICE_ORCHESTRATION

// SOURCE: `src/lib/ai/index.ts:36-72`

```ts
export async function generateForPlatforms(
  content: string,
  platforms: Platform[],
  tone: Tone,
  provider?: AIProvider
): Promise<{ outputs: GenerationOutput[]; metadata: GenerationMetadata }> {
  if (!content.trim()) {
    throw new AIError("INVALID_INPUT", "Konten kosong. Isi konten dulu.", false);
  }
  if (content.trim().length > MAX_CONTENT_CHARS) {
    /* throw INVALID_INPUT */
  }
  if (platforms.length === 0) {
    /* throw INVALID_INPUT */
  }
  const active = provider ?? getDefaultProvider();
  // ... for (const platform of platforms) { await active.generate(...) } sequential
}
```

// Aturan: validasi input di muka (fail fast, SEBELUM chain dibangun); loop sequential (aman kuota free tier); `provider` eksplisit = override untuk test (Fase 7 pertahankan perilaku ini: bila `provider` diisi, pakai langsung TANPA fallback).

### ERROR_MAPPING

// SOURCE: `src/lib/ai/errors.ts:41-56`

```ts
export function mapProviderError(e: unknown, providerName: string): AIError {
  // 429 / "rate limit" / "quota" → RATE_LIMITED retryable
  // 401/403/api-key → INVALID_KEY non-retryable
  // 400 → INVALID_INPUT non-retryable; timeout/abort → PROVIDER_DOWN retryable
  // 404 → PROVIDER_DOWN non-retryable + server detail; 5xx/fetch-fail → PROVIDER_DOWN retryable
}
```

// Aturan: provider baru (fetch) HARUS melempar error mentah dengan `status`/`statusCode` numerik atau pesan mengandung kata kunci di atas agar mapping bekerja — JANGAN mapping manual status HTTP ke AIError sendiri.

### TEST_STRUCTURE

// SOURCE: `src/lib/ai/index.test.ts:7-14,50-51`

```ts
class FakeProvider implements AIProvider {
  readonly name = "fake";
  async generate(): Promise<AIResult> {
    return { text: this.text, tokensUsed: 42 };
  }
}
// Uji live: 1 call hemat kuota. Otomatis skip di CI / bila tanpa key.
describe.skipIf(!process.env.GOOGLE_AI_API_KEY)("generateForPlatforms (live Gemini)", () => {
```

````
// Aturan: unit test deterministik tanpa jaringan (stub `fetch` global atau FakeProvider yang throw `AIError`); live test SELALU `describe.skipIf(!process.env.<KEY>)`, 1 call, timeout 120_000.

### SERVER_ONLY_GUARD

// SOURCE: `src/lib/ai/providers/index.ts:1` + `src/lib/ai/env.ts:1`
```ts
// SERVER-ONLY — jangan impor dari Client Component.
````

// Aturan: baris komentar ini di baris 1 SETIAP file baru di `src/lib/ai/` dan `src/app/api/health/route.ts`.

---

## Files to Change

| File                                      | Action | Justification                                                                                                                                                                       |
| ----------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ai/env.ts`                       | UPDATE | Tambah `groqEnv()`, `openrouterEnv()` (pola `geminiEnv`) + `isGroqConfigured()`, `isOpenrouterConfigured()`, `isGeminiConfigured()` boolean tanpa throw untuk filter chain & status |
| `src/lib/ai/providers/groq.ts`            | CREATE | `GroqProvider` (`name = "groq-llama-3.3-70b"`), konstanta `GROQ_MODEL`, fetch OpenAI-compat, timeout 60s, `max_tokens` 1024, temp 0.7                                               |
| `src/lib/ai/providers/openrouter.ts`      | CREATE | `OpenRouterProvider` (`name = "openrouter-free"`), konstanta `OPENROUTER_MODEL = "openrouter/free"`, header `HTTP-Referer`/`X-Title`, timeout 60s                                   |
| `src/lib/ai/providers/index.ts`           | UPDATE | `getFallbackChain()`, `generateWithFallback()` (failover per call), `getProviderStatuses()`, `getDefaultProvider()` tetap (kompat)                                                  |
| `src/lib/ai/index.ts`                     | UPDATE | Pakai chain saat `provider` tidak diisi; agregasi `metadata.provider`; tanpa ubah signature                                                                                         |
| `src/lib/ai/providers/fallback.test.ts`   | CREATE | Unit chain: skip-missing-key, failover 429→sukses, fail-fast INVALID_INPUT, metadata gabungan                                                                                       |
| `src/lib/ai/providers/groq.test.ts`       | CREATE | Unit parse respons/usage + mapping 429/401 + live `skipIf` 1 call                                                                                                                   |
| `src/lib/ai/providers/openrouter.test.ts` | CREATE | Unit parse respons/usage + mapping 429/401 + live `skipIf` 1 call                                                                                                                   |
| `src/app/api/health/route.ts`             | CREATE | `GET` status provider (configured boolean saja) — monitoring minimal PRD                                                                                                            |
| `.env.example`                            | UPDATE | Komentar cara dapat `GROQ_API_KEY` (console.groq.com/keys) & `OPENROUTER_API_KEY` (openrouter.ai/keys); nilai tetap kosong                                                          |
| `README.md`                               | UPDATE | Bagian "AI Fallback (Fase 7)": isi key + urutan fallback + uji                                                                                                                      |

## NOT Building

- Perubahan UI/dashboard/form (murni backend)
- Perubahan signature `POST /api/generate` request/response (hanya nilai `metadata.provider` yang bisa baru)
- Retry-with-backoff/delay antar provider (failover langsung; sequential per platform sudah hemat kuota)
- Health dashboard UI atau uptime tracking persisten (hanya endpoint status konfigurasi + log)
- Streaming respons (open question PRD — tetap ditunda)
- Model picker per user / preferensi provider di UI (Post-MVP)
- Dependensi SDK baru (`groq-sdk`, `openai`) — sengaja fetch native agar nol-dep

---

## Step-by-Step Tasks

### Task 1: Env guards Groq/OpenRouter + isConfigured

- **ACTION**: Update `src/lib/ai/env.ts`: tambah `groqEnv()`, `openrouterEnv()`, `isGeminiConfigured()`, `isGroqConfigured()`, `isOpenrouterConfigured()`.
- **IMPLEMENT**:
  ```ts
  // SERVER-ONLY — jangan impor dari Client Component. (pertahankan baris 1)
  export function groqEnv() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new AIError(
        "INVALID_KEY",
        "Konfigurasi AI belum lengkap: isi GROQ_API_KEY di .env (ambil gratis di console.groq.com/keys).",
        false
      );
    }
    return { apiKey };
  }
  export function openrouterEnv() {
    /* sama, key OPENROUTER_API_KEY, sumber openrouter.ai/keys */
  }
  export function isGeminiConfigured(): boolean {
    return !!process.env.GOOGLE_AI_API_KEY;
  }
  export function isGroqConfigured(): boolean {
    return !!process.env.GROQ_API_KEY;
  }
  export function isOpenrouterConfigured(): boolean {
    return !!process.env.OPENROUTER_API_KEY;
  }
  ```
- **MIRROR**: ENV_GUARD (`src/lib/ai/env.ts:5-17`)
- **IMPORTS**: `./errors` (`AIError`) — sudah ada
- **GOTCHA**: `is*Configured` TIDAK boleh throw (dipakai filter chain). Jangan pakai prefix `NEXT_PUBLIC_` (key server-only, cek `.env.example:14`).
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: GroqProvider (fetch OpenAI-compatible)

- **ACTION**: Buat `src/lib/ai/providers/groq.ts` mengikuti struktur `gemini.ts`.
- **IMPLEMENT**:
  ```ts
  // SERVER-ONLY — jangan impor dari Client Component (API key ikut ter-bundle).
  import { AIError, mapProviderError } from "../errors";
  import type { AIProvider, AIResult, GenerateArgs } from "../types";
  import { groqEnv } from "../env";
  import { buildPrompt } from "../prompts";

  export const GROQ_MODEL = "llama-3.3-70b-versatile";
  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
  const TIMEOUT_MS = 60_000; // paritas Gemini
  const MAX_TOKENS = 1024;
  const TEMPERATURE = 0.7;

  function estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  export class GroqProvider implements AIProvider {
    readonly name = "groq-llama-3.3-70b";
    async generate({ content, platform, tone }: GenerateArgs): Promise<AIResult> {
      const prompt = buildPrompt(content, platform, tone);
      const { apiKey } = groqEnv();
      try {
        const res = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            temperature: TEMPERATURE,
            max_tokens: MAX_TOKENS,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) {
          // Lempar agar mapProviderError memetakan via status/pesan:
          throw Object.assign(
            new Error(
              `Groq request failed: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300)
            ),
            { status: res.status }
          );
        }
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
        };
        const text = json.choices?.[0]?.message?.content?.trim();
        if (!text)
          throw new AIError("PROVIDER_DOWN", "Provider AI mengembalikan respons kosong.", true);
        const u = json.usage;
        const tokensUsed =
          (u?.total_tokens ?? (u?.prompt_tokens ?? 0) + (u?.completion_tokens ?? 0) > 0)
            ? (u?.total_tokens ?? (u!.prompt_tokens ?? 0) + (u!.completion_tokens ?? 0))
            : estimateTokens(prompt + text);
        return { text, tokensUsed };
      } catch (e) {
        if (e instanceof AIError) throw e;
        throw mapProviderError(e, this.name);
      }
    }
  }
  ```
  Sederhanakan ekspresi `tokensUsed` agar lolos lint (hindari `??` + `>` ambigu): hitung eksplisit dengan `if`.
- **MIRROR**: PROVIDER_IMPLEMENTATION + ERROR_MAPPING
- **IMPORTS**: `../errors`, `../types`, `../env`, `../prompts` — tanpa dep baru
- **GOTCHA**: (1) Baca body error via `await res.text()` SEBELUM throw agar pesan mengandung "rate limit"/"quota"/"api key" bila server mengirimnya — penting untuk mapping. (2) JANGAN kirim `logprobs`/`logit_bias`/`n` (Groq 400). (3) `name` prefix `groq-` agar log jelas provider mana gagal.
- **VALIDATE**: `npx tsc --noEmit; npm run lint`

### Task 3: OpenRouterProvider (fetch + atribusi header)

- **ACTION**: Buat `src/lib/ai/providers/openrouter.ts` — mirror Task 2 dengan URL/header/model berbeda.
- **IMPLEMENT**: Sama seperti Groq kecuali:
  ```ts
  export const OPENROUTER_MODEL = "openrouter/free";
  const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
  readonly name = "openrouter-free";
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": process.env.NEXT_PUBLIC_APP_NAME ?? "OneCast",
  }
  ```
  Body & parsing respons identik (OpenAI-style `choices[0].message.content` + `usage.total_tokens`).
- **MIRROR**: PROVIDER_IMPLEMENTATION + ERROR_MAPPING
- **IMPORTS**: `../errors`, `../types`, `../env` (`openrouterEnv`), `../prompts`
- **GOTCHA**: (1) `HTTP-Referer`/`X-Title` opsional tapi disarankan OpenRouter untuk ranking — ambil dari env publik yang sudah ada, JANGAN hardcode URL produksi. (2) `openrouter/free` non-deterministik (model acak) — itu disengaja untuk ketersediaan; catat di README. Bila butuh determinisme kelak, ganti 1 baris `OPENROUTER_MODEL` ke slug `:free` spesifik.
- **VALIDATE**: `npx tsc --noEmit; npm run lint`

### Task 4: Rantai fallback + status di providers/index.ts

- **ACTION**: Update `src/lib/ai/providers/index.ts`: tambah `getFallbackChain()`, `generateWithFallback()`, `getProviderStatuses()`; pertahankan `getDefaultProvider()`.
- **IMPLEMENT**:
  ```ts
  // SERVER-ONLY — jangan impor dari Client Component.
  import { AIError } from "../errors";
  import type { AIProvider, AIResult, GenerateArgs } from "../types";
  import { isGeminiConfigured, isGroqConfigured, isOpenrouterConfigured } from "../env";
  import { GeminiProvider } from "./gemini";
  import { GroqProvider } from ".//groq";
  import { OpenRouterProvider } from "./openrouter";

  /** Urutan fallback PRD: Gemini → Groq → OpenRouter; yang tanpa key di-skip. */
  export function getFallbackChain(): AIProvider[] {
    const chain: AIProvider[] = [];
    if (isGeminiConfigured()) chain.push(new GeminiProvider());
    if (isGroqConfigured()) chain.push(new GroqProvider());
    if (isOpenrouterConfigured()) chain.push(new OpenRouterProvider());
    return chain;
  }

  /** Failover bila provider gagal dengan kode yang layak-coba-lagi-provider-lain. */
  function shouldFailover(e: unknown): boolean {
    if (!(e instanceof AIError)) return true; // error tak dikenal dari fetch → coba lanjut
    return e.code === "RATE_LIMITED" || e.code === "PROVIDER_DOWN" || e.code === "INVALID_KEY";
    // INVALID_INPUT / UNKNOWN → fail fast, JANGAN failover (input user yang salah)
  }

  /** Coba chain berurutan; throw error TERAKHIR bila semua gagal; error input langsung throw. */
  export async function generateWithFallback(
    args: GenerateArgs,
    chain?: AIProvider[]
  ): Promise<{ result: AIResult; providerName: string }> {
    const providers = chain ?? getFallbackChain();
    if (providers.length === 0) {
      const { geminiEnv } = await import("../env");
      geminiEnv(); // throw INVALID_KEY dengan pesan jelas (tak tercapai bila key ada)
      throw new AIError("INVALID_KEY", "Konfigurasi AI belum lengkap.", false);
    }
    let lastError: unknown = null;
    for (const p of providers) {
      try {
        const result = await p.generate(args);
        return { result, providerName: p.name };
      } catch (e) {
        lastError = e;
        if (!shouldFailover(e)) throw e;
        console.warn(
          `AI fallback: provider ${p.name} gagal (${e instanceof AIError ? e.code : "unknown"}), coba berikutnya.`
        );
      }
    }
    throw lastError;
  }

  export function getProviderStatuses(): { name: string; configured: boolean }[] {
    return [
      { name: "gemini-flash", configured: isGeminiConfigured() },
      { name: "groq-llama-3.3-70b", configured: isGroqConfigured() },
      { name: "openrouter-free", configured: isOpenrouterConfigured() },
    ];
  }

  /** Kompat Fase 4/5: default tetap Gemini. */
  export function getDefaultProvider(): AIProvider {
    return new GeminiProvider();
  }
  ```
  Catatan: `console.warn` tanpa PII (hanya nama provider + kode) — konsisten gaya `console.error("generate ai error:", e.code)` di route.
- **MIRROR**: SERVICE_ORCHESTRATION (sequential, fail fast input); pola log route `src/app/api/generate/route.ts:113`
- **IMPORTS**: `../errors`, `../types`, `../env`, `./gemini`, `./groq`, `./openrouter`
- **GOTCHA**: (1) Dynamic `import("../env")` di atas hanya agar pesan key jelas — alternatif sederhana: langsung `throw new AIError("INVALID_KEY", "Konfigurasi AI belum lengkap: isi minimal satu key (GOOGLE_AI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY) di .env.", false)`. Pilih salah satu, jangan keduanya. (2) `shouldFailover` untuk `INVALID_KEY`: key provider-itu yang buruk → lanjut ke provider lain (benar). (3) JANGAN log apiKey/prompt/content.
- **VALIDATE**: `npx tsc --noEmit; npm run lint`

### Task 5: Colok chain ke generateForPlatforms + agregasi metadata

- **ACTION**: Update `src/lib/ai/index.ts`: bila `provider` eksplisit diisi → perilaku lama (tanpa fallback, untuk test); bila tidak → `generateWithFallback` per platform.
- **IMPLEMENT**:
  ```ts
  import { generateWithFallback, getDefaultProvider } from "./providers/index";
  // ... validasi input tetap di atas (tidak berubah) ...
  const started = Date.now();
  const outputs: GenerationOutput[] = [];
  const usedProviders = new Set<string>();
  let tokensUsed = 0;

  if (provider) {
    // Jalur test/override: perilaku Fase 4 persis.
    for (const platform of platforms) {
      const res = await provider.generate({ content, platform, tone });
      tokensUsed += res.tokensUsed;
      outputs.push(toOutput(platform, res.text));
    }
    usedProviders.add(provider.name);
  } else {
    for (const platform of platforms) {
      const { result, providerName } = await generateWithFallback({ content, platform, tone });
      tokensUsed += result.tokensUsed;
      outputs.push(toOutput(platform, result.text));
      usedProviders.add(providerName);
    }
  }
  return {
    outputs,
    metadata: {
      provider: [...usedProviders].join("+"),
      tokensUsed,
      generationTimeMs: Date.now() - started,
    },
  };
  ```
  Hapus `const active = provider ?? getDefaultProvider();` lama; `getDefaultProvider` tetap diimpor? Hanya bila masih dipakai — bila tidak, hapus dari import agar lint `no-unused-vars` hijau. (Ekspor `getDefaultProvider` di providers/index TETAP ada untuk kompat.)
- **MIRROR**: SERVICE_ORCHESTRATION
- **IMPORTS**: `./providers/index` (`generateWithFallback`), `./errors`, `./prompts`, `@/types/generation`
- **GOTCHA**: `metadata.provider` gabungan `"a+b"` hanya terjadi bila provider berbeda antar platform dalam 1 request — route (`route.ts:129-137`) meneruskan string apa adanya, tak perlu diubah. Post-process `toOutput`/`truncate` JANGAN diubah.
- **VALIDATE**: `npx tsc --noEmit; npm run lint`

### Task 6: Health endpoint minimal + .env.example + README

- **ACTION**: (a) Buat `src/app/api/health/route.ts`; (b) update `.env.example`; (c) update `README.md`.
- **IMPLEMENT**:
  ```ts
  // src/app/api/health/route.ts
  import { NextResponse } from "next/server";
  import { getProviderStatuses } from "@/lib/ai/providers/index";

  /** GET /api/health — status konfigurasi provider (boolean saja, tanpa secret). */
  export async function GET() {
    const providers = getProviderStatuses();
    return NextResponse.json({ success: true, providers });
  }
  ```
  `.env.example` — di bawah `GROQ_API_KEY=` / `OPENROUTER_API_KEY=` tambah komentar:
  ```
  # GROQ_API_KEY: gratis di console.groq.com/keys (tempel mentah).
  # OPENROUTER_API_KEY: gratis di openrouter.ai/keys (tempel mentah).
  ```
  `README.md` — bagian "AI Fallback (Fase 7)": urutan `Gemini → Groq → OpenRouter`, provider tanpa key di-skip otomatis, `metadata.provider` = provider aktual, `GET /api/health` untuk cek konfigurasi, uji live hemat kuota (±3 calls total).
- **MIRROR**: SERVER_ONLY_GUARD; gaya route `src/app/api/generate/route.ts:14-16` (`NextResponse.json`)
- **IMPORTS**: `next/server`, `@/lib/ai/providers/index`
- **GOTCHA**: JANGAN kembalikan boolean terbalik / nilai key / panjang key. JANGAN ubah `route.ts` generate.
- **VALIDATE**: `npx tsc --noEmit; npm run lint`

### Task 7: Test unit + live + validasi akhir

- **ACTION**: Buat 3 file test; jalankan semua validasi.
- **IMPLEMENT**:
  - `src/lib/ai/providers/groq.test.ts`:
    - Stub `global.fetch` (`vi.stubGlobal("fetch", ...)` + `vi.unstubAllGlobals()` afterEach): respons sukses `{choices:[{message:{content:" halo "}}], usage:{total_tokens:10}}` → assert `text` ter-trim + `tokensUsed === 10`.
    - `usage` hilang → fallback estimasi `> 0`.
    - `choices` kosong → throw `PROVIDER_DOWN`.
    - `fetch` 429 dengan body `"rate limit exceeded"` → `RATE_LIMITED` retryable (assert via `mapProviderError` path — atau panggil `generate` dan expect code).
    - Live: `describe.skipIf(!process.env.GROQ_API_KEY)` 1 call twitter via `buildPrompt`-compatible args → `text` non-kosong, timeout 120_000.
  - `src/lib/ai/providers/openrouter.test.ts`: mirror Groq (header `HTTP-Referer` tak perlu diassert; cukup sukses/429/kosong + live `skipIf(!process.env.OPENROUTER_API_KEY)`).
  - `src/lib/ai/providers/fallback.test.ts`:
    - Stub provider: `flaky = {name:"flaky", generate: throws RATE_LIMITED}` + `ok = FakeProvider("ok")` → `generateWithFallback(args, [flaky, ok])` sukses `providerName === "fake"`.
    - `badInput` throw `INVALID_INPUT` pertama → expect throw `INVALID_INPUT` dan provider kedua TAK dipanggil (counter).
    - Semua gagal → throw error terakhir.
    - Chain kosong `[]` → throw `INVALID_KEY`.
    - `getFallbackChain()` dengan env kosong → `[]` (set `vi.stubEnv` kosong + `vi.unstubAllEnvs()`); dengan semua key → panjang 3 & urutan gemini→groq→openrouter.
    - `generateForPlatforms` dengan FakeProvider eksplisit → metadata.provider `"fake"` (regresi Task 5).
- **MIRROR**: TEST_STRUCTURE (`src/lib/ai/index.test.ts`, `src/lib/ai/errors.test.ts`)
- **IMPORTS**: `vitest` (`describe, expect, it, vi, afterEach`)
- **GOTCHA**: (1) Stub `fetch` WAJIB di-restore (`afterEach vi.unstubAllGlobals`) agar test lain tak bocor. (2) Live test total ≤3 calls (1/provider) — hemat kuota free tier. (3) JANGAN assert nilai token live (flaky) — cukup `> 0` untuk Groq/Gemini; OpenRouter free `usage` kadang 0 → assert `>= 0`.
- **VALIDATE**:
  ```bash
  npx tsc --noEmit
  npm run lint
  npm test
  npx prettier --check .
  npm run build
  ```

---

## Testing Strategy

### Unit Tests

| Test                         | Input                                       | Expected Output                         | Edge Case? |
| ---------------------------- | ------------------------------------------- | --------------------------------------- | ---------- |
| Groq sukses + usage          | stub fetch 200 `{content, total_tokens:10}` | `{text ter-trim, tokensUsed:10}`        | —          |
| Groq tanpa usage             | stub 200 tanpa `usage`                      | `tokensUsed = ceil(len/4)`              | Ya         |
| Groq choices kosong          | stub 200 `{choices:[]}`                     | throw `PROVIDER_DOWN`                   | Ya         |
| Groq 429                     | stub 429 body rate-limit                    | `RATE_LIMITED`, retryable               | Ya         |
| Groq 401                     | stub 401 body api-key                       | `INVALID_KEY`, non-retryable            | Ya         |
| OpenRouter sukses/429/kosong | mirror Groq                                 | mirror Groq                             | Ya         |
| Failover 429→sukses          | `[flaky429, ok]`                            | sukses, `providerName` = fallback       | Ya         |
| Fail-fast input              | `[badInput(INVALID_INPUT), ok]`             | throw `INVALID_INPUT`, ok tak dipanggil | Ya         |
| Semua down                   | `[down, down]`                              | throw error terakhir                    | Ya         |
| Chain kosong                 | `[]`                                        | throw `INVALID_KEY`                     | Ya         |
| Urutan chain                 | semua key set                               | `[gemini, groq, openrouter]`            | —          |
| Regresi override             | `generateForPlatforms(..., fake)`           | `metadata.provider === "fake"`          | —          |

### Live Tests (skip tanpa key, 1 call/provider)

| Test                    | Input                 | Expected Output | Edge Case? |
| ----------------------- | --------------------- | --------------- | ---------- |
| Groq live twitter       | konten sample, casual | teks non-kosong | — (skip)   |
| OpenRouter live twitter | konten sample, casual | teks non-kosong | — (skip)   |

### Edge Cases Checklist

- [ ] Tanpa key sama sekali → `INVALID_KEY` jelas (bukan crash fetch)
- [ ] Hanya 1 key (mis. Groq) → chain panjang 1, generate sukses
- [ ] Gemini 429 + Groq OK → hasil sukses, `metadata.provider` fallback
- [ ] INVALID_INPUT (kosong/>5000 char/0 platform) → throw sebelum network call
- [ ] `response.text`/choices kosong → `PROVIDER_DOWN`
- [ ] Timeout 60s → `PROVIDER_DOWN` retryable via `mapProviderError`
- [ ] Model pensiun 404 → `PROVIDER_DOWN` non-retryable + failover ke berikut
- [ ] Tanpa PII/secret di log (hanya nama provider + kode)

---

## Validation Commands

### Static Analysis

```bash
npx tsc --noEmit
```

EXPECT: Zero type errors

### Lint

```bash
npm run lint
```

EXPECT: Zero errors/warnings baru

### Unit Tests

```bash
npm test
```

EXPECT: Semua test hijau; live test skip beralasan bila tanpa key (`±3` live calls bila key ada)

### Format

```bash
npx prettier --check .
```

EXPECT: Semua file format bersih (jalankan `npx prettier --write` pada file yang diubah bila perlu)

### Build

```bash
npm run build
```

EXPECT: Build sukses tanpa error

### Manual Validation

- [ ] `GET /api/health` → `{success:true, providers:[{name,configured}×3]}` tanpa secret
- [ ] Cabut `GOOGLE_AI_API_KEY` sementara → generate sukses via Groq/OpenRouter
- [ ] `grep -r "NEXT_PUBLIC.*API_KEY" src .env.example` → tidak ada key server di client
- [ ] `grep -rn "groq-sdk\|from \"openai\"" src package.json` → tidak ada dep baru
- [ ] Kuota dipakai ≤3 live calls selama implementasi
- [ ] `metadata.provider` di respons `/api/generate` = provider aktual

---

## Acceptance Criteria

- [ ] `GroqProvider` + `OpenRouterProvider` implement `AIProvider`, pakai `buildPrompt`
- [ ] Env guards + `is*Configured` tanpa throw
- [ ] `getFallbackChain` urutan Gemini → Groq → OpenRouter, skip tanpa key
- [ ] `generateWithFallback` failover `RATE_LIMITED`/`PROVIDER_DOWN`/`INVALID_KEY`, fail-fast `INVALID_INPUT`/`UNKNOWN`
- [ ] `generateForPlatforms` signature kompatibel; override eksplisit tanpa fallback; metadata agregasi
- [ ] `GET /api/health` tanpa bocor secret
- [ ] Unit test hijau; live test hijau/skip beralasan
- [ ] Semua validation commands hijau
- [ ] Success signal PRD: matikan/throttle Gemini → sistem otomatis pakai Groq/OpenRouter

## Completion Checklist

- [ ] Komentar `// SERVER-ONLY` di tiap file baru
- [ ] Konstanta model 1 baris (`GROQ_MODEL`, `OPENROUTER_MODEL`)
- [ ] Tanpa secret/PII di kode/log (`console.warn` hanya nama + kode)
- [ ] Timeout 60s / temp 0.7 / max_tokens 1024 paritas antar provider
- [ ] `.env.example` + `README.md` diperbarui
- [ ] Tanpa dependensi npm baru
- [ ] Tanpa perubahan UI dan signature API
- [ ] Self-contained — tanpa pertanyaan saat implementasi

## Risks

| Risk                                              | Likelihood | Impact | Mitigation                                                                         |
| ------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------- |
| Slug model berubah/pensiun (Groq/OpenRouter)      | Med        | Med    | Konstanta 1 baris + `mapProviderError` 404 → failover; verifikasi via 1 live call  |
| `openrouter/free` non-deterministik / lambat      | Med        | Low    | Disengaja untuk ketersediaan; dokumentasikan; gampang pin ke slug `:free` spesifik |
| Free tier Groq 429 saat uji                       | Med        | Low    | Live test 1 call/provider + `skipIf`; unit test tanpa jaringan sebagai bukti utama |
| `usage.total_tokens` 0/absen di free model        | Med        | Low    | Fallback estimasi `len/4` (pola Gemini)                                            |
| `AbortSignal.timeout` tak tersedia di runtime tua | Low        | Low    | Node 18+ (Next 15 mensyaratkan); paritas dengan Gemini yang sudah pakai            |
| Scope creep (dashboard monitoring)                | Low        | Med    | Kunci: hanya `GET /api/health` boolean + log; tolak tracking persisten             |

## Notes

- Keputusan arsitektur: **fetch native, nol-dep** (bukan `groq-sdk`/`openai`) — kedua API OpenAI-compatible; mengurangi surface instalasi solo-dev; pola error tetap lewat `mapProviderError` via `{status}`.
- Alternatif ditolak: (a) SDK resmi per provider — tambah 2 dep untuk 1 POST sederhana; (b) paralel fan-out ke semua provider — boros kuota free tier, berlawanan dengan prinsip sequential Fase 4/5; (c) retry-backoff antar provider — menambah latensi tanpa nilai (provider lain langsung dicoba).
- Granularitas failover = **per platform call** (bukan per request): bila Gemini gagal di platform ke-2, hanya platform itu yang fallback; `metadata.provider` gabungan `"a+b"` menandakan campuran.
- `INVALID_KEY` di-failover (key provider-itu yang buruk, provider lain mungkin valid); `INVALID_INPUT` tidak (input user salah — retry ke provider lain sia-sia dan boros kuota).
- Fase 8 kelak memakai test file ini sebagai basis (unit provider + chain sudah ada).
