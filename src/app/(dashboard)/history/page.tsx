import { requireUser } from "@/lib/auth/helpers";
import { listGenerations } from "@/lib/db/queries";
import { HistoryList, type HistoryEntry } from "./history-list";

const PAGE_SIZE = 10;

function toEntry(item: {
  id: string;
  input: string;
  platform: string;
  tone: string;
  outputs: unknown;
  createdAt: Date;
}): HistoryEntry {
  const outputs = Array.isArray(item.outputs) ? item.outputs : [];
  const text =
    outputs.length > 0 && typeof (outputs[0] as { text?: unknown })?.text === "string"
      ? String((outputs[0] as { text: unknown }).text)
      : "—";
  return {
    id: item.id,
    input: item.input,
    platform: item.platform,
    tone: item.tone,
    text,
    createdAt: item.createdAt.toISOString(),
  };
}

export default async function HistoryPage() {
  const { user } = await requireUser();
  const first = await listGenerations(user.id, { page: 1, limit: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Riwayat</h1>
        <p className="text-muted-foreground text-sm">
          Semua hasil generate Anda. Salin yang perlu, hapus sisanya.
        </p>
      </div>
      <HistoryList initialItems={first.items.map(toEntry)} initialTotal={first.total} />
    </div>
  );
}
