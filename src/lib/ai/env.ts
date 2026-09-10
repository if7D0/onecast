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

/** Ambil API key Groq. Gagal cepat dengan pesan jelas bila belum diisi. */
export function groqEnv() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new AIError(
      "INVALID_KEY",
      "Konfigurasi AI belum lengkap: isi GROQ_API_KEY di .env " +
        "(ambil gratis di console.groq.com/keys).",
      false
    );
  }
  return { apiKey };
}

/** Ambil API key OpenRouter. Gagal cepat dengan pesan jelas bila belum diisi. */
export function openrouterEnv() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AIError(
      "INVALID_KEY",
      "Konfigurasi AI belum lengkap: isi OPENROUTER_API_KEY di .env " +
        "(ambil gratis di openrouter.ai/keys).",
      false
    );
  }
  return { apiKey };
}

/** Cek konfigurasi tanpa throw — untuk filter rantai fallback & status. */
export function isGeminiConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY;
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

export function isOpenrouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}
