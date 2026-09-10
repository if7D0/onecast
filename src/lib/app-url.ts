/**
 * Basis URL app yang tervalidasi (tanpa trailing slash).
 * Terima nilai tanpa skema (`contoh.com` → `https://contoh.com`).
 * Nilai ngawur di produksi gagal cepat; di dev fallback ke localhost.
 */
export function getAppUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim();
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).origin;
  } catch {
    if (process.env.NODE_ENV === "production") {
      throw new Error(`NEXT_PUBLIC_APP_URL tidak valid: ${raw}`);
    }
    return "http://localhost:3000";
  }
}
