// SERVER-ONLY — jangan impor dari Client Component.

import { AIError } from "../errors";
import type { AIProvider, AIResult, GenerateArgs } from "../types";
import { isGeminiConfigured, isGroqConfigured, isOpenrouterConfigured } from "../env";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import { OpenRouterProvider } from "./openrouter";

/**
 * Urutan fallback PRD Fase 7: Gemini → Groq → OpenRouter.
 * Provider yang key-nya belum diisi di-skip otomatis.
 */
export function getFallbackChain(): AIProvider[] {
  const chain: AIProvider[] = [];
  if (isGeminiConfigured()) chain.push(new GeminiProvider());
  if (isGroqConfigured()) chain.push(new GroqProvider());
  if (isOpenrouterConfigured()) chain.push(new OpenRouterProvider());
  return chain;
}

/**
 * Layak coba provider berikutnya bila: RATE_LIMITED / PROVIDER_DOWN
 * (provider-ini gangguan) / INVALID_KEY (key provider-ini yang buruk,
 * provider lain mungkin valid). INVALID_INPUT / UNKNOWN → fail fast
 * (input user yang salah — retry ke provider lain sia-sia dan boros kuota).
 */
function shouldFailover(e: unknown): boolean {
  if (!(e instanceof AIError)) return true; // error tak dikenal dari fetch → coba lanjut
  return e.code === "RATE_LIMITED" || e.code === "PROVIDER_DOWN" || e.code === "INVALID_KEY";
}

/**
 * Coba chain berurutan; kembalikan hasil + nama provider yang sukses.
 * Throw error TERAKHIR bila semua gagal; error input langsung throw.
 * `onFallback` dipanggil tiap kali pindah provider (observabilitas opt-in;
 * default diam agar log serverless tidak noisy). Tanpa PII — hanya nama + kode.
 */
export async function generateWithFallback(
  args: GenerateArgs,
  chain?: AIProvider[],
  onFallback?: (providerName: string, code: string) => void
): Promise<{ result: AIResult; providerName: string }> {
  const providers = chain ?? getFallbackChain();
  if (providers.length === 0) {
    throw new AIError(
      "INVALID_KEY",
      "Konfigurasi AI belum lengkap: isi minimal satu key " +
        "(GOOGLE_AI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY) di .env.",
      false
    );
  }
  let lastError: unknown = null;
  for (const p of providers) {
    try {
      const result = await p.generate(args);
      return { result, providerName: p.name };
    } catch (e) {
      lastError = e;
      if (!shouldFailover(e)) throw e;
      onFallback?.(p.name, e instanceof AIError ? e.code : "unknown");
    }
  }
  throw lastError;
}

/** Status konfigurasi provider (boolean saja, tanpa secret) untuk /api/health. */
export function getProviderStatuses(): { name: string; configured: boolean }[] {
  return [
    { name: "gemini-flash", configured: isGeminiConfigured() },
    { name: "groq-gpt-oss-120b", configured: isGroqConfigured() },
    { name: "openrouter-free", configured: isOpenrouterConfigured() },
  ];
}

/**
 * Provider default. Kompat Fase 4/5: selalu Gemini.
 * Untuk rantai fallback, pakai getFallbackChain() + generateWithFallback().
 */
export function getDefaultProvider(): AIProvider {
  return new GeminiProvider();
}
