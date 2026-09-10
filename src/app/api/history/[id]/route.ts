import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/helpers";
import { deleteGeneration } from "@/lib/db/queries";

// Prisma terparameterisasi (tanpa injeksi), tapi ID ngawur tak perlu kena DB.
const idSchema = z.string().trim().min(1).max(100);

/**
 * DELETE /api/history/[id] — hapus milik sendiri.
 * 404 seragam untuk tak-ada/bukan-milik (anti enumeration).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Silakan login dulu." }, { status: 401 });
  }

  const { id } = await params; // Next 15: params adalah Promise
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ success: false, error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const deleted = await deleteGeneration(user.id, id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Data tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    console.error("history delete failed");
    return NextResponse.json({ success: false, error: "Gagal menghapus." }, { status: 500 });
  }
}
