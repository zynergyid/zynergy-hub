"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ErrorText, Input, Label } from "@/components/hub/form";

/** Shown only while the database has no users: creates the first admin via Payload's first-register endpoint. */
export function FirstAdminForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/users/first-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password"), role: "admin" }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Gagal membuat admin. Coba lagi.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fa-name">Nama</Label>
        <Input id="fa-name" name="name" required autoFocus />
      </div>
      <div>
        <Label htmlFor="fa-email">Email</Label>
        <Input id="fa-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="fa-password">Password</Label>
        <Input id="fa-password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <ErrorText>{error}</ErrorText>
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Buat admin pertama
      </button>
    </form>
  );
}
