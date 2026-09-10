import { Skeleton } from "@/components/ui/skeleton";

/** Boundary streaming history: skeleton daftar, tanpa fetch data. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-live="polite" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <p className="sr-only">Memuat riwayat…</p>
    </div>
  );
}
