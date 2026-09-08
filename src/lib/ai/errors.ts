// SERVER-ONLY — jangan impor dari Client Component.

export type AIErrorCode =
  "RATE_LIMITED" | "INVALID_KEY" | "PROVIDER_DOWN" | "INVALID_INPUT" | "UNKNOWN";

/** Error AI dengan kode mesin (untuk logika retry Fase 5/7) + pesan Indonesia (untuk user). */
export class AIError extends Error {
  constructor(
    readonly code: AIErrorCode,
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = "AIError";
  }
}

function statusOf(e: unknown): number | undefined {
  if (typeof e !== "object" || e === null) return undefined;
  const withStatus = e as { status?: unknown; statusCode?: unknown };
  if (typeof withStatus.status === "number") return withStatus.status;
  if (typeof withStatus.statusCode === "number") return withStatus.statusCode;
  const err = (e as { error?: { code?: unknown } }).error;
  if (typeof err?.code === "number") return err.code;
  return undefined;
}

function messageOf(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/** Ambil pesan server dari body JSON error SDK bila ada (mis. ApiError). */
function serverDetail(e: unknown): string {
  const msg = messageOf(e);
  const m = msg.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  return m ? m[1].slice(0, 200) : "";
}

/** Petakan error mentah SDK ke AIError. Aman dipanggil untuk error apa pun. */
export function mapProviderError(e: unknown, providerName: string): AIError {
  const msg = messageOf(e).toLowerCase();
  const status = statusOf(e);

  if (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("quota")
  ) {
    return new AIError(
      "RATE_LIMITED",
      "Batas pemakaian AI tercapai. Tunggu sebentar lalu coba lagi.",
      true
    );
  }
  if (
    status === 401 ||
    status === 403 ||
    msg.includes("api key") ||
    msg.includes("invalid key") ||
    msg.includes("unauthorized") ||
    msg.includes("permission denied")
  ) {
    return new AIError("INVALID_KEY", "Kunci API AI tidak valid. Hubungi admin.", false);
  }
  if (status === 400) {
    // 400 = argumen/model/konten ditolak — bukan kunci salah. Jangan suruh user
    // menghubungi admin untuk masalah konten.
    return new AIError(
      "INVALID_INPUT",
      "Permintaan ditolak provider AI. Coba sederhanakan konten.",
      false
    );
  }
  // Timeout/abort datang dalam banyak bentuk: DOMException beda realm (bukan
  // instanceof Error realm ini), undici "This operation was aborted", AbortError.
  // Satu cek nama + pesan mencakup semuanya.
  const errName =
    typeof (e as { name?: unknown })?.name === "string" ? (e as { name: string }).name : "";
  if (errName === "TimeoutError" || errName === "AbortError" || /abort|timed?\s?out/i.test(msg)) {
    return new AIError("PROVIDER_DOWN", `Provider ${providerName} timeout. Coba lagi.`, true);
  }
  if (status === 404) {
    const detail = serverDetail(e);
    return new AIError(
      "PROVIDER_DOWN",
      `Model AI tidak tersedia.${detail ? ` Detail: ${detail}` : ""}`,
      false
    );
  }
  if (
    (status !== undefined && status >= 500) ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("timeout")
  ) {
    return new AIError(
      "PROVIDER_DOWN",
      `Layanan AI (${providerName}) sedang gangguan. Coba lagi.`,
      true
    );
  }
  return new AIError("UNKNOWN", "Generate gagal karena kesalahan tak dikenal.", false);
}
