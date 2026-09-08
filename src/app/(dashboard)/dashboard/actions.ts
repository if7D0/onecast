"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Logout: hapus sesi Supabase lalu kembali ke halaman login. */
export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Gagal signOut (mis. jaringan) — tetap buang user ke login;
    // middleware akan menolak sesi yang masih tersisa.
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
