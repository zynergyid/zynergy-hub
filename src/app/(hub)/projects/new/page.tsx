import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canEdit, getSessionUser } from "@/lib/session";
import { getClientOptions } from "@/lib/orders";
import { getUserOptions, projectUnitsOf } from "@/lib/projects";
import { first, type Search } from "@/lib/search";
import { PageHeader } from "@/components/hub/PageHeader";
import { ProjectForm } from "../ProjectForm";

export const metadata: Metadata = { title: "Proyek baru" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const allowed = projectUnitsOf(user.units);
  if (!canEdit(user) || allowed.length === 0) redirect("/projects");
  const sp = await searchParams;
  const [clients, owners] = await Promise.all([getClientOptions(allowed), getUserOptions()]);
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Proyek baru" subtitle="Mulai di Discovery. Nilai dan DP diisi setelah scope disepakati." />
      <ProjectForm units={allowed} clients={clients} owners={owners} currentUserId={user.id} canDelete={false} defaultClientId={Number(first(sp.client) || 0) || undefined} />
    </div>
  );
}
