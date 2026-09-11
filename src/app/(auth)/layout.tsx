import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div aria-hidden className="bg-dot-grid absolute inset-0 opacity-50" />
      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="items-center">
          <LogoMark className="mb-1 h-11 w-11" />
          <CardTitle className="text-center text-2xl font-extrabold tracking-tight">
            OneCast
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
