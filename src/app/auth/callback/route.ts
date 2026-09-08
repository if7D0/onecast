import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

/** Menukar auth code (konfirmasi email / OAuth) menjadi sesi, lalu redirect. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const ip = request.headers.get("x-forwarded-for") ?? "anon";
  if (!checkRateLimit(`callback:${ip}`, { max: 20 })) {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }

  // Guard open-redirect: hanya path lokal (tolak //host, skema, backslash).
  let next = searchParams.get("next") ?? "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes(":") || next.includes("\\")) {
    next = "/dashboard";
  }

  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=callback`);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(`${origin}/login?error=callback`);
  } catch {
    return NextResponse.redirect(`${origin}/login?error=callback`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
