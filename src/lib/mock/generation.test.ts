import { describe, expect, it } from "vitest";
import { PLATFORMS, TONES } from "@/types/generation";
import { mockGenerate } from "./generation";

const SAMPLE =
  "AI membantu kreator mengubah satu konten menjadi banyak format dengan cepat dan konsisten.";

describe("mockGenerate", () => {
  it("menghasilkan output non-kosong untuk semua platform x tone", () => {
    for (const platform of PLATFORMS) {
      for (const tone of TONES) {
        const r = mockGenerate(SAMPLE, platform, tone);
        expect(r.title.length).toBeGreaterThan(0);
        expect(r.body.length).toBeGreaterThan(0);
        expect(r.platform).toBe(platform);
      }
    }
  });

  it("twitter tidak melebihi 280 karakter walau konten panjang", () => {
    const r = mockGenerate("x".repeat(1000), "twitter", "professional");
    expect(r.body.length).toBeLessThanOrEqual(280);
  });

  it("tone berbeda menghasilkan body berbeda", () => {
    const a = mockGenerate(SAMPLE, "linkedin", "professional");
    const b = mockGenerate(SAMPLE, "linkedin", "witty");
    expect(a.body).not.toBe(b.body);
  });

  it("email memuat subjek", () => {
    const r = mockGenerate(SAMPLE, "email", "casual");
    expect(r.body).toMatch(/subjek:/i);
  });

  it("menangani konten kosong tanpa crash", () => {
    const r = mockGenerate("   ", "instagram", "inspirational");
    expect(r.body.length).toBeGreaterThan(0);
  });
});
