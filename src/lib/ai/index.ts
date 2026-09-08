// SERVER-ONLY — jangan impor dari Client Component.
// Orkestrasi generate: 1 call sequential per platform (aman kuota free tier).
// Output dibentuk agar UI Fase 3/5 tak berubah: {platform,title,body,footer?}.

import { AIError } from "./errors";
import { MAX_CONTENT_CHARS } from "./prompts";
import { PLATFORM_LABELS, type MockResult, type Platform, type Tone } from "@/types/generation";
import { getDefaultProvider } from "./providers/index";
import type { AIProvider } from "./types";

export type GenerationOutput = MockResult;

export interface GenerationMetadata {
  provider: string;
  tokensUsed: number;
  generationTimeMs: number;
}

const TWITTER_MAX = 280;

function truncate(text: string, max: number): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function toOutput(platform: Platform, text: string): GenerationOutput {
  const body = platform === "twitter" ? truncate(text, TWITTER_MAX) : text.trim();
  return { platform, title: `${PLATFORM_LABELS[platform]} — hasil AI`, body };
}

/**
 * Generate untuk beberapa platform. Sequential (bukan paralel) agar tidak
 * menghantam rate limit free tier. Throw AIError bila input/provider buruk.
 */
export async function generateForPlatforms(
  content: string,
  platforms: Platform[],
  tone: Tone,
  provider?: AIProvider
): Promise<{ outputs: GenerationOutput[]; metadata: GenerationMetadata }> {
  if (!content.trim()) {
    throw new AIError("INVALID_INPUT", "Konten kosong. Isi konten dulu.", false);
  }
  // Validasi panjang di muka: gagal cepat sebelum instantiate provider/API call.
  if (content.trim().length > MAX_CONTENT_CHARS) {
    throw new AIError(
      "INVALID_INPUT",
      `Konten terlalu panjang (maks ${MAX_CONTENT_CHARS} karakter).`,
      false
    );
  }
  if (platforms.length === 0) {
    throw new AIError("INVALID_INPUT", "Pilih minimal 1 platform.", false);
  }

  const active = provider ?? getDefaultProvider();
  const started = Date.now();
  const outputs: GenerationOutput[] = [];
  let tokensUsed = 0;

  for (const platform of platforms) {
    const res = await active.generate({ content, platform, tone });
    tokensUsed += res.tokensUsed;
    outputs.push(toOutput(platform, res.text));
  }

  return {
    outputs,
    metadata: { provider: active.name, tokensUsed, generationTimeMs: Date.now() - started },
  };
}
