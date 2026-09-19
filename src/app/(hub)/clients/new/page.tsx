import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { first, type Search } from "@/lib/search";
import { units, type Unit } from "@/lib/options";
import { PageHeader } from "@/components/hub/PageHeader";
import { ClientForm } from "../ClientForm";

export const metadata: Metadata = { title: "Klien baru" };

export default async function KlienBaruPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "viewer") redirect("/clients");
  const sp = await searchParams;
  const wanted = first(sp.unit) as Unit | undefined;
  const defaultUnit = wanted && user.units.includes(wanted) && units.some((u) => u.value === wanted) ? wanted : undefined;
  // Only a Hub path may be a return target, never a full URL.
  const nextRaw = first(sp.next) ?? "";
  const next = /^\/[a-z0-9/_-]*$/i.test(nextRaw) && !nextRaw.startsWith("//") ? nextRaw : undefined;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Klien baru" subtitle={next ? "Simpan, lalu Anda kembali ke form sebelumnya dengan klien ini terpilih." : "Isi yang diketahui dulu, sisanya bisa dilengkapi nanti."} />
      <ClientForm canDelete={false} units={user.units} defaultUnit={defaultUnit} next={next} />
    </div>
  );
}
