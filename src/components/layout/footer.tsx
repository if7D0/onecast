export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row sm:px-6">
        <p className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold">
            O
          </span>
          <span>© 2026 OneCast. Gratis dan open-source (MIT).</span>
        </p>
        <p className="text-muted-foreground">Stack: Next.js, Supabase, Prisma.</p>
      </div>
    </footer>
  );
}
