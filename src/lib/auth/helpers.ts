import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Session + user saat ini (server). Kembalikan juga client bila perlu query. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Pakai di Server Component terproteksi. Redirect ke /login bila anonim. */
export async function requireUser() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login");
  return { supabase, user };
}
