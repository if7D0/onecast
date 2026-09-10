import "dotenv/config"; // vitest tidak auto-load .env (perlu untuk live test)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIError } from "../errors";
import { OpenRouterProvider } from "./openrouter";

const ARGS = {
  content: "Konten sample untuk pengujian.",
  platform: "twitter" as const,
  tone: "casual" as const,
};

/** Tangkap AIError dari promise yang dijamin throw; lempar ulang bila bukan AIError. */
async function aiErrorOf(promise: Promise<unknown>): Promise<AIError> {
  try {
    await promise;
  } catch (e) {
    if (e instanceof AIError) return e;
    throw e;
  }
  throw new Error("expected to throw, but resolved");
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("OpenRouterProvider (stub fetch)", () => {
  beforeEach(() => {
    // Key dummy agar lolos env guard; fetch tetap di-stub per test.
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  });
  it("sukses: teks ter-trim + tokensUsed dari usage.total_tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          choices: [{ message: { content: "  halo dunia  " } }],
          usage: { total_tokens: 12 },
        })
      )
    );
    const res = await new OpenRouterProvider().generate(ARGS);
    expect(res.text).toBe("halo dunia");
    expect(res.tokensUsed).toBe(12);
  });

  it("tanpa usage: fallback estimasi len/4", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ choices: [{ message: { content: "abc" } }] }))
    );
    const res = await new OpenRouterProvider().generate(ARGS);
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it("choices kosong → PROVIDER_DOWN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ choices: [] }))
    );
    const err = await aiErrorOf(new OpenRouterProvider().generate(ARGS));
    expect(err.code).toBe("PROVIDER_DOWN");
  });

  it("429 body rate-limit → RATE_LIMITED retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limit exceeded", { status: 429 }))
    );
    const err = await aiErrorOf(new OpenRouterProvider().generate(ARGS));
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.retryable).toBe(true);
  });

  it("401 body api-key → INVALID_KEY non-retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("invalid api key", { status: 401 }))
    );
    const err = await aiErrorOf(new OpenRouterProvider().generate(ARGS));
    expect(err.code).toBe("INVALID_KEY");
    expect(err.retryable).toBe(false);
  });
});

// Uji live: 1 call hemat kuota. Otomatis skip di CI / bila tanpa key.
describe.skipIf(!process.env.OPENROUTER_API_KEY)("OpenRouterProvider (live)", () => {
  it("twitter live mengembalikan teks non-kosong", async () => {
    const res = await new OpenRouterProvider().generate(ARGS);
    expect(res.text.length).toBeGreaterThan(0);
    // Model free kadang melaporkan usage 0 — cukup non-negatif.
    expect(res.tokensUsed).toBeGreaterThanOrEqual(0);
  }, 120_000);
});
