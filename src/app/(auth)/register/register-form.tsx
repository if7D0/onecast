"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/validations/auth";
import { GoogleButton } from "../_components/google-button";
import { register } from "./actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, { error: "", info: "" });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Daftar</h2>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Nama (opsional)
          </label>
          <Input id="name" name="name" type="text" autoComplete="name" maxLength={NAME_MAX} />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password (min. {PASSWORD_MIN} karakter)
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Konfirmasi password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        {state?.error && (
          <p role="alert" aria-live="polite" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
        {state?.info && (
          <p role="status" aria-live="polite" className="text-sm text-green-700">
            {state.info}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Memproses..." : "Daftar"}
        </Button>
      </form>
      <div className="relative text-center text-sm text-gray-500">
        <span className="bg-white px-2">atau</span>
      </div>
      <GoogleButton label="Daftar dengan Google" />
      <p className="text-center text-sm">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
