import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarDays, ListChecks } from "lucide-react";
import { canEditClients, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { capabilities, eventKindLabel, roleLabel, unitLabel } from "@/lib/options";
import { hasTool } from "@/lib/workspace";
import { getMyFollowUps, getMyWeekEvents } from "@/lib/calendar";
import { dateKeyWib, formatDayShort, timeWib } from "@/lib/calendar-dates";
import { Card } from "@/components/hub/Card";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { CopyButton } from "@/components/hub/CopyButton";
import { KpiCard } from "@/components/hub/KpiCard";
import { PageHeader } from "@/components/hub/PageHeader";
import { buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { FollowUpRow } from "@/app/(hub)/calendar/FollowUpsCard";
import { AvatarPicker } from "./AvatarPicker";
import { ProfileForm } from "./ProfileForm";
import { generateApiKey, generateCalendarToken, revokeApiKey, revokeCalendarToken } from "./actions";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

/** The person's own page: photo and contact, what is on their plate this week, then the account tools. */
export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const scope = user.caps.includes("allUnits") ? "semua unit" : user.units.map((u) => unitLabel.get(u) ?? u).join(", ") || "belum ada unit";
  const payload = await getPayloadClient();
  const [me, followUps, weekEvents] = await Promise.all([payload.findByID({ collection: "users", id: user.id, depth: 0 }), getMyFollowUps(user.id), getMyWeekEvents(user.id)]);
  const apiKey = me.enableAPIKey && me.apiKey ? me.apiKey : null;
  // The feed URL is built from the request host, so local and prod each show their own.
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "hub.zynergy.co.id"}`;
  const feedUrl = me.calendarToken ? `${origin}/api/calendar/feed.ics?t=${me.calendarToken}` : null;
  const overdue = followUps.filter((f) => f.dueAt && f.dueAt < new Date().toISOString()).length;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Profil" subtitle="Foto, kontak, dan apa yang ada di piring Anda minggu ini." />

      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
        <AvatarPicker name={user.name} photoUrl={user.photoUrl} />
        <div className="mt-4 border-t border-line pt-4">
          <p className="font-semibold">{user.name}{user.isAdmin ? <span className="font-normal text-muted"> · Admin</span> : null}</p>
          <p className="text-sm text-muted">{roleLabel.get(user.role)} · {scope}</p>
          {me.bio && <p className="mt-1 text-sm">{me.bio}</p>}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={ListChecks} label="Tindak lanjut" value={String(followUps.length)} hint={overdue ? `${overdue} lewat tenggat` : "terbuka"} tone={overdue ? "out" : "primary"} />
        <KpiCard icon={CalendarDays} label="Acara minggu ini" value={String(weekEvents.length)} hint="yang Anda ikuti" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tindak lanjut saya" action={{ label: "Kalender", href: "/calendar" }} className="min-w-0">
          {followUps.length === 0 ? (
            <p className="text-sm text-muted">Tidak ada yang tertunda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {followUps.slice(0, 6).map((f) => (
                <FollowUpRow key={`${f.eventId}-${f.rowId}`} eventId={f.eventId} rowId={f.rowId} text={f.text} ownerName={null} dueAt={f.dueAt} doneAt={f.doneAt} editable={user.caps.includes("team")} returnTo="/profile" context={f.eventTitle} />
              ))}
            </ul>
          )}
        </Card>
        <Card title="Acara saya minggu ini" className="min-w-0">
          {weekEvents.length === 0 ? (
            <p className="text-sm text-muted">Tidak ada acara yang Anda ikuti tujuh hari ke depan.</p>
          ) : (
            <ul className="divide-y divide-line">
              {weekEvents.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-24 shrink-0 text-xs text-muted">{formatDayShort(dateKeyWib(e.startAt))}, {timeWib(e.startAt)}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/calendar/${e.id}`} className="block truncate font-semibold hover:text-primary">{e.title}</Link>
                    <p className="truncate text-xs text-muted">{eventKindLabel.get(e.kind)}{e.location ? ` · ${e.location}` : ""}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Data diri">
        <ProfileForm name={user.name} email={user.email} whatsapp={me.whatsapp ?? ""} bio={me.bio ?? ""} />
        <p className="mt-3 text-xs text-muted">
          Peran menentukan hak dan ruang kerja, unit menentukan lingkup. Keduanya diatur admin di halaman Tim.
          {user.isAdmin && (
            <>
              {" "}
              <Link href="/team" className="font-semibold text-primary hover:underline">Kelola tim</Link>
            </>
          )}
        </p>
      </Card>

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
        <p className="mt-2 text-xs text-muted">
          Perubahan yang Anda buat, login, dan unduhan laporan tercatat sebagai jejak audit, sama untuk semua anggota. Membaca halaman tidak dicatat.{" "}
          {user.isAdmin ? (
            <>Daftar lengkapnya ada di <Link href="/activity" className="font-semibold text-primary hover:underline">Aktivitas</Link>.</>
          ) : (
            "Daftar lengkapnya hanya bisa dibuka admin; riwayat tiap catatan tetap tampil di kartu Riwayat catatan itu."
          )}
        </p>
        <p className="mt-2 text-xs text-muted">Lingkup: {scope}. Peran {roleLabel.get(user.role)} juga mengatur <Link href="/workspace" className="font-semibold text-primary hover:underline">ruang kerja</Link> Anda.</p>
      </Card>

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
