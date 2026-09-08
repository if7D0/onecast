// SERVER-ONLY — jangan impor dari Client Component.

import type { AIProvider } from "../types";
import { GeminiProvider } from "./gemini";

/**
 * Provider default. Fase 4: selalu Gemini.
 * Fase 7: kembalikan rantai fallback (Gemini → Groq → OpenRouter).
 */
export function getDefaultProvider(): AIProvider {
  return new GeminiProvider();
}
