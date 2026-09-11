import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { BrandMark } from "@/components/ui/BrandMark";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

export default async function MasukPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <BrandMark className="size-9 text-navy" />
          <span className="text-xl font-extrabold tracking-tight">
            Zynergy <span className="text-muted">Team</span>
          </span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
          <h1 className="text-lg font-extrabold">Masuk</h1>
          <p className="mb-5 text-sm text-muted">Aplikasi internal tim Zynergy.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
