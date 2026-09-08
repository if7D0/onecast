import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("meloloskan sampai batas lalu menolak", () => {
    const key = `t1-${Date.now()}`;
    expect(checkRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(true);
    expect(checkRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(true);
    expect(checkRateLimit(key, { max: 2, windowMs: 60_000 })).toBe(false);
  });

  it("kunci berbeda independen", () => {
    const a = `a-${Date.now()}`;
    const b = `b-${Date.now()}`;
    expect(checkRateLimit(a, { max: 1 })).toBe(true);
    expect(checkRateLimit(a, { max: 1 })).toBe(false);
    expect(checkRateLimit(b, { max: 1 })).toBe(true);
  });

  it("membuka lagi setelah jendela lewat", () => {
    vi.useFakeTimers();
    const key = `t3-${Date.now()}`;
    expect(checkRateLimit(key, { max: 1, windowMs: 1_000 })).toBe(true);
    expect(checkRateLimit(key, { max: 1, windowMs: 1_000 })).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(checkRateLimit(key, { max: 1, windowMs: 1_000 })).toBe(true);
  });
});
