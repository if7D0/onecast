// SERVER-ONLY — jangan impor dari Client Component (API key ikut ter-bundle).

import type { AIProvider, AIResult, GenerateArgs } from "../types";
import { openrouterEnv } from "../env";
import { chatCompletions } from "./openai-compatible";

/**
 * Router model gratis resmi OpenRouter (non-deterministik — dipilih acak dari
 * model gratis yang mendukung request). Ganti ke slug `:free` spesifik bila
 * butuh determinisme, mis. "meta-llama/llama-3.3-70b-instruct:free".
 */
export const OPENROUTER_MODEL = "openrouter/free";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter-free";

  async generate(args: GenerateArgs): Promise<AIResult> {
    const { apiKey } = openrouterEnv();
    return chatCompletions(args, apiKey, {
      name: this.name,
      url: OPENROUTER_URL,
      model: OPENROUTER_MODEL,
      extraHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_APP_NAME ?? "OneCast",
      },
    });
  }
}
