import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles, TerminalSquare } from "lucide-react";
import { canEditClients, canSeeMoney, getSessionUser } from "@/lib/session";
import { hasTool } from "@/lib/workspace";
import { getPayloadClient } from "@/lib/payload";
import { formatIDR, formatMonthLong } from "@/lib/format";
import { usdToIdrApprox } from "@/lib/options";
import { hubSkills, skillEnvExample, skillEnvPath } from "@/lib/skills";
import { KpiCard } from "@/components/hub/KpiCard";
import { NavIcon } from "@/components/hub/NavIcon";
import type { IconName } from "@/components/hub/nav";

export const dynamic = "force-dynamic";

/** What the PDF importer cost this month, from the rows each call writes. */
async function getAiSpend(allowed: string[]) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "ai-usage",
    where: { and: [{ createdAt: { greater_than_equal: monthStart } }, { unit: { in: allowed.length ? allowed : ["none"] } }] },
    limit: 1000,
    depth: 0,
  });
  return { calls: docs.length, costUsd: docs.reduce((s, d) => s + d.costUsd, 0) };
}

export const metadata: Metadata = { title: "Alat" };

interface Tool {
  id: string;
  icon: IconName;
  title: string;
  level: string;
  text: string;
}

/** Order = build order. Focus is Supply (decided 2026-09-17); Digital tools wait for a paying Digital client. */
const nextTools: Tool[] = [
  {
    id: "vendor",
    icon: "vendor",
    title: "Registrasi Vendor",
    level: "Sederhana",
    text: "Status pendaftaran vendor per perusahaan target: dokumen yang diminta, tenggat, PIC, dan portal vendornya.",
  },
  {
    id: "po-email",
    icon: "inbox",
    title: "PO dari Email",
    level: "Menengah",
    text: "PO yang masuk ke email PT otomatis terdeteksi, dibaca oleh impor PDF yang sudah ada, dan menunggu Anda periksa sebelum tersimpan.",
  },
  {
    id: "rfq",
    icon: "rfq",
    title: "RFQ Supply",
    level: "Kompleks",
    text: "Email RFQ jadi kartu dengan tenggat, template penawaran dengan riwayat harga part number, dan tindak lanjut. Dirancang bersama Pak Rizal.",
  },
];

const deferredTools: Tool[] = [
  {
    id: "cek-google",
    icon: "search",
    title: "Cek Google",
    level: "Ditunda",
    text: "Laporan satu halaman tentang profil Google, ulasan, website, dan Instagram calon klien Digital.",
  },
  {
    id: "laporan",
    icon: "report",
    title: "Laporan Bulanan",
    level: "Ditunda",
    text: "Angka profil Google tiap klien Digital jadi laporan bulanan yang dikirim lewat WhatsApp.",
  },
  {
    id: "portal",
    icon: "portal",
    title: "Portal Klien",
    level: "Ditunda",
    text: "Klien Digital melihat laporan dan langganannya sendiri di Hub.",
  },
];

function ToolCard({ t, muted = false }: { t: Tool; muted?: boolean }) {
  return (
    <li id={t.id} className={`rounded-2xl border border-line bg-white p-5 ${muted ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${muted ? "bg-surface-soft text-muted" : "bg-primary-soft text-primary"}`}>
          <NavIcon name={t.icon} className="size-5" />
        </span>
        <div>
          <h2 className="font-bold">{t.title}</h2>
          <p className="text-xs text-muted">{t.level}{muted ? "" : " · Segera"}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t.text}</p>
    </li>
  );
}

export default async function AlatPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const spend = canSeeMoney(user) ? await getAiSpend(user.units) : null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Alat</h1>
        <p className="text-sm text-muted">Sudah jalan: impor PDF PO (halaman PO baru), Outreach dengan tindak lanjut, Brankas Dokumen, dan Proyek dengan Brief. Urutan di bawah adalah urutan pembangunan berikutnya, mengikuti fokus Supply.</p>
      </div>
      {spend && (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard
            icon={Sparkles}
            label={`Biaya AI ${formatMonthLong(new Date())}`}
            value={`$${spend.costUsd.toFixed(3)}`}
            hint={`sekitar ${formatIDR(spend.costUsd * usdToIdrApprox)} · ${spend.calls} impor PDF · angka resmi di dashboard OpenAI`}
            tone="primary"
          />
        </div>
      )}
      {canEditClients(user) && hasTool(user.role, "skills") && (
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Skill Claude Code</h2>
        <p className="text-sm text-muted">
          Pekerjaan AI di Hub berjalan di Claude Code milik masing-masing developer, bukan di server. Skill-nya ada di repo (<code className="rounded bg-surface-soft px-1">.claude/skills</code>) dan dipasang dengan <code className="rounded bg-surface-soft px-1">pnpm skills:install</code>. Tiap orang memakai kunci API-nya sendiri dari halaman Profil, disimpan di <code className="rounded bg-surface-soft px-1">{skillEnvPath}</code>:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-line bg-white p-3 text-xs">{skillEnvExample}</pre>
        <ul className="grid gap-3 sm:grid-cols-2">
          {hubSkills.map((sk) => (
            <li key={sk.command} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary"><TerminalSquare className="size-4" aria-hidden /></span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold">{sk.command}</p>
                  <p className="truncate text-xs text-muted">{sk.title}</p>
                </div>
              </div>
              <p className="mt-3 text-sm">{sk.what}</p>
              <p className="mt-1 text-xs text-muted"><span className="font-semibold text-ink">Kapan:</span> {sk.when}</p>
              {sk.modes && (
                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {sk.modes.map((m) => <li key={m} className="font-mono">{m}</li>)}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">{sk.never}</p>
            </li>
          ))}
        </ul>
      </div>
      )}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Berikutnya, fokus Supply</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {nextTools.map((t) => <ToolCard key={t.id} t={t} />)}
        </ul>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Ditunda sampai ada klien Digital</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {deferredTools.map((t) => <ToolCard key={t.id} t={t} muted />)}
        </ul>
      </div>
    </div>
  );
}
