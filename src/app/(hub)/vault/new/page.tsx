import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { canEditVault, getSessionUser } from "@/lib/session";
import { PageHeader } from "@/components/hub/PageHeader";
import { VaultForm } from "../VaultForm";

export const metadata: Metadata = { title: "Unggah dokumen" };

export default async function NewVaultDocumentPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canEditVault(user)) redirect("/vault");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Unggah dokumen" subtitle="Satu dokumen satu berkas. Isi tanggal berlaku supaya Hub mengingatkan sebelum kedaluwarsa." />
      <VaultForm />
    </div>
  );
}
