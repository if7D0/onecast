"use client";

import { useState } from "react";
import Link from "next/link";
import { FileWarning, Trash2 } from "lucide-react";
import { ResultCard } from "@/components/results/result-card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLATFORM_LABELS,
  PLATFORMS,
  TONE_LABELS,
  type Platform,
  type Tone,
} from "@/types/generation";

export interface HistoryEntry {
  id: string;
  input: string;
  platform: string;
  tone: string;
  text: string;
  createdAt: string;
}

const PAGE_SIZE = 10;

/** Ambil teks dari outputs JSON (guard data rusak). */
function extractText(outputs: unknown, fallback?: string): string {
  if (Array.isArray(outputs)) {
    const first = outputs[0] as { text?: unknown } | undefined;
    if (first && typeof first.text === "string") return first.text;
  }
  return typeof fallback === "string" && fallback ? fallback : "—";
}

/** Guard nilai platform/tone dari DB (abaikan data asing, jangan crash). */
function safePlatform(p: string): Platform {
  return (PLATFORMS as readonly string[]).includes(p) ? (p as Platform) : "twitter";
}

function safeTone(t: string): Tone {
  return t in TONE_LABELS ? (t as Tone) : "professional";
}

function platformLabel(p: string): string {
  return PLATFORM_LABELS[safePlatform(p)];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function HistoryList({
  initialItems,
  initialTotal,
}: {
  initialItems: HistoryEntry[];
  initialTotal: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>("all");
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const hasMore = items.length < total;

  async function fetchPage(nextPage: number, platform: string): Promise<boolean> {
    const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) });
    if (platform !== "all") params.set("platform", platform);
    try {
      const res = await fetch(`/api/history?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error ?? "Gagal memuat riwayat.");
        return false;
      }
      const mapped: HistoryEntry[] = (
        json.data as {
          id: string;
          input: string;
          platform: string;
          tone: string;
          outputs: unknown;
        }[]
      ).map((d) => ({
        id: d.id,
        input: d.input,
        platform: d.platform,
        tone: d.tone,
        text: extractText(d.outputs),
        createdAt: (d as { createdAt?: string }).createdAt ?? new Date().toISOString(),
      }));
      setItems((prev) => (nextPage === 1 ? mapped : [...prev, ...mapped]));
      setTotal(json.pagination.total);
      setPage(nextPage);
      return true;
    } catch {
      setError("Koneksi terputus. Coba lagi.");
      return false;
    }
  }

  async function handleFilter(value: string | null) {
    if (value === null) return;
    setError("");
    setFilter(value);
    setPage(1);
    await fetchPage(1, value);
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setError(json?.error ?? "Gagal menghapus.");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch {
      setError("Koneksi terputus. Coba lagi.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="history-filter" className="text-sm font-medium">
          Platform
        </label>
        <Select value={filter} onValueChange={handleFilter} disabled={loadingMore}>
          <SelectTrigger id="history-filter" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <FileWarning className="text-muted-foreground h-6 w-6" aria-hidden />
          <p className="text-sm font-medium">Belum ada riwayat</p>
          <p className="text-muted-foreground text-sm">Buat generate pertama Anda di dashboard.</p>
          <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
            Ke Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2" aria-live="polite">
          {items.map((item) => (
            <div key={item.id} className="space-y-2">
              <ResultCard
                result={{
                  platform: safePlatform(item.platform),
                  title: platformLabel(item.platform),
                  body: item.text,
                }}
                tone={safeTone(item.tone)}
                badge={formatDate(item.createdAt)}
              />
              <div className="flex items-center justify-between gap-2 px-1">
                <p
                  className="text-muted-foreground min-w-0 flex-1 truncate text-xs"
                  title={item.input}
                >
                  {item.input.slice(0, 100)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Hapus riwayat ${platformLabel(item.platform)} ${formatDate(item.createdAt)}`}
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            disabled={loadingMore}
            onClick={async () => {
              setLoadingMore(true);
              await fetchPage(page + 1, filter);
              setLoadingMore(false);
            }}
          >
            {loadingMore ? "Memuat…" : "Muat lagi"}
          </Button>
        </div>
      )}
    </div>
  );
}
