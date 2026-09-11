// SERVER-ONLY — jangan impor dari Client Component (akses DB langsung).
// Query Generation: rate limit + simpan minimal (baca/history = Fase 6).

import { prisma } from "./client";
import type { Platform, Tone } from "@/types/generation";

/** Batas generate gratis per user per jam (PRD). */
export const GENERATE_LIMIT_PER_HOUR = 5;
export const GENERATE_LIMIT_WINDOW_MS = 3_600_000;

// NOTE: rate limit non-atomic (check lalu act). Burst konkuren bisa lolos
// sedikit di atas batas — diterima untuk MVP. Butuh atomik? Pindah ke
// counter terdistribusi (Upstash/Vercel KV INCR+EXPIRE).

/**
 * Satu query untuk limit: jumlah + waktu tertua dalam window.
 * Satu roundtrip (bukan count + findFirst terpisah).
 */
export async function recentGenerationUsage(
  userId: string,
  windowMs = GENERATE_LIMIT_WINDOW_MS
): Promise<{ count: number; oldest: Date | null }> {
  const rows = await prisma.generation.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - windowMs) } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });
  return { count: rows.length, oldest: rows[0]?.createdAt ?? null };
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

/** Simpan banyak baris sekaligus (1 roundtrip). Best-effort: kembalikan jumlah tersimpan. */
export async function saveGenerations(inputs: SaveGenerationInput[]): Promise<number> {
  if (inputs.length === 0) return 0;
  const res = await prisma.generation.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      platform: input.platform,
      tone: input.tone,
      input: input.input,
      outputs: input.outputs,
      provider: input.provider,
      tokensUsed: input.tokensUsed,
    })),
  });
  return res.count;
}

export interface ListHistoryOptions {
  page?: number;
  limit?: number;
  platform?: Platform;
}

export interface HistoryItem {
  id: string;
  input: string;
  platform: string;
  tone: string;
  outputs: unknown;
  createdAt: Date;
}

/** Daftar riwayat user (terbaru dulu) + total untuk paginasi. */
export async function listGenerations(
  userId: string,
  { page = 1, limit = 10, platform }: ListHistoryOptions = {}
): Promise<{ items: HistoryItem[]; total: number }> {
  const where = { userId, ...(platform ? { platform } : {}) };
  const [items, total] = await Promise.all([
    prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, input: true, platform: true, tone: true, outputs: true, createdAt: true },
    }),
    prisma.generation.count({ where }),
  ]);
  return { items, total };
}

/**
 * Hapus 1 baris milik user. true bila terhapus; false bila tak ada/bukan milik
 * (sengaja seragam — anti enumeration kepemilikan).
 */
export async function deleteGeneration(userId: string, id: string): Promise<boolean> {
  const res = await prisma.generation.deleteMany({ where: { id, userId } });
  return res.count > 0;
}
