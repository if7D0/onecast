import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("200 + tiga provider boolean, tanpa secret", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      success: boolean;
      providers: { name: string; configured: boolean }[];
    };
    expect(json.success).toBe(true);
    expect(json.providers.map((p) => p.name)).toEqual([
      "gemini-flash",
      "groq-gpt-oss-120b",
      "openrouter-free",
    ]);
    for (const p of json.providers) {
      expect(typeof p.configured).toBe("boolean");
    }
    expect(JSON.stringify(json).toLowerCase()).not.toContain("key");
  });
});
