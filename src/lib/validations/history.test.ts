import { describe, expect, it } from "vitest";
import { historyQuerySchema, parseHistoryQuery } from "./history";

describe("historyQuerySchema", () => {
  it("default page 1 limit 10", () => {
    const r = historyQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ page: 1, limit: 10 });
  });

  it("coerce string query", () => {
    const r = parseHistoryQuery({ page: "2", limit: "5", platform: "twitter" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ page: 2, limit: 5, platform: "twitter" });
  });

  it("ambil elemen pertama bila array", () => {
    const r = parseHistoryQuery({ page: ["3", "9"] });
    expect(r.success && r.data.page).toBe(3);
  });

  it("menolak page 0, limit >50, platform asing", () => {
    expect(parseHistoryQuery({ page: "0" }).success).toBe(false);
    expect(parseHistoryQuery({ limit: "99" }).success).toBe(false);
    expect(parseHistoryQuery({ platform: "fb" }).success).toBe(false);
  });
});
