import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canEditMoney, getSessionUser } from "@/lib/session";
import { getClientOptions } from "@/lib/orders";
import { first, type Search } from "@/lib/search";
import { PageHeader } from "@/components/hub/PageHeader";
import { OrderForm } from "../OrderForm";

export const metadata: Metadata = { title: "PO baru" };
// The PDF import server action runs in this route; give it room for slow reads.
export const maxDuration = 60;

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canEditMoney(user)) redirect("/orders");
  const sp = await searchParams;
  const clients = await getClientOptions(user.units);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="PO baru" subtitle="Salin dari dokumen PO pembeli. Item bisa dilengkapi belakangan." />
      <OrderForm units={user.units} clients={clients} canDelete={false} defaultClientId={Number(first(sp.client) || 0) || undefined} />
    </div>
  );
}
