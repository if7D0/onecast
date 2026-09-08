// SERVER-ONLY — jangan impor dari Client Component (akses DB langsung).
// Query Generation: rate limit + simpan minimal (baca/history = Fase 6).

import { prisma } from "./client";
import type { Platform, Tone } from "@/types/generation";

/** Batas generate gratis per user per jam (PRD). */
export const GENERATE_LIMIT_PER_HOUR = 5;
export const GENERATE_LIMIT_WINDOW_MS = 3_600_000;

/** Jumlah baris Generation user dalam window (untuk rate limit). */
export async function countRecentGenerations(
  userId: string,
  windowMs = GENERATE_LIMIT_WINDOW_MS
): Promise<number> {
  return prisma.generation.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
}

/** Baris tertua dalam window (untuk hitung retryAfter). Null bila tak ada. */
export async function oldestRecentGeneration(
  userId: string,
  windowMs = GENERATE_LIMIT_WINDOW_MS
): Promise<Date | null> {
  const row = await prisma.generation.findFirst({
    where: { userId, createdAt: { gte: new Date(Date.now() - windowMs) } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  return row?.createdAt ?? null;
}

export interface SaveGenerationInput {
  userId: string;
  platform: Platform;
  tone: Tone;
  input: string;
  outputs: { text: string }[];
  provider: string;
  tokensUsed: number;
}

/** Simpan 1 baris per platform. Throw dibiarkan naik — route yang memutuskan. */
export async function saveGeneration(input: SaveGenerationInput): Promise<void> {
  await prisma.generation.create({
    data: {
      userId: input.userId,
      platform: input.platform,
      tone: input.tone,
      input: input.input,
      outputs: input.outputs,
      provider: input.provider,
      tokensUsed: input.tokensUsed,
    },
  });
}
