import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { PageHeader } from "@/components/hub/PageHeader";
import { ClientForm } from "../ClientForm";

export const metadata: Metadata = { title: "Klien baru" };

export default async function KlienBaruPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "viewer") redirect("/clients");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Klien baru" subtitle="Isi yang diketahui dulu, sisanya bisa dilengkapi nanti." />
      <ClientForm canDelete={false} units={user.units} />
    </div>
  );
}
