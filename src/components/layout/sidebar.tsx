import Link from "next/link";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { NavLinks } from "./nav-links";

export function Sidebar({ email }: { email: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r p-4 md:flex">
      <Link href="/dashboard" className="px-3 py-2 text-xl font-bold tracking-tight">
        OneCast
      </Link>
      <div className="mt-4 flex-1">
        <NavLinks />
      </div>
      <div className="space-y-3 border-t pt-4">
        <p className="text-muted-foreground truncate px-3 text-sm" title={email}>
          {email}
        </p>
        <form action={logout}>
          <Button type="submit" variant="outline" className="w-full">
            <LogOut className="h-4 w-4" aria-hidden />
            Keluar
          </Button>
        </form>
      </div>
    </aside>
  );
}
