import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canEdit, getSessionUser } from "@/lib/session";
import { getClientOptions } from "@/lib/orders";
import { first, type Search } from "@/lib/search";
import { units, type Unit } from "@/lib/options";
import { PageHeader } from "@/components/hub/PageHeader";
import { ProspectForm } from "../ProspectForm";

export const metadata: Metadata = { title: "Target baru" };

export default async function NewProspectPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canEdit(user)) redirect("/outreach");
  const wanted = first((await searchParams).unit) as Unit | undefined;
  const defaultUnit = wanted && user.units.includes(wanted) && units.some((u) => u.value === wanted) ? wanted : undefined;
  const clients = await getClientOptions(user.units);
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Target baru" subtitle="Cukup nama perusahaan untuk mulai; riset akan melengkapi sisanya." />
      <ProspectForm units={user.units} clients={clients} canDelete={false} defaultUnit={defaultUnit} />
    </div>
  );
}
