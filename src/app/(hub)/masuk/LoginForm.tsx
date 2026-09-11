"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ErrorText, Input, Label } from "@/components/hub/form";

/** Signs in through Payload's REST endpoint, which sets the auth cookie. */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Email atau password salah.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input id="login-email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input id="login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <ErrorText>{error}</ErrorText>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Masuk
      </button>
      <p className="text-center text-xs text-muted">
        Lupa password? Minta admin mengatur ulang, atau{" "}
        <Link href="/admin/forgot" className="font-semibold text-primary hover:underline">kirim tautan reset</Link>.
      </p>
    </form>
  );
}
