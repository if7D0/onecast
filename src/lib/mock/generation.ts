// Generator MOCK Fase 3 — deterministik (tanpa random/Date) agar bisa di-test.
// Fase 5: hapus pemakaian file ini, ganti fetch POST /api/generate.
// Bentuk output meniru kontrak API PRD supaya UI tak berubah saat colok AI.

import { TONE_LABELS, type MockResult, type Platform, type Tone } from "@/types/generation";

const TWITTER_MAX = 280;
const EXCERPT_SHORT = 200;
const LINKEDIN_HOOK = 120;
const INSTAGRAM_EXCERPT = 150;
const EMAIL_SUBJECT = 60;

function excerpt(content: string, max: number): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Mock deterministik; meniru POST /api/generate {platform,title,body,footer?}. Hapus di Fase 5. */
export function mockGenerate(content: string, platform: Platform, tone: Tone): MockResult {
  const toneLabel = TONE_LABELS[tone];
  const short = excerpt(content, EXCERPT_SHORT);

  switch (platform) {
    case "twitter": {
      const hook = `[${toneLabel}] ${short}`;
      return {
        platform,
        title: "X (Twitter) — contoh hasil",
        body: excerpt(hook, TWITTER_MAX),
        footer: "1/3 utas • balas untuk lanjut",
      };
    }
    case "linkedin":
      return {
        platform,
        title: "LinkedIn — contoh hasil",
        body: `Hook: ${excerpt(content, LINKEDIN_HOOK)}\n\nInsight (${toneLabel.toLowerCase()}): ${short}\n\nCTA: Bagaimana pengalaman Anda? Tulis di komentar.`,
        footer: "#konten #produktivitas",
      };
    case "instagram":
      return {
        platform,
        title: "Instagram — contoh hasil",
        body: `${excerpt(content, INSTAGRAM_EXCERPT)} ✨\n\nVersi ${toneLabel.toLowerCase()} dari konten Anda. Simpan untuk dibaca lagi.`,
        footer: "#konten #kreator #produktivitas",
      };
    case "email":
      return {
        platform,
        title: "Email Newsletter — contoh hasil",
        body: `Subjek: [${toneLabel}] ${excerpt(content, EMAIL_SUBJECT)}\n\nHalo,\n\n${short}\n\nSalam,\nTim OneCast`,
      };
  }
}
