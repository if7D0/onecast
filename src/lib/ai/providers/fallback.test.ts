import { afterEach, describe, expect, it, vi } from "vitest";
import { AIError } from "../errors";
import { generateForPlatforms } from "../index";
import type { AIProvider, AIResult, GenerateArgs } from "../types";
import { generateWithFallback, getFallbackChain } from "./index";

const ARGS: GenerateArgs = { content: "Konten sample.", platform: "twitter", tone: "casual" };

/** Provider palsu deterministik — tanpa jaringan, tanpa biaya. */
class FakeProvider implements AIProvider {
  readonly name = "fake";
  constructor(private readonly text: string = "Hasil palsu untuk pengujian.") {}
  async generate(): Promise<AIResult> {
    return { text: this.text, tokensUsed: 42 };
  }
}

/** Selalu gagal dengan kode tertentu. */
class FailingProvider implements AIProvider {
  readonly name: string;
  calls = 0;
  constructor(
    name: string,
    private readonly code: "RATE_LIMITED" | "PROVIDER_DOWN" | "INVALID_KEY" | "INVALID_INPUT"
  ) {
    this.name = name;
  }
  async generate(): Promise<AIResult> {
    this.calls += 1;
    throw new AIError(this.code, `gagal ${this.code}`, this.code !== "INVALID_INPUT");
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("generateWithFallback", () => {
  it("failover 429 → sukses di provider berikutnya", async () => {
    const flaky = new FailingProvider("flaky", "RATE_LIMITED");
    const { result, providerName } = await generateWithFallback(ARGS, [
      flaky,
      new FakeProvider("ok"),
    ]);
    expect(result.text).toBe("ok");
    expect(providerName).toBe("fake");
    expect(flaky.calls).toBe(1);
  });

  it("fail-fast INVALID_INPUT: provider kedua tak dipanggil", async () => {
    const bad = new FailingProvider("bad", "INVALID_INPUT");
    const second = new FakeProvider("ok");
    const secondSpy = vi.spyOn(second, "generate");
    await expect(generateWithFallback(ARGS, [bad, second])).rejects.toThrow(/gagal INVALID_INPUT/);
    expect(secondSpy).not.toHaveBeenCalled();
    expect(bad.calls).toBe(1);
  });

  it("onFallback dipanggil tiap pindah provider (tanpa PII)", async () => {
    const calls: [string, string][] = [];
    const { providerName } = await generateWithFallback(
      ARGS,
      [new FailingProvider("flaky", "RATE_LIMITED"), new FakeProvider("ok")],
      (name, code) => calls.push([name, code])
    );
    expect(providerName).toBe("fake");
    expect(calls).toEqual([["flaky", "RATE_LIMITED"]]);
  });

  it("semua gagal → throw error terakhir", async () => {
    const first = new FailingProvider("first", "PROVIDER_DOWN");
    const second = new FailingProvider("second", "RATE_LIMITED");
    const err = await generateWithFallback(ARGS, [first, second]).catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect((err as AIError).code).toBe("RATE_LIMITED");
  });

  it("chain kosong → INVALID_KEY jelas", async () => {
    const err = await generateWithFallback(ARGS, []).catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect((err as AIError).code).toBe("INVALID_KEY");
  });
});

describe("getFallbackChain", () => {
  it("tanpa key → chain kosong", () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(getFallbackChain()).toHaveLength(0);
  });

  it("semua key → urutan gemini → groq → openrouter", () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "x");
    vi.stubEnv("GROQ_API_KEY", "x");
    vi.stubEnv("OPENROUTER_API_KEY", "x");
    expect(getFallbackChain().map((p) => p.name)).toEqual([
      "gemini-flash",
      "groq-gpt-oss-120b",
      "openrouter-free",
    ]);
  });

  it("satu key → chain panjang 1", () => {
    vi.stubEnv("GOOGLE_AI_API_KEY", "");
    vi.stubEnv("GROQ_API_KEY", "x");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(getFallbackChain().map((p) => p.name)).toEqual(["groq-gpt-oss-120b"]);
  });
});

describe("generateForPlatforms (regresi override)", () => {
  it("provider eksplisit → tanpa fallback, metadata = nama provider", async () => {
    const { metadata } = await generateForPlatforms(
      "Konten sample.",
      ["twitter"],
      "casual",
      new FakeProvider()
    );
    expect(metadata.provider).toBe("fake");
  });
});
