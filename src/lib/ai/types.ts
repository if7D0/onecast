// SERVER-ONLY — jangan impor dari Client Component (kunci API ikut ter-bundle).
// Kontrak provider AI. Fase 4: Gemini. Fase 7: tambah Groq/OpenRouter yang
// mengimplementasikan interface yang sama + rantai fallback di providers/index.

import type { Platform, Tone } from "@/types/generation";

export interface GenerateArgs {
  content: string;
  platform: Platform;
  tone: Tone;
}

export interface AIResult {
  /** Teks mentah dari model (belum post-process). */
  text: string;
  tokensUsed: number;
}

export interface AIProvider {
  /** Nama untuk metadata + log, mis. "gemini-flash". */
  readonly name: string;
  generate(args: GenerateArgs): Promise<AIResult>;
}
