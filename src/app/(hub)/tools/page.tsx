import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { NavIcon } from "@/components/hub/NavIcon";
import type { IconName } from "@/components/hub/nav";

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
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Alat</h1>
        <p className="text-sm text-muted">Urut dari yang paling sederhana. Semua masih dalam rencana; klien dan arus kas dulu.</p>
      </div>
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
