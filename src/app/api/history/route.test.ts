import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { listGenerations } from "@/lib/db/queries";
import { GET } from "./route";

vi.mock("@/lib/auth/helpers", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/db/queries", () => ({ listGenerations: vi.fn() }));

const mockUser = { id: "user-1" };
// Mock tipe longgar: getCurrentUser asli kembalikan SupabaseClient + User penuh.
function mockAuth(user: unknown) {
  vi.mocked(getCurrentUser).mockResolvedValue({ supabase: {}, user } as never);
}

function req(query = "") {
  return new NextRequest(`http://localhost/api/history${query}`, { method: "GET" });
}

const item = {
  id: "gen-1",
  input: "x".repeat(150),
  platform: "twitter",
  tone: "casual",
  outputs: [{ text: "hasil" }],
  createdAt: new Date("2026-09-08T10:00:00Z"),
};

beforeEach(() => {
  mockAuth(mockUser);
  vi.mocked(listGenerations).mockResolvedValue({ items: [item], total: 1 });
});

describe("GET /api/history", () => {
  it("401 bila anonim", async () => {
    mockAuth(null);
    const res = await GET(req());
    expect(res.status).toBe(401);
    expect((await res.json()).success).toBe(false);
  });

  it("400 bila query tak valid", async () => {
    const res = await GET(req("?page=abc"));
    expect(res.status).toBe(400);
  });

  it("200 + potong input 100 char + paginasi", async () => {
    const res = await GET(req("?page=1&limit=10"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data[0].input).toHaveLength(100);
    expect(json.pagination).toMatchObject({ page: 1, total: 1, hasMore: false });
  });

  it("500 bila DB gagal", async () => {
    vi.mocked(listGenerations).mockRejectedValue(new Error("db down"));
    const res = await GET(req());
    expect(res.status).toBe(500);
  });
});
