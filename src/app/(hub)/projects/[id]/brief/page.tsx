import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { clientOfProject, ownerOfProject } from "@/lib/project-rules";
import { briefStyles, confirmationItems, defaultBriefStyle, sectionsFor, type BriefStyle } from "@/lib/brief-doc";
import { formatDate } from "@/lib/format";
import { first, type Search } from "@/lib/search";
import { BrandMark } from "@/components/ui/BrandMark";
import { MarkdownLite } from "@/components/hub/MarkdownLite";
import { PrintButton } from "@/components/hub/PrintButton";
import { SegmentedLinks } from "@/components/hub/SegmentedLinks";

export const metadata: Metadata = { title: "Brief untuk klien" };
export const dynamic = "force-dynamic";

const chip = <span className="rounded-full bg-amber-50 px-1.5 py-px text-[10px] font-bold text-amber-700">perlu konfirmasi</span>;

/**
 * The brief as a document for the client: their language, guesses turned
 * into a confirmation checklist, a signature block. Two styles: "ringkas"
 * for individuals and small businesses, "lengkap" for companies. Print to
 * PDF from here.
 */
export default async function ClientBriefPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const projectId = Number(id);
  if (!projectId) notFound();
  const payload = await getPayloadClient();
  const project = await payload.findByID({ collection: "projects", id: projectId, depth: 1, disableErrors: true });
  if (!project || !user.units.includes(project.unit)) notFound();
  const brief = project.brief ?? {};
  const client = clientOfProject(project);
  const owner = ownerOfProject(project);
  const wanted = first((await searchParams).gaya);
  const style: BriefStyle = wanted === "ringkas" || wanted === "lengkap" ? wanted : defaultBriefStyle(client?.businessType);
  const short = style === "ringkas";
  const sections = sectionsFor(style).filter((s) => ((brief[s.key] as string | null | undefined) ?? "").trim());
  const items = confirmationItems(brief, style);
  const confirmed = brief.confirmedAt ? formatDate(brief.confirmedAt) : null;
  const clientName = client?.name ?? "klien";
  const person = client?.owner ?? null;
  const contact = person ? `${person}, ${clientName}` : clientName;
  const signLabels = short ? ["Nama", "Tanggal", "Tanda tangan"] : ["Nama", "Jabatan", "Tanggal", "Tanda tangan"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="size-4" />
          Kembali ke proyek
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedLinks ariaLabel="Gaya dokumen" segments={briefStyles.map((s) => ({ label: s.label, href: `/projects/${project.id}/brief?gaya=${s.value}`, active: style === s.value }))} />
          <PrintButton />
        </div>
      </div>
      <p className="text-xs text-muted print:hidden">
        {short
          ? "Gaya ringkas untuk perorangan dan usaha kecil: hanya tujuan, cara kerja baru, dan hal yang perlu diputuskan; tanda tangan tanpa jabatan, balasan WhatsApp juga dihitung konfirmasi."
          : "Gaya lengkap untuk perusahaan: semua bagian brief dan blok tanda tangan dengan jabatan."}{" "}
        Di jendela cetak pilih tujuan &quot;Save as PDF&quot;.
      </p>

      <article className="mx-auto max-w-3xl rounded-2xl border border-line bg-white p-8 text-[15px] leading-relaxed text-ink shadow-[0_1px_2px_rgba(15,27,51,0.04)] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
        <header className="flex items-start justify-between gap-4 border-b border-line pb-5">
          <div className="flex items-center gap-2.5">
            <BrandMark className="size-8 text-navy" />
            <div>
              <p className="text-base font-extrabold tracking-tight">Zynergy <span className="text-muted">Digital</span></p>
              {!short && <p className="text-xs text-muted">PT Sinergi Mitra Abadi Jaya</p>}
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{formatDate(project.updatedAt)}</p>
            <p>{confirmed ? `Dikonfirmasi ${confirmed}` : short ? "Mohon dicek" : "Draf untuk dikonfirmasi"}</p>
          </div>
        </header>

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">{short ? "Ringkasan Rencana" : "Brief Proyek"}</h1>
        <p className="text-lg font-semibold">{project.name}</p>
        <dl className="mt-3 grid grid-cols-[8rem_1fr] gap-y-1 text-sm">
          <dt className="text-muted">Untuk</dt>
          <dd className="font-semibold">{contact}</dd>
          <dt className="text-muted">Disusun oleh</dt>
          <dd className="font-semibold">{owner?.name ?? "Zynergy Digital"}</dd>
        </dl>

        {short ? (
          <p className="mt-6">
            {person ? `Pak/Bu ${person.split(" ").slice(-1)[0]}, ` : ""}ini ringkasan yang kami tangkap dari obrolan kita tentang {clientName}. Kalau ada yang keliru, coret saja atau kabari kami lewat WhatsApp. Kalimat yang masih dugaan kami tandai {chip}. Setelah Anda bilang sesuai, kami susun rincian pekerjaan dan biayanya.
          </p>
        ) : (
          <p className="mt-6">
            Dokumen ini merangkum pemahaman kami tentang kebutuhan {clientName} sebelum kami menyusun ruang lingkup dan penawaran. Mohon dibaca dan dikoreksi; bagian yang masih berupa dugaan kami tandai {chip} dan dikumpulkan di bagian akhir. Setelah Anda menyatakan brief ini sesuai, kami lanjut ke ruang lingkup, jadwal, dan harga.
          </p>
        )}

        {sections.map((s) => (
          <section key={s.key} className="mt-6">
            {/* Long sections may break across pages; the heading must not be left alone at the bottom. */}
            <div className="break-inside-avoid break-after-avoid">
              <h2 className="text-base font-bold">{s.title}</h2>
              <p className="mb-2 text-xs text-muted">{s.lead}</p>
            </div>
            <MarkdownLite text={brief[s.key] as string} marks="chip" className="space-y-2 text-[15px] leading-relaxed" />
          </section>
        ))}

        {items.length > 0 && (
          <section className="mt-8 break-inside-avoid rounded-xl border border-amber-200 bg-amber-50/40 p-4 print:bg-transparent">
            <h2 className="text-base font-bold">{short ? "Tolong dicek" : "Hal yang perlu Anda konfirmasi"}</h2>
            <p className="mb-2 text-xs text-muted">Benar, salah, atau perlu diubah? Cukup beri catatan di samping tiap nomor.</p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              {items.map((it, i) => (
                <li key={i}>
                  {!short && <span className="mr-1 text-xs font-semibold text-muted">{it.section}:</span>}
                  {it.text}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-8 break-inside-avoid border-t border-line pt-5">
          <h2 className="text-base font-bold">Konfirmasi</h2>
          <p className="text-sm text-muted">
            {short
              ? "Kalau sudah sesuai, cukup balas \"Setuju\" lewat WhatsApp, atau isi di bawah ini."
              : "Dengan ini saya menyatakan bahwa brief di atas, dengan catatan yang saya berikan, menggambarkan kebutuhan kami dengan benar."}
          </p>
          <dl className={`mt-5 grid gap-x-8 gap-y-6 text-sm ${short ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {signLabels.map((label) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-6 border-b border-ink/40" />
              </div>
            ))}
          </dl>
        </section>

        <footer className="mt-8 border-t border-line pt-3 text-xs text-muted">Zynergy Digital{short ? "" : ", PT Sinergi Mitra Abadi Jaya"}. zynergy.co.id/digital</footer>
      </article>
    </div>
  );
}
