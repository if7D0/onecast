// Server-side ONLY — JANGAN diimpor dari Client Component.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

export async function createClient() {
  const { url, anon } = supabaseEnv();
  const cookieStore = await cookies(); // Next 15: WAJIB await
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component — abaikan, middleware yang me-refresh sesi.
        }
      },
    },
  });
}
