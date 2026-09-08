"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

export async function login(_prev: { error: string }, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Email atau password tidak valid." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Pesan generik: jangan bocorkan apakah email terdaftar (anti user-enumeration).
  if (error) return { error: "Email atau password salah." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
