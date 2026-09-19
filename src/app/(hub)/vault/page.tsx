import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, FileText, Lock, Plus } from "lucide-react";
import { canEdit, getSessionUser } from "@/lib/session";
import { fileOf, getVaultDocuments, groupByCategory, thumbnailOf } from "@/lib/vault";
import { formatDate } from "@/lib/format";
import { buildHref, first, type Search } from "@/lib/search";
import { vaultCategories, type VaultCategory } from "@/lib/options";
import { EmptyState } from "@/components/hub/EmptyState";
import { ExpiryPill } from "@/components/hub/ExpiryPill";
import { PageHeader } from "@/components/hub/PageHeader";
import { SearchForm } from "@/components/hub/SearchForm";
import { buttonOutline, buttonPrimary } from "@/components/hub/form";

export const metadata: Metadata = { title: "Brankas Dokumen" };
export const dynamic = "force-dynamic";

export default async function VaultPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const q = (first(sp.q) ?? "").trim();
  const category = (vaultCategories.some((c) => c.value === first(sp.category)) ? first(sp.category) : "") as VaultCategory | "";
  const editable = canEdit(user);
  const docs = await getVaultDocuments({ includeConfidential: editable, q, category });
  const groups = groupByCategory(docs);
  const href = (patch: Record<string, string | undefined>) => buildHref("/vault", { q: q || undefined, category: category || undefined }, patch);

  return (
    <div className="space-y-5">
      <PageHeader title="Brankas Dokumen" subtitle={`${docs.length} dokumen perusahaan${category ? " di kategori ini" : ""}. Untuk registrasi vendor, tender, dan bank.`}>
        {editable && (
          <Link href="/vault/new" className={buttonPrimary}>
            <Plus className="size-4" />
            Unggah dokumen
          </Link>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={href({ category: undefined })} className={`rounded-full border px-3 py-1 text-xs font-semibold ${!category ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"}`}>Semua</Link>
        {vaultCategories.map((c) => (
          <Link key={c.value} href={href({ category: c.value })} className={`rounded-full border px-3 py-1 text-xs font-semibold ${category === c.value ? "border-ink bg-ink text-white" : "border-line bg-white text-muted hover:text-ink"}`}>
            {c.label}
          </Link>
        ))}
        <SearchForm action="/vault" hidden={{ category: category || undefined }} q={q} placeholder="Cari nama, nomor, penerbit" />
      </div>

      {docs.length === 0 ? (
        <EmptyState title={`Belum ada dokumen${q ? ` untuk "${q}"` : ""}.`} hint={editable ? "Mulai dari NIB, NPWP, akta, dan company profile." : "Minta admin atau staf mengunggah."} />
      ) : (
        groups.map((g) => (
          <section key={g.category} className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{g.label}</h2>
            <ul className="overflow-hidden rounded-2xl border border-line bg-white divide-y divide-line">
              {g.docs.map((d) => {
                const f = fileOf(d);
                const thumb = thumbnailOf(d);
                return (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <Link href={`/vault/${d.id}`} className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-soft" aria-hidden>
                      {thumb?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb.url} alt="" className="size-full object-cover object-top" />
                      ) : (
                        <FileText className="size-6 text-muted" />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/vault/${d.id}`} className="flex items-center gap-1.5 font-semibold hover:text-primary">
                        {d.confidential && <Lock className="size-3.5 shrink-0 text-muted" aria-label="Rahasia" />}
                        <span className="truncate">{d.title}</span>
                      </Link>
                      <p className="truncate text-xs text-muted">
                        {[d.number ? `No. ${d.number}` : null, d.issuer, d.issuedAt ? `terbit ${formatDate(d.issuedAt)}` : null].filter(Boolean).join(" · ") || "detail belum diisi"}
                      </p>
                    </div>
                    <ExpiryPill expiresAt={d.expiresAt} />
                    {f?.url && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className={`${buttonOutline} px-3 py-1.5 text-xs`}>
                        <Download className="size-3.5" /> Unduh
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
