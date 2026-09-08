import { NextResponse, type NextRequest } from "next/server";
import { generateForPlatforms } from "@/lib/ai";
import { AIError } from "@/lib/ai/errors";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERATE_LIMIT_PER_HOUR,
  GENERATE_LIMIT_WINDOW_MS,
  countRecentGenerations,
  oldestRecentGeneration,
  saveGeneration,
} from "@/lib/db/queries";
import { generateRequestSchema } from "@/lib/validations/generation";

function fail(error: string, status: number, extra?: Record<string, number>) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

/** Map AIError ke status HTTP + pesan user. Tanpa PII di log. */
function aiErrorResponse(e: AIError) {
  switch (e.code) {
    case "INVALID_INPUT":
      return fail(e.message, 400);
    case "RATE_LIMITED":
      return NextResponse.json(
        { success: false, error: "AI sedang sibuk. Coba lagi sebentar." },
        { status: 503, headers: { "Retry-After": "60" } }
      );
    case "INVALID_KEY":
    case "PROVIDER_DOWN":
      return fail("Layanan AI sedang gangguan. Coba lagi nanti.", 502);
    default:
      return fail("Terjadi kesalahan. Coba lagi nanti.", 500);
  }
}

/**
 * POST /api/generate — auth → validasi → limit → AI → simpan → respons PRD.
 * Simpan best-effort: bila DB gagal, hasil AI tetap dikembalikan + dicatat.
 */
export async function POST(request: NextRequest) {
  const { user } = await getCurrentUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const parsed = generateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Permintaan tidak valid.", 400);
  }
  const { content, platforms, tone } = parsed.data;

  const used = await countRecentGenerations(user.id);
  if (used >= GENERATE_LIMIT_PER_HOUR) {
    const oldest = await oldestRecentGeneration(user.id);
    const retryAfterSec = oldest
      ? Math.max(60, Math.ceil((oldest.getTime() + GENERATE_LIMIT_WINDOW_MS - Date.now()) / 1000))
      : 3600;
    const minutes = Math.ceil(retryAfterSec / 60);
    return fail(
      `Batas ${GENERATE_LIMIT_PER_HOUR}x/jam tercapai. Coba lagi dalam ±${minutes} menit.`,
      429,
      { retryAfterSec }
    );
  }

  let result;
  try {
    result = await generateForPlatforms(content, platforms, tone);
  } catch (e) {
    if (e instanceof AIError) {
      console.error("generate ai error:", e.code);
      return aiErrorResponse(e);
    }
    console.error("generate unexpected error");
    return fail("Terjadi kesalahan. Coba lagi nanti.", 500);
  }

  // Simpan 1 baris/platform. Tokens dibagi rata (service hanya lapor total).
  const perPlatform = Math.round(result.metadata.tokensUsed / result.outputs.length);
  for (const o of result.outputs) {
    try {
      await saveGeneration({
        userId: user.id,
        platform: o.platform,
        tone,
        input: content,
        outputs: [{ text: o.body }],
        provider: result.metadata.provider,
        tokensUsed: perPlatform,
      });
    } catch {
      console.error("generate save failed:", o.platform);
    }
  }

  const data: Record<string, { variations: { text: string; characterCount: number }[] }> = {};
  for (const o of result.outputs) {
    data[o.platform] = {
      variations: [{ text: o.body, characterCount: o.body.length }],
    };
  }

  return NextResponse.json({
    success: true,
    data,
    metadata: {
      provider: result.metadata.provider,
      tokensUsed: result.metadata.tokensUsed,
      generationTime: `${(result.metadata.generationTimeMs / 1000).toFixed(1)}s`,
    },
  });
}
