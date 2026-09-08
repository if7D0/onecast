import { z } from "zod";

// Batas bersama — dipakai skema zod + atribut HTML form (satu sumber).
export const PASSWORD_MIN = 8;
// bcrypt (dipakai Supabase Auth) memotong diam-diam di 72 byte: tanpa max,
// dua password panjang berbeda bisa bertabrakan + input raksasa boros CPU.
export const PASSWORD_MAX = 72;
export const NAME_MAX = 100;

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .max(PASSWORD_MAX, `Password maksimal ${PASSWORD_MAX} karakter.`),
});

export const registerSchema = z
  .object({
    name: z.string().trim().max(NAME_MAX, `Nama maksimal ${NAME_MAX} karakter.`).optional(),
    email: z.string().min(1, "Email wajib diisi.").email("Format email tidak valid."),
    password: z
      .string()
      .min(PASSWORD_MIN, `Password minimal ${PASSWORD_MIN} karakter.`)
      .max(PASSWORD_MAX, `Password maksimal ${PASSWORD_MAX} karakter.`),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
