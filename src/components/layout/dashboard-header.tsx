"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { logout } from "@/app/(dashboard)/dashboard/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { NavLinks } from "./nav-links";

export function DashboardHeader({ email }: { email: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-between border-b p-3 md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </Button>
      <span className="text-lg font-bold">OneCast</span>
      <ThemeToggle />
      {open && (
        <div className="bg-background absolute inset-x-0 top-full z-40 space-y-3 border-b p-4">
          <NavLinks onNavigate={() => setOpen(false)} />
          <p className="text-muted-foreground truncate px-3 text-sm">{email}</p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Keluar
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
