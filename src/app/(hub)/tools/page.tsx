import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { canSeeMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { formatIDR, formatMonthLong } from "@/lib/format";
import { usdToIdrApprox } from "@/lib/options";
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

const tools: { id: string; icon: IconName; title: string; level: string; text: string }[] = [
  {
    id: "cek-google",
    icon: "search",
    title: "Cek Google",
    level: "Sederhana",
    text: "Masukkan nama dan lokasi usaha, dapatkan laporan satu halaman: ada di Maps atau tidak, jumlah ulasan, website, Instagram, dan kata kunci yang memunculkannya. Bahan sebelum bertemu calon klien.",
  },
  {
    id: "laporan",
    icon: "report",
    title: "Laporan Bulanan",
    level: "Menengah",
    text: "Tarik angka profil Google tiap klien, susun teks laporan dalam bahasa pemilik usaha, kirim via WhatsApp. Manual dulu, otomatis kemudian.",
  },
  {
    id: "portal",
    icon: "portal",
    title: "Portal Klien",
    level: "Menengah",
    text: "portal.zynergy.co.id: klien melihat laporan, langganan, dan mengedit isi website mereka sendiri dari HP.",
  },
  {
    id: "rfq",
    icon: "rfq",
    title: "RFQ Supply",
    level: "Kompleks",
    text: "Email RFQ yang masuk ke sales@ jadi kartu dengan tenggat, template penawaran dengan riwayat harga part number, dan tindak lanjut otomatis. Dirancang bersama Pak Rizal.",
  },
];

export default async function AlatPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const spend = canSeeMoney(user) ? await getAiSpend(user.units) : null;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Alat</h1>
        <p className="text-sm text-muted">Impor PDF PO sudah jalan di halaman PO baru. Yang lain urut dari yang paling sederhana, masih dalam rencana.</p>
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
      <ul className="grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <li key={t.id} id={t.id} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <NavIcon name={t.icon} className="size-5" />
              </span>
              <div>
                <h2 className="font-bold">{t.title}</h2>
                <p className="text-xs text-muted">{t.level} · Segera</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{t.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
