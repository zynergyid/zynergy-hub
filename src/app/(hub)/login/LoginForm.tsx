"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ErrorText, Input, Label } from "@/components/hub/form";

/** Signs in through the Hub's login route: 90 days renewed on use with "Ingat saya", otherwise 4 hours. */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password"), remember: fd.get("remember") === "on" }),
    });
    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setError(data.message ?? "Email atau password salah.");
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
      <label htmlFor="login-remember" className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input id="login-remember" name="remember" type="checkbox" defaultChecked className="mt-0.5 size-4 shrink-0 rounded border-line accent-primary" />
        <span>
          <span className="font-semibold">Ingat saya di perangkat ini</span>
          <span className="block text-xs text-muted">Tetap masuk selama Hub masih dipakai. Tanpa ini, login berakhir setelah 4 jam. Matikan di komputer bersama.</span>
        </span>
      </label>
      <ErrorText>{error}</ErrorText>
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Masuk
      </button>
      <p className="text-center text-xs text-muted">Lupa password? Minta admin mengatur ulang dari halaman Tim.</p>
    </form>
  );
}
