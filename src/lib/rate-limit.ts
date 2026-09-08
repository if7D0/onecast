// Rate limiter in-memory per kunci (IP + aksi).
// CUKUP untuk MVP satu instance; TIDAK berlaku antar instance serverless.
// Rencana: ganti Upstash Redis saat butuh limit terdistribusi (lihat README Auth).
// Selalu dipakai BERSAMA throttling bawaan Supabase Auth, bukan pengganti.

const hits = new Map<string, number[]>();

export interface RateLimitOptions {
  /** Jendela waktu (ms). Default 60 detik. */
  windowMs?: number;
  /** Maksimal percobaan per jendela. Default 10. */
  max?: number;
}

/** true = boleh lanjut; false = limit terlampaui. */
export function checkRateLimit(
  key: string,
  { windowMs = 60_000, max = 10 }: RateLimitOptions = {}
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
