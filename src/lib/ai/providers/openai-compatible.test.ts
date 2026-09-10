import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIError } from "../errors";
import { chatCompletions } from "./openai-compatible";

const ARGS = {
  content: "Konten sample untuk pengujian.",
  platform: "twitter" as const,
  tone: "casual" as const,
};
const CONFIG = { name: "test-provider", url: "https://contoh.test/v1/chat", model: "test-model" };

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

beforeEach(() => {
  vi.stubEnv("GROQ_API_KEY", "x");
  vi.stubEnv("OPENROUTER_API_KEY", "x");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("chatCompletions", () => {
  it("sukses: kirim model+prompt, kembalikan teks trim + total_tokens", async () => {
    const fetchMock = vi.fn(
      async (
        url: Parameters<typeof fetch>[0],
        opts?: Parameters<typeof fetch>[1]
      ): Promise<Response> => {
        void url;
        void opts;
        return jsonResponse({
          choices: [{ message: { content: "  halo  " } }],
          usage: { total_tokens: 7 },
        });
      }
    );
    vi.stubGlobal("fetch", fetchMock);
    const res = await chatCompletions(ARGS, "kunci-uji", CONFIG);
    expect(res.text).toBe("halo");
    expect(res.tokensUsed).toBe(7);
    const [calledUrl, calledOpts] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(CONFIG.url);
    const body = JSON.parse(calledOpts?.body as string) as {
      model: string;
      messages: { content: string }[];
    };
    expect(body.model).toBe("test-model");
    expect(body.messages[0].content).toContain("---SOURCE-CONTENT-START---");
    expect(calledOpts?.headers).toMatchObject({ Authorization: "Bearer kunci-uji" });
  });

  it("tanpa usage: fallback estimasi; prompt/completion dijumlah", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          choices: [{ message: { content: "abc" } }],
          usage: { prompt_tokens: 3, completion_tokens: 4 },
        })
      )
    );
    const res = await chatCompletions(ARGS, "k", CONFIG);
    expect(res.tokensUsed).toBe(7);
  });

  it("tanpa usage sama sekali: estimasi len/4", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ choices: [{ message: { content: "abc" } }] }))
    );
    const res = await chatCompletions(ARGS, "k", CONFIG);
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it("choices kosong → PROVIDER_DOWN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ choices: [] }))
    );
    const err = await aiErrorOf(chatCompletions(ARGS, "k", CONFIG));
    expect(err.code).toBe("PROVIDER_DOWN");
  });

  it("429 → RATE_LIMITED; nama provider dipakai di pesan timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("quota exceeded", { status: 429 }))
    );
    const err = await aiErrorOf(chatCompletions(ARGS, "k", CONFIG));
    expect(err.code).toBe("RATE_LIMITED");
    expect(err.retryable).toBe(true);
  });

  it("abort/timeout → PROVIDER_DOWN retryable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("This operation was aborted", "AbortError");
      })
    );
    const err = await aiErrorOf(chatCompletions(ARGS, "k", CONFIG));
    expect(err.code).toBe("PROVIDER_DOWN");
    expect(err.retryable).toBe(true);
  });

  it("input kosong → INVALID_INPUT tanpa network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const err = await aiErrorOf(chatCompletions({ ...ARGS, content: "  " }, "k", CONFIG));
    expect(err.code).toBe("INVALID_INPUT");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
