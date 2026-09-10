import { NextResponse } from "next/server";
import { getProviderStatuses } from "@/lib/ai/providers/index";

/** GET /api/health — status konfigurasi provider AI (boolean saja, tanpa secret). */
export async function GET() {
  const providers = getProviderStatuses();
  return NextResponse.json({ success: true, providers });
}
