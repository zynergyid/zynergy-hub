import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canEditClients, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { capabilities, roleLabel, unitLabel } from "@/lib/options";
import { hasTool } from "@/lib/workspace";
import { Avatar } from "@/components/hub/Avatar";
import { Card } from "@/components/hub/Card";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { CopyButton } from "@/components/hub/CopyButton";
import { PageHeader } from "@/components/hub/PageHeader";
import { buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { ProfileForm } from "./ProfileForm";
import { generateApiKey, generateCalendarToken, revokeApiKey, revokeCalendarToken } from "./actions";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const scope = user.caps.includes("allUnits") ? "semua unit" : user.units.map((u) => unitLabel.get(u) ?? u).join(", ") || "belum ada unit";
  const payload = await getPayloadClient();
  const me = await payload.findByID({ collection: "users", id: user.id, depth: 0 });
  const apiKey = me.enableAPIKey && me.apiKey ? me.apiKey : null;
  // The feed URL is built from the request host, so local and prod each show their own.
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "hub.zynergy.co.id"}`;
  const feedUrl = me.calendarToken ? `${origin}/api/calendar/feed.ics?t=${me.calendarToken}` : null;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Profil" subtitle="Nama, email, dan password Anda sendiri." />
      <div className="flex items-center gap-3">
        <Avatar name={user.name} className="size-12 text-sm" />
        <div>
          <p className="font-semibold">{user.name}{user.isAdmin ? <span className="font-normal text-muted"> · Admin</span> : null}</p>
          <p className="text-sm text-muted">{roleLabel.get(user.role)} · {scope}</p>
        </div>
      </div>
      <ProfileForm name={user.name} email={user.email} />
      <Card title="Hak Anda" action={{ label: "Tabel lengkap", href: "/access" }}>
        <ul className="space-y-1.5 text-sm">
          {capabilities.map((c) => {
            const on = user.caps.includes(c.key);
            return (
              <li key={c.key} className={on ? "" : "text-muted line-through"}>{c.label}</li>
            );
          })}
          <li className={user.isAdmin ? "" : "text-muted line-through"}>Kelola tim dan hak akses</li>
        </ul>
        <p className="mt-2 text-xs text-muted">Lingkup: {scope}. Peran {roleLabel.get(user.role)} juga mengatur <Link href="/workspace" className="font-semibold text-primary hover:underline">ruang kerja</Link> Anda.</p>
      </Card>
      <p className="text-xs text-muted">
        Peran menentukan hak dan ruang kerja, unit menentukan lingkup. Keduanya diatur admin di halaman Tim.
        {user.isAdmin && (
          <>
            {" "}
            <Link href="/team" className="font-semibold text-primary hover:underline">Kelola tim</Link>
          </>
        )}
      </p>

      <Card title="Kalender di HP">
        <p className="text-sm text-muted">
          Jadwal Anda di Hub (musyawarah tim, meeting klien, konten, target proyek, tindak lanjut, tenggat PO) bisa dipasang di Google Calendar atau aplikasi kalender HP lewat tautan langganan. Tautan ini hanya-baca dan pribadi; buat yang baru kalau tersebar.
        </p>
        {feedUrl ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input readOnly value={feedUrl} className={`${fieldClass} font-mono text-xs sm:max-w-md`} aria-label="Tautan kalender" />
              <CopyButton text={feedUrl} label="Salin tautan" />
            </div>
            <p className="text-xs text-muted">Google Calendar: Kalender lain, tanda tambah, Dari URL, tempel tautan. iPhone: Pengaturan, Kalender, Akun, Tambah Akun, Lainnya, Tambah Kalender Berlangganan. Google memuat ulang tiap beberapa jam.</p>
            <div className="flex flex-wrap gap-2">
              <form action={generateCalendarToken}>
                <ConfirmButton message="Buat tautan baru? Tautan lama langsung berhenti bekerja di semua kalender yang memakainya." className={buttonOutline}>Ganti tautan</ConfirmButton>
              </form>
              <form action={revokeCalendarToken}>
                <ConfirmButton message="Cabut tautan ini? Kalender yang berlangganan berhenti diperbarui." className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cabut</ConfirmButton>
              </form>
            </div>
          </div>
        ) : (
          <form action={generateCalendarToken} className="mt-3">
            <button type="submit" className={buttonPrimary}>Buat tautan kalender</button>
          </form>
        )}
      </Card>

      {canEditClients(user) && hasTool(user.role, "skills") && (
      <Card title="Kunci API untuk Claude Code">
        <p className="text-sm text-muted">
          Dipakai skill <span className="font-semibold">/outreach</span> di laptop Anda untuk membaca antrean target dan menulis riset serta draf ke Hub atas nama Anda. Simpan di berkas <code className="rounded bg-surface-soft px-1">~/.config/zynergy-hub/env</code> sebagai <code className="rounded bg-surface-soft px-1">HUB_API_KEY</code>. Jangan bagikan; cabut kalau bocor.
        </p>
        {apiKey ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input readOnly value={apiKey} className={`${fieldClass} font-mono text-xs sm:max-w-md`} aria-label="Kunci API" />
              <CopyButton text={apiKey} label="Salin kunci" />
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={generateApiKey}>
                <ConfirmButton message="Buat kunci baru? Kunci lama langsung tidak berlaku." className={buttonOutline}>Ganti kunci</ConfirmButton>
              </form>
              <form action={revokeApiKey}>
                <ConfirmButton message="Cabut kunci ini? Skill /outreach tidak bisa masuk sampai kunci baru dibuat." className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cabut</ConfirmButton>
              </form>
            </div>
          </div>
        ) : (
          <form action={generateApiKey} className="mt-3">
            <button type="submit" className={buttonPrimary}>Buat kunci API</button>
          </form>
        )}
      </Card>
      )}
    </div>
  );
}
