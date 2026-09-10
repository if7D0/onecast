import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("sitemap", () => {
  it("hanya landing dengan URL absolut", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://contoh.test");
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual(["https://contoh.test/"]);
  });
});

describe("robots", () => {
  it("allow publik, blokir api + area login, sertakan sitemap", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://contoh.test");
    const { default: robots } = await import("@/app/robots");
    const r = robots();
    expect(r.sitemap).toBe("https://contoh.test/sitemap.xml");
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(rules[0]).toMatchObject({ userAgent: "*", allow: "/" });
    expect(rules[0].disallow).toEqual(expect.arrayContaining(["/api/", "/dashboard", "/history"]));
  });
});

describe("getAppUrl", () => {
  it("tanpa skema ditambah https + tanpa trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "contoh.com/");
    const { getAppUrl } = await import("@/lib/app-url");
    expect(getAppUrl()).toBe("https://contoh.com");
  });

  it("tanpa env fallback localhost (non-produksi)", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    const { getAppUrl } = await import("@/lib/app-url");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });
});
