import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { listGenerations } from "@/lib/db/queries";
import { parseHistoryQuery } from "@/lib/validations/history";

/** Potong input untuk daftar (DB tetap simpan penuh). */
const INPUT_PREVIEW = 100;

/**
 * GET /api/history?page&limit&platform — riwayat milik sendiri, terbaru dulu.
 */
export async function GET(request: NextRequest) {
  const { user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Silakan login dulu." }, { status: 401 });
  }

  const raw: Record<string, string | string[] | undefined> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    const prev = raw[key];
    raw[key] = prev === undefined ? value : [prev, value].flat();
  });
  const parsed = parseHistoryQuery(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Parameter tidak valid." },
      { status: 400 }
    );
  }
  const { page, limit, platform } = parsed.data;

  try {
    const { items, total } = await listGenerations(user.id, { page, limit, platform });
    return NextResponse.json({
      success: true,
      data: items.map((item) => ({
        id: item.id,
        input: item.input.slice(0, INPUT_PREVIEW),
        platform: item.platform,
        tone: item.tone,
        outputs: item.outputs,
        createdAt: item.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch {
    console.error("history list failed");
    return NextResponse.json({ success: false, error: "Gagal memuat riwayat." }, { status: 500 });
  }
}
