import { z } from "zod";
import { MAX_CONTENT_CHARS } from "@/lib/ai/prompts";
import { PLATFORMS, TONES } from "@/types/generation";

/** Body POST /api/generate. Dedupe platform agar tak diproses ganda. */
export const generateRequestSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Konten wajib diisi.")
    .max(MAX_CONTENT_CHARS, `Konten maksimal ${MAX_CONTENT_CHARS} karakter.`),
  platforms: z
    .array(z.enum(PLATFORMS))
    .min(1, "Pilih minimal 1 platform.")
    .max(4, "Maksimal 4 platform.")
    .transform((arr) => [...new Set(arr)]),
  tone: z.enum(TONES),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
