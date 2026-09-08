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
    // Dedupe DULU lalu batasi: ["twitter","twitter",...4 unik] tetap valid.
    .transform((arr) => [...new Set(arr)])
    .refine((arr) => arr.length <= 4, "Maksimal 4 platform."),
  tone: z.enum(TONES),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
