"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = "bg-muted font-medium";
  const idle = "text-muted-foreground hover:text-foreground";

  return (
    <nav aria-label="Navigasi dashboard" className="flex flex-col gap-1">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        aria-current={pathname === "/dashboard" ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
          pathname === "/dashboard" ? active : idle
        )}
      >
        <PlusCircle className="h-4 w-4" aria-hidden />
        Buat Baru
      </Link>
      <span
        aria-disabled="true"
        title="Riwayat generate hadir di Fase 6"
        className="text-muted-foreground/60 flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm"
      >
        <History className="h-4 w-4" aria-hidden />
        Riwayat
        <span className="ml-auto rounded-full border px-2 py-0.5 text-xs">Segera</span>
      </span>
    </nav>
  );
}
