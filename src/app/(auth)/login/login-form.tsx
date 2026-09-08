"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "../_components/google-button";
import { login } from "./actions";

export function LoginForm({ initialError }: { initialError: string }) {
  const [state, formAction, pending] = useActionState(login, { error: initialError });
  const error = state?.error ?? "";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Masuk</h2>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Memproses..." : "Masuk"}
        </Button>
      </form>
      <div className="relative text-center text-sm text-gray-500">
        <span className="bg-white px-2">atau</span>
      </div>
      <GoogleButton label="Masuk dengan Google" />
      <p className="text-center text-sm">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}
