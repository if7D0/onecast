import { FileWarning } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { MockResult, Tone } from "@/types/generation";
import { ResultCard } from "./result-card";

interface ResultListProps {
  results: MockResult[];
  loading: boolean;
  tone: Tone;
  skeletonCount?: number;
}

export function ResultList({ results, loading, tone, skeletonCount = 2 }: ResultListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label="Membuat hasil…">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center">
        <FileWarning className="text-muted-foreground h-6 w-6" aria-hidden />
        <p className="text-sm font-medium">Belum ada hasil</p>
        <p className="text-muted-foreground text-sm">
          Isi konten, pilih minimal 1 platform, lalu klik Generate.
        </p>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-4 md:grid-cols-2" aria-live="polite">
      {results.map((r, i) => (
        <ResultCard key={`${r.platform}-${i}`} result={r} tone={tone} />
      ))}
    </div>
  );
}
