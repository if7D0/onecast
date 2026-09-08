// SERVER-ONLY — jangan impor dari Client Component.

import { AIError } from "./errors";

/** Ambil API key Gemini. Gagal cepat dengan pesan jelas bila belum diisi. */
export function geminiEnv() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new AIError(
      "INVALID_KEY",
      "Konfigurasi AI belum lengkap: isi GOOGLE_AI_API_KEY di .env " +
        "(ambil gratis di aistudio.google.com/apikey).",
      false
    );
  }
  return { apiKey };
}
