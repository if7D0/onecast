import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/helpers";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await requireUser();
  const email = user.email ?? "Pengguna";

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <DashboardHeader email={email} />
      <Sidebar email={email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="hidden items-center justify-end border-b p-3 md:flex">
          <ThemeToggle />
        </div>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
