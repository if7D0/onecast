import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { deleteGeneration } from "@/lib/db/queries";
import { DELETE } from "./route";

vi.mock("@/lib/auth/helpers", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/db/queries", () => ({ deleteGeneration: vi.fn() }));

const mockUser = { id: "user-1" };
// Mock tipe longgar: getCurrentUser asli kembalikan SupabaseClient + User penuh.
function mockAuth(user: unknown) {
  vi.mocked(getCurrentUser).mockResolvedValue({ supabase: {}, user } as never);
}

function req() {
  return new NextRequest("http://localhost/api/history/gen-1", { method: "DELETE" });
}

// Next 15: params adalah Promise.
function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  mockAuth(mockUser);
  vi.mocked(deleteGeneration).mockResolvedValue(true);
});

describe("DELETE /api/history/[id]", () => {
  it("401 bila anonim", async () => {
    mockAuth(null);
    const res = await DELETE(req(), params("gen-1"));
    expect(res.status).toBe(401);
  });

  it("400 bila ID ngawur (tanpa kena DB)", async () => {
    const res = await DELETE(req(), params("x".repeat(101)));
    expect(res.status).toBe(400);
    expect(deleteGeneration).not.toHaveBeenCalled();
  });

  it("200 + success saat terhapus", async () => {
    const res = await DELETE(req(), params("gen-1"));
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
    expect(deleteGeneration).toHaveBeenCalledWith("user-1", "gen-1");
  });

  it("404 seragam bila tak ada/bukan milik", async () => {
    vi.mocked(deleteGeneration).mockResolvedValue(false);
    const res = await DELETE(req(), params("gen-1"));
    expect(res.status).toBe(404);
  });

  it("500 bila DB gagal", async () => {
    vi.mocked(deleteGeneration).mockRejectedValue(new Error("db down"));
    const res = await DELETE(req(), params("gen-1"));
    expect(res.status).toBe(500);
  });
});
