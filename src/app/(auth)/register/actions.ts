"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

/** Register email/password. Metadata nama disimpan untuk trigger profil. */
export async function register(_prev: { error: string; info: string }, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Data tidak valid.", info: "" };
  }

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for") ?? "anon";
  if (!checkRateLimit(`register:${ip}`, { max: 5 })) {
    return { error: "Terlalu banyak percobaan. Coba lagi semenit lagi.", info: "" };
  }

  // Origin header bisa dipalsukan client — fallback ke URL kanonis app
  // (pastikan nilainya masuk allowlist Redirect URLs di dashboard Supabase).
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? undefined;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name ?? "" },
        emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
      },
    });
    if (error) return { error: "Pendaftaran gagal. Coba email lain.", info: "" };

    // Konfirmasi email OFF → langsung punya sesi. ON → user cek inbox.
    if (data.session) {
      revalidatePath("/", "layout");
      redirect("/dashboard");
    }
    return { error: "", info: "Pendaftaran berhasil. Cek email untuk konfirmasi." };
  } catch {
    return { error: "Layanan tidak tersedia. Coba lagi nanti.", info: "" };
  }
}
