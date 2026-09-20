import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEditTeam, getSessionUser } from "@/lib/session";
import { getEventFormOptions, getLastMeetingParticipants } from "@/lib/calendar";
import { todayWib } from "@/lib/calendar-dates";
import { eventKinds } from "@/lib/options";
import { first, type Search } from "@/lib/search";
import { EventForm } from "../EventForm";

export const metadata: Metadata = { title: "Acara baru" };
export const dynamic = "force-dynamic";

const num = (v?: string) => (v && Number(v) > 0 ? Number(v) : null);

export default async function NewEventPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canEditTeam(user)) redirect("/calendar");
  const sp = await searchParams;
  const kind = eventKinds.find((k) => k.value === first(sp.jenis))?.value ?? (first(sp.klien) || first(sp.proyek) || first(sp.target) ? "meeting-klien" : "rapat-tim");
  const day = /^\d{4}-\d{2}-\d{2}$/.test(first(sp.tanggal) ?? "") ? first(sp.tanggal)! : todayWib();
  const [options, lastParticipants] = await Promise.all([getEventFormOptions(user), kind === "rapat-tim" ? getLastMeetingParticipants() : Promise.resolve([] as number[])]);
  const participants = lastParticipants.length ? lastParticipants : [user.id];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/calendar" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Kalender
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Acara baru</h1>
        <p className="mt-0.5 text-sm text-muted">Musyawarah tim, meeting klien, atau acara lain. Peserta musyawarah tim terisi dari musyawarah terakhir.</p>
      </div>
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
        <EventForm options={options} currentUserId={user.id} defaults={{ kind, startAt: `${day}T10:00`, participants, client: num(first(sp.klien)), project: num(first(sp.proyek)), prospect: num(first(sp.target)) }} />
      </div>
    </div>
  );
}
