import { Skeleton } from "@/components/ui/skeleton";

/** Boundary streaming dashboard: skeleton form + hasil, tanpa fetch data. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-live="polite" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <p className="sr-only">Memuat dashboard…</p>
    </div>
  );
}
