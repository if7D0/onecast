// PLACEHOLDER Fase 2 — diganti dashboard asli di Fase 3.
// Tugas file ini: membuktikan proteksi middleware + logout bekerja E2E.
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/helpers";
import { logout } from "./actions";

export default async function DashboardPage() {
  const { user } = await requireUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard (sementara)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Masuk sebagai <span className="font-medium">{user.email}</span>
          </p>
          <form action={logout}>
            <Button type="submit" variant="outline" className="w-full">
              Keluar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
