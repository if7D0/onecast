// SERVER-ONLY — jangan impor dari Client Component (API key ikut ter-bundle).

import type { AIProvider, AIResult, GenerateArgs } from "../types";
import { groqEnv } from "../env";
import { chatCompletions } from "./openai-compatible";

/** Model default. OpenAI-compatible via https://api.groq.com/openai/v1. Ganti 1 baris bila perlu. */
export const GROQ_MODEL = "openai/gpt-oss-120b";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export class GroqProvider implements AIProvider {
  readonly name = "groq-gpt-oss-120b";

  async generate(args: GenerateArgs): Promise<AIResult> {
    const { apiKey } = groqEnv();
    return chatCompletions(args, apiKey, {
      name: this.name,
      url: GROQ_URL,
      model: GROQ_MODEL,
    });
  }
}
