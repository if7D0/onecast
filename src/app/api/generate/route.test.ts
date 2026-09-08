import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { generateForPlatforms } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/helpers";
import { recentGenerationUsage, saveGenerations } from "@/lib/db/queries";
import { POST } from "./route";

vi.mock("@/lib/auth/helpers", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/ai", () => ({ generateForPlatforms: vi.fn() }));
vi.mock("@/lib/db/queries", () => ({
  GENERATE_LIMIT_PER_HOUR: 5,
  GENERATE_LIMIT_WINDOW_MS: 3_600_000,
  recentGenerationUsage: vi.fn(),
  saveGenerations: vi.fn(),
}));

const mockUser = { id: "user-1" };
// Mock tipe longgar: getCurrentUser asli kembalikan SupabaseClient + User penuh.
function mockAuth(user: unknown) {
  vi.mocked(getCurrentUser).mockResolvedValue({ supabase: {}, user } as never);
}
const body = { content: "Konten.", platforms: ["twitter"], tone: "casual" };

function req(payload: unknown) {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  mockAuth(mockUser);
  vi.mocked(recentGenerationUsage).mockResolvedValue({ count: 0, oldest: null });
  vi.mocked(saveGenerations).mockResolvedValue(1);
  vi.mocked(generateForPlatforms).mockResolvedValue({
    outputs: [{ platform: "twitter", title: "t", body: "hasil" }],
    metadata: { provider: "fake", tokensUsed: 10, generationTimeMs: 5 },
  });
});

describe("POST /api/generate", () => {
  it("401 bila anonim", async () => {
    mockAuth(null);
    const res = await POST(req(body));
    expect(res.status).toBe(401);
    expect((await res.json()).success).toBe(false);
  });

  it("400 bila body tak valid", async () => {
    const res = await POST(req({ content: "", platforms: [], tone: "x" }));
    expect(res.status).toBe(400);
  });

  it("429 + Retry-After bila limit habis, tanpa panggil AI", async () => {
    vi.mocked(recentGenerationUsage).mockResolvedValue({ count: 5, oldest: new Date() });
    const res = await POST(req(body));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    expect(generateForPlatforms).not.toHaveBeenCalled();
  });

  it("200 + simpan saat sukses", async () => {
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.twitter.variations[0].text).toBe("hasil");
    expect(saveGenerations).toHaveBeenCalledTimes(1);
  });

  it("tetap 200 bila simpan gagal", async () => {
    vi.mocked(saveGenerations).mockRejectedValue(new Error("db down"));
    const res = await POST(req(body));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });
});
