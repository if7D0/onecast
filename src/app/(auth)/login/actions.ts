"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

/** Login email/password. Pesan error generik (anti user-enumeration). */
export async function login(_prev: { error: string }, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Email atau password tidak valid." };

  const ip = (await headers()).get("x-forwarded-for") ?? "anon";
  if (!checkRateLimit(`login:${ip}`, { max: 10 })) {
    return { error: "Terlalu banyak percobaan. Coba lagi semenit lagi." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: "Email atau password salah." };
  } catch {
    return { error: "Layanan tidak tersedia. Coba lagi nanti." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
