import { describe, expect, it } from "vitest";
import { mapProviderError } from "./errors";

function withStatus(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

describe("mapProviderError", () => {
  it("429 → RATE_LIMITED retryable", () => {
    const mapped = mapProviderError(withStatus("quota exceeded", 429), "gemini-flash");
    expect(mapped.code).toBe("RATE_LIMITED");
    expect(mapped.retryable).toBe(true);
  });

  it("401 → INVALID_KEY non-retryable", () => {
    const mapped = mapProviderError(withStatus("Unauthorized", 401), "x");
    expect(mapped.code).toBe("INVALID_KEY");
    expect(mapped.retryable).toBe(false);
  });

  it("400 → INVALID_INPUT (bukan kunci salah)", () => {
    const mapped = mapProviderError(withStatus("Invalid argument", 400), "x");
    expect(mapped.code).toBe("INVALID_INPUT");
    expect(mapped.message).toMatch(/sederhanakan/i);
  });

  it("AbortError/timeout → PROVIDER_DOWN retryable", () => {
    const abort = new DOMException("This operation was aborted", "AbortError");
    const mapped = mapProviderError(abort, "gemini-flash");
    expect(mapped.code).toBe("PROVIDER_DOWN");
    expect(mapped.retryable).toBe(true);
  });

  it("404 → PROVIDER_DOWN non-retryable + detail server", () => {
    const e = withStatus(
      '{"error":{"code":404,"message":"Model pensiun","status":"NOT_FOUND"}}',
      404
    );
    const mapped = mapProviderError(e, "x");
    expect(mapped.code).toBe("PROVIDER_DOWN");
    expect(mapped.retryable).toBe(false);
    expect(mapped.message).toMatch(/Model pensiun/);
  });

  it("500 → PROVIDER_DOWN retryable; tak dikenal → UNKNOWN", () => {
    expect(mapProviderError(withStatus("boom", 500), "x").retryable).toBe(true);
    const unknown = mapProviderError(new Error("aneh sekali"), "x");
    expect(unknown.code).toBe("UNKNOWN");
    expect(unknown.retryable).toBe(false);
  });
});
