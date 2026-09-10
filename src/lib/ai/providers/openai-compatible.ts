// SERVER-ONLY — jangan impor dari Client Component (API key ikut ter-bundle).

import { AIError, mapProviderError } from "../errors";
import type { AIResult, GenerateArgs } from "../types";
import { buildPrompt } from "../prompts";

export interface OpenAICompatConfig {
  /** Nama untuk metadata + log, mis. "groq-gpt-oss-120b". */
  name: string;
  url: string;
  model: string;
  extraHeaders?: Record<string, string>;
  timeoutMs?: number;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

/**
 * POST ke endpoint chat-completions OpenAI-compatible.
 * Validasi input via buildPrompt di muka; error mentah dipetakan via
 * mapProviderError agar kode stabil (RATE_LIMITED/INVALID_KEY/dll).
 */
export async function chatCompletions(
  { content, platform, tone }: GenerateArgs,
  apiKey: string,
  config: OpenAICompatConfig
): Promise<AIResult> {
  const prompt = buildPrompt(content, platform, tone); // throw INVALID_INPUT bila buruk
  try {
    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: config.temperature ?? DEFAULT_TEMPERATURE,
        max_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
      }),
      signal: AbortSignal.timeout(config.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    if (!res.ok) {
      // Sertakan body agar mapProviderError mengenali "rate limit"/"api key".
      const detail = await res.text().catch(() => "");
      throw Object.assign(
        new Error(`${config.name} request failed: ${res.status} ${detail}`.slice(0, 300)),
        { status: res.status }
      );
    }
    const json = (await res.json()) as ChatResponse;
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new AIError("PROVIDER_DOWN", "Provider AI mengembalikan respons kosong.", true);
    }
    const usage = json.usage;
    let tokensUsed: number;
    if (usage?.total_tokens != null) {
      tokensUsed = usage.total_tokens;
    } else if (usage?.prompt_tokens != null || usage?.completion_tokens != null) {
      tokensUsed = (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0);
    } else {
      tokensUsed = estimateTokens(prompt + text);
    }
    return { text, tokensUsed };
  } catch (e) {
    if (e instanceof AIError) throw e;
    throw mapProviderError(e, config.name);
  }
}
