import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth/helpers";
import { buttonVariants } from "@/components/ui/button";

export async function Header() {
  const { user } = await getCurrentUser();

  return (
    <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          OneCast
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 text-sm sm:flex">
          <Link href="#fitur" className="text-muted-foreground hover:text-foreground">
            Fitur
          </Link>
          <Link href="#cara-kerja" className="text-muted-foreground hover:text-foreground">
            Cara kerja
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className={buttonVariants()}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}
              >
                Masuk
              </Link>
              <Link href="/register" className={buttonVariants()}>
                Mulai Gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
