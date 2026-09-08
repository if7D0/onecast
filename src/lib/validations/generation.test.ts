import { describe, expect, it } from "vitest";
import { MAX_CONTENT_CHARS } from "@/lib/ai/prompts";
import { generateRequestSchema } from "./generation";

const valid = {
  content: "Konten sample untuk generate.",
  platforms: ["twitter", "linkedin"],
  tone: "professional",
};

describe("generateRequestSchema", () => {
  it("menerima request valid", () => {
    const r = generateRequestSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it("menolak konten kosong / whitespace / kepanjangan", () => {
    expect(generateRequestSchema.safeParse({ ...valid, content: "" }).success).toBe(false);
    expect(generateRequestSchema.safeParse({ ...valid, content: "   " }).success).toBe(false);
    expect(
      generateRequestSchema.safeParse({ ...valid, content: "x".repeat(MAX_CONTENT_CHARS + 1) })
        .success
    ).toBe(false);
  });

  it("menolak platforms kosong / >4 / tak dikenal", () => {
    expect(generateRequestSchema.safeParse({ ...valid, platforms: [] }).success).toBe(false);
    expect(
      generateRequestSchema.safeParse({ ...valid, platforms: ["a", "b", "c", "d", "e"] }).success
    ).toBe(false);
    expect(generateRequestSchema.safeParse({ ...valid, platforms: ["Twitter"] }).success).toBe(
      false
    );
  });

  it("menolak tone tak dikenal", () => {
    expect(generateRequestSchema.safeParse({ ...valid, tone: "formal" }).success).toBe(false);
  });

  it("dedupe platform ganda", () => {
    const r = generateRequestSchema.safeParse({
      ...valid,
      platforms: ["twitter", "twitter", "email"],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.platforms).toEqual(["twitter", "email"]);
  });
});
