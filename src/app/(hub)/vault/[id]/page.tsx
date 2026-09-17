import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, Lock } from "lucide-react";
import { canEditMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { fileOf } from "@/lib/vault";
import { formatDate } from "@/lib/format";
import { vaultCategoryLabel } from "@/lib/options";
import { ExpiryPill } from "@/components/hub/ExpiryPill";
import { buttonPrimary } from "@/components/hub/form";
import { VaultForm } from "../VaultForm";

export const metadata: Metadata = { title: "Dokumen" };
export const dynamic = "force-dynamic";

export default async function VaultDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const docId = Number(id);
  if (!docId) notFound();
  const payload = await getPayloadClient();
  const doc = await payload.findByID({ collection: "vault-documents", id: docId, depth: 1, disableErrors: true });
  if (!doc) notFound();
  if (doc.confidential && !canEditMoney(user)) notFound();
  const f = fileOf(doc);
  const editable = canEditMoney(user);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/vault" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Brankas Dokumen
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">{doc.title}</h1>
            {doc.confidential && <span className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-muted"><Lock className="size-3" /> Rahasia</span>}
            <ExpiryPill expiresAt={doc.expiresAt} />
          </div>
          <p className="text-sm text-muted">
            {[vaultCategoryLabel.get(doc.category), doc.number ? `No. ${doc.number}` : null, doc.issuer, doc.issuedAt ? `terbit ${formatDate(doc.issuedAt)}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        {f?.url && (
          <a href={f.url} target="_blank" rel="noopener noreferrer" className={buttonPrimary}>
            <Download className="size-4" /> Unduh{f.filename ? ` (${f.filename})` : ""}
          </a>
        )}
      </div>
      <VaultForm doc={doc} currentFile={f?.url ? { url: f.url, filename: f.filename ?? "berkas" } : null} readOnly={!editable} />
    </div>
  );
}
