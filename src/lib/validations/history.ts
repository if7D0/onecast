import { z } from "zod";
import { PLATFORMS } from "@/types/generation";

/** Query GET /api/history. Terima searchParams mentah (string | string[]). */
export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Halaman minimal 1.").default(1),
  limit: z.coerce.number().int().min(1).max(50, "Maksimal 50 per halaman.").default(10),
  platform: z.enum(PLATFORMS).optional(),
});

export type HistoryQuery = z.infer<typeof historyQuerySchema>;

/** Normalisasi searchParams Next (string | string[] | undefined) → validasi. */
export function parseHistoryQuery(params: Record<string, string | string[] | undefined>) {
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return historyQuerySchema.safeParse({
    page: pick(params.page),
    limit: pick(params.limit),
    platform: pick(params.platform),
  });
}
