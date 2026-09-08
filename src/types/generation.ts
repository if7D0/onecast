// Tipe domain untuk form + hasil generate. Dipakai form, mock (Fase 3),
// dan API asli (Fase 5) — kontrak stabil antar fase.

export const PLATFORMS = ["twitter", "linkedin", "instagram", "email"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const TONES = ["professional", "casual", "witty", "inspirational"] as const;
export type Tone = (typeof TONES)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  email: "Email Newsletter",
};

export const TONE_LABELS: Record<Tone, string> = {
  professional: "Profesional",
  casual: "Santai",
  witty: "Jenaka",
  inspirational: "Inspiratif",
};

export const TONE_DESCRIPTIONS: Record<Tone, string> = {
  professional: "Formal, kredibel, cocok untuk B2B dan otoritas.",
  casual: "Hangat dan conversational seperti ngobrol.",
  witty: "Cerdas dan playful dengan twist tak terduga.",
  inspirational: "Memotivasi dengan pesan yang mengangkat.",
};

/** Bentuk hasil per platform — meniru kontrak API PRD (Fase 5). */
export interface MockResult {
  platform: Platform;
  title: string;
  body: string;
  footer?: string;
}
