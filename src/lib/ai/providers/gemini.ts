// SERVER-ONLY — jangan impor dari Client Component (API key ikut ter-bundle).

import { GoogleGenAI } from "@google/genai";
import { AIError, mapProviderError } from "../errors";
import type { AIProvider, AIResult, GenerateArgs } from "../types";
import { geminiEnv } from "../env";
import { buildPrompt } from "../prompts";

/** Ganti 1 baris ini bila model default berubah. 2.5-flash pensiun untuk user baru (404). */
export const GEMINI_MODEL = "gemini-3.6-flash";

const TIMEOUT_MS = 60_000;
const MAX_OUTPUT_TOKENS = 1024;
const TEMPERATURE = 0.7;

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini-flash";

  async generate({ content, platform, tone }: GenerateArgs): Promise<AIResult> {
    const prompt = buildPrompt(content, platform, tone); // throw INVALID_INPUT bila buruk
    const { apiKey } = geminiEnv();

    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          temperature: TEMPERATURE,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS),
        },
      });
      const text = res.text?.trim();
      if (!text) {
        throw new AIError("PROVIDER_DOWN", "Provider AI mengembalikan respons kosong.", true);
      }
      const usage = res.usageMetadata;
      const tokensUsed =
        usage?.promptTokenCount != null || usage?.candidatesTokenCount != null
          ? (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0)
          : estimateTokens(prompt + text);
      return { text, tokensUsed };
    } catch (e) {
      if (e instanceof AIError) throw e;
      throw mapProviderError(e, this.name);
    }
  }
}
