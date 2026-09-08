"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

export async function register(_prev: { error: string; info: string }, formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Data tidak valid.", info: "" };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");
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
}
