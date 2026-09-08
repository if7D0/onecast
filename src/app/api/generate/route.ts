import { NextResponse, type NextRequest } from "next/server";
import { generateForPlatforms, type GenerationOutput } from "@/lib/ai";
import { AIError } from "@/lib/ai/errors";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERATE_LIMIT_PER_HOUR,
  GENERATE_LIMIT_WINDOW_MS,
  recentGenerationUsage,
  saveGenerations,
} from "@/lib/db/queries";
import { generateRequestSchema } from "@/lib/validations/generation";
import type { Platform, Tone } from "@/types/generation";

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

/** Cek limit; kembalikan respons 429 bila habis, null bila boleh lanjut. */
async function checkLimit(userId: string) {
  const { count, oldest } = await recentGenerationUsage(userId);
  if (count < GENERATE_LIMIT_PER_HOUR) return null;
  const retryAfterSec = oldest
    ? Math.max(60, Math.ceil((oldest.getTime() + GENERATE_LIMIT_WINDOW_MS - Date.now()) / 1000))
    : 3600;
  const minutes = Math.ceil(retryAfterSec / 60);
  return NextResponse.json(
    {
      success: false,
      error: `Batas ${GENERATE_LIMIT_PER_HOUR}x/jam tercapai. Coba lagi dalam ±${minutes} menit.`,
      retryAfterSec,
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}

/** Simpan best-effort 1 roundtrip; gagal → catat, hasil tetap kembali. */
async function persistResults(
  userId: string,
  tone: Tone,
  content: string,
  outputs: GenerationOutput[],
  provider: string,
  tokensTotal: number
): Promise<void> {
  if (outputs.length === 0) return;
  const perPlatform = Math.max(0, Math.round(tokensTotal / outputs.length));
  try {
    await saveGenerations(
      outputs.map((o) => ({
        userId,
        platform: o.platform as Platform,
        tone,
        input: content,
        outputs: [{ text: o.body }],
        provider,
        tokensUsed: perPlatform,
      }))
    );
  } catch {
    console.error("generate save failed");
  }
}

function toPayload(outputs: GenerationOutput[]) {
  const data: Record<string, { variations: { text: string; characterCount: number }[] }> = {};
  for (const o of outputs) {
    data[o.platform] = {
      variations: [{ text: o.body, characterCount: o.body.length }],
    };
  }
  return data;
}

/**
 * POST /api/generate — auth → validasi → limit → AI → simpan → respons PRD.
 */
export async function POST(request: NextRequest) {
  const { user } = await getCurrentUser();
  if (!user) return fail("Silakan login dulu.", 401);

  const parsed = generateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Permintaan tidak valid.", 400);
  }
  const { content, platforms, tone } = parsed.data;

  const limited = await checkLimit(user.id);
  if (limited) return limited;

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

  await persistResults(
    user.id,
    tone,
    content,
    result.outputs,
    result.metadata.provider,
    result.metadata.tokensUsed
  );

  return NextResponse.json({
    success: true,
    data: toPayload(result.outputs),
    metadata: {
      provider: result.metadata.provider,
      tokensUsed: result.metadata.tokensUsed,
      generationTime: `${(result.metadata.generationTimeMs / 1000).toFixed(1)}s`,
    },
  });
}
