import "dotenv/config"; // vitest tidak auto-load .env (perlu untuk live test)
import { describe, expect, it } from "vitest";
import { generateForPlatforms } from "./index";
import { GeminiProvider } from "./providers/gemini";
import type { AIProvider, AIResult } from "./types";

/** Provider palsu deterministik — tanpa jaringan, tanpa biaya. */
class FakeProvider implements AIProvider {
  readonly name = "fake";
  constructor(private readonly text: string = "Hasil palsu untuk pengujian.") {}
  async generate(): Promise<AIResult> {
    return { text: this.text, tokensUsed: 42 };
  }
}

describe("generateForPlatforms (fake)", () => {
  it("mengembalikan output per platform + metadata", async () => {
    const { outputs, metadata } = await generateForPlatforms(
      "Konten sample.",
      ["twitter", "email"],
      "professional",
      new FakeProvider()
    );
    expect(outputs).toHaveLength(2);
    expect(outputs[0].platform).toBe("twitter");
    expect(outputs[0].title).toMatch(/hasil AI/i);
    expect(metadata.provider).toBe("fake");
    expect(metadata.tokensUsed).toBe(84);
    expect(metadata.generationTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("memotong twitter ke 280 karakter", async () => {
    const { outputs } = await generateForPlatforms(
      "x",
      ["twitter"],
      "casual",
      new FakeProvider("y".repeat(1000))
    );
    expect(outputs[0].body.length).toBeLessThanOrEqual(280);
  });

  it("menolak input kosong dan tanpa platform", async () => {
    await expect(generateForPlatforms("  ", ["twitter"], "professional")).rejects.toThrow(
      /kosong/i
    );
    await expect(generateForPlatforms("abc", [], "professional")).rejects.toThrow(/platform/i);
  });
});

// Uji live: 1 call hemat kuota. Otomatis skip di CI / bila tanpa key.
describe.skipIf(!process.env.GOOGLE_AI_API_KEY)("generateForPlatforms (live Gemini)", () => {
  it("twitter live mengembalikan teks non-kosong ≤280", async () => {
    const { outputs, metadata } = await generateForPlatforms(
      "OneCast mengubah satu konten menjadi siap-post di semua platform.",
      ["twitter"],
      "casual",
      new GeminiProvider()
    );
    expect(outputs).toHaveLength(1);
    expect(outputs[0].body.length).toBeGreaterThan(0);
    expect(outputs[0].body.length).toBeLessThanOrEqual(280);
    expect(metadata.provider).toBe("gemini-flash");
    expect(metadata.tokensUsed).toBeGreaterThan(0);
  }, 120_000);
});
