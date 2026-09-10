import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div aria-hidden className="bg-dot-grid absolute inset-0 opacity-50" />
      <Card className="relative w-full max-w-md shadow-lg">
        <CardHeader className="items-center">
          <span className="bg-primary mb-1 flex h-11 w-11 items-center justify-center rounded-xl">
            <Sparkles className="text-primary-foreground h-5 w-5" aria-hidden />
          </span>
          <CardTitle className="text-center text-2xl font-extrabold tracking-tight">
            OneCast
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
