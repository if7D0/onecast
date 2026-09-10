import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIError } from "./errors";
import { generateForPlatforms } from "./index";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function stubSuccess(text: string, totalTokens = 11) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      jsonResponse({
        choices: [{ message: { content: text } }],
        usage: { total_tokens: totalTokens },
      })
    )
  );
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_AI_API_KEY", "");
  vi.stubEnv("OPENROUTER_API_KEY", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("generateForPlatforms wiring fallback nyata", () => {
  it("tanpa override: Gemini skip (tanpa key) → Groq sukses via fetch", async () => {
    vi.stubEnv("GROQ_API_KEY", "kunci-uji");
    stubSuccess("hasil groq");
    const { outputs, metadata } = await generateForPlatforms(
      "Konten sample.",
      ["twitter"],
      "casual"
    );
    expect(outputs).toHaveLength(1);
    expect(outputs[0].body).toBe("hasil groq");
    expect(metadata.provider).toBe("groq-gpt-oss-120b");
    expect(metadata.tokensUsed).toBe(11);
  });

  it("Groq 429 → failover OpenRouter dalam satu request", async () => {
    vi.stubEnv("GROQ_API_KEY", "kunci-uji");
    vi.stubEnv("OPENROUTER_API_KEY", "kunci-uji");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        String(url).includes("groq")
          ? new Response("rate limit exceeded", { status: 429 })
          : jsonResponse({
              choices: [{ message: { content: "hasil openrouter" } }],
              usage: { total_tokens: 5 },
            })
      )
    );
    const { outputs, metadata } = await generateForPlatforms(
      "Konten sample.",
      ["linkedin"],
      "professional"
    );
    expect(outputs[0].body).toBe("hasil openrouter");
    expect(metadata.provider).toBe("openrouter-free");
  });

  it("tanpa key sama sekali → INVALID_KEY jelas", async () => {
    const err = await generateForPlatforms("abc", ["twitter"], "casual").catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect((err as AIError).code).toBe("INVALID_KEY");
  });
});
