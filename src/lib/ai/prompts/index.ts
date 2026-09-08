// SERVER-ONLY — jangan impor dari Client Component.

import { AIError } from "../errors";
import type { Platform, Tone } from "@/types/generation";
import {
  MAX_CONTENT_CHARS,
  emailPrompt,
  instagramPrompt,
  linkedinPrompt,
  twitterPrompt,
} from "./templates";

export { MAX_CONTENT_CHARS };

/** Susun prompt lengkap. Tolak input kosong/terlalu panjang sebelum kena API. */
export function buildPrompt(content: string, platform: Platform, tone: Tone): string {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new AIError("INVALID_INPUT", "Konten kosong. Isi konten dulu.", false);
  }
  if (trimmed.length > MAX_CONTENT_CHARS) {
    throw new AIError(
      "INVALID_INPUT",
      `Konten terlalu panjang (maks ${MAX_CONTENT_CHARS} karakter).`,
      false
    );
  }
  switch (platform) {
    case "twitter":
      return twitterPrompt(trimmed, tone);
    case "linkedin":
      return linkedinPrompt(trimmed, tone);
    case "instagram":
      return instagramPrompt(trimmed, tone);
    case "email":
      return emailPrompt(trimmed, tone);
    default:
      // Exhaustive guard: Fase 5 menerima platform dari request body user.
      throw new AIError("INVALID_INPUT", `Platform tidak dikenal: ${platform}`, false);
  }
}
