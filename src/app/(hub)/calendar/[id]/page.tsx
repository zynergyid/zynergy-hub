import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEditTeam, getSessionUser } from "@/lib/session";
import { getEvent, getEventFormOptions, getOpenFollowUpsBefore } from "@/lib/calendar";
import { dateKeyWib, formatDayLong, timeWib } from "@/lib/calendar-dates";
import { contentPlatformLabel, contentStatusLabel, eventKindLabel } from "@/lib/options";
import { PageHeader } from "@/components/hub/PageHeader";
import { EventInfoCard, type EventFact } from "../EventInfoCard";
import { FollowUpsCard } from "../FollowUpsCard";
import { NotesCard } from "../NotesCard";
import { PhotoCard } from "../PhotoCard";

export const metadata: Metadata = { title: "Acara" };
export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const id = Number((await params).id);
  const event = id ? await getEvent(id) : null;
  if (!event) notFound();
  const editable = canEditTeam(user);
  const [options, previous] = await Promise.all([editable ? getEventFormOptions(user) : null, event.kind === "rapat-tim" ? getOpenFollowUpsBefore(event) : []]);

  const startKey = dateKeyWib(event.startAt);
  const end = event.endAt ? (dateKeyWib(event.endAt) === startKey ? timeWib(event.endAt) : `${formatDayLong(dateKeyWib(event.endAt))} ${timeWib(event.endAt)}`) : null;
  const when = `${formatDayLong(startKey)}, ${timeWib(event.startAt)}${end ? ` sampai ${end}` : ""} WIB`;
  const photoUrl = typeof event.photo === "object" && event.photo ? (event.photo.url ?? null) : null;
  const participants = (event.participants ?? []).map((p) => (typeof p === "object" ? p.name : null)).filter((n): n is string => Boolean(n));
  const facts: EventFact[] = [];
  if (event.kind === "konten") {
    facts.push({ label: "Platform", name: contentPlatformLabel.get(event.content?.platform ?? "") ?? "belum dipilih" }, { label: "Status", name: contentStatusLabel.get(event.content?.status ?? "") ?? "Ide" });
    if (event.content?.designUrl) facts.push({ label: "Tautan desain", name: event.content.designUrl, href: event.content.designUrl });
    if (event.content?.postUrl) facts.push({ label: "Tautan unggahan", name: event.content.postUrl, href: event.content.postUrl });
  }
  if (typeof event.client === "object" && event.client) facts.push({ label: "Klien", name: event.client.name, href: `/clients/${event.client.id}` });
  if (typeof event.project === "object" && event.project) facts.push({ label: "Proyek", name: event.project.name, href: `/projects/${event.project.id}` });
  if (typeof event.prospect === "object" && event.prospect) facts.push({ label: "Target outreach", name: event.prospect.company, href: `/outreach/${event.prospect.id}` });
  const subtitle = event.kind === "konten" ? `${eventKindLabel.get(event.kind)} · ${facts.slice(0, 2).map((f) => f.name).join(", ")} · ${when}` : `${eventKindLabel.get(event.kind)} · ${when}`;

  return (
    <div className="space-y-5">
      <Link href={`/calendar?bulan=${startKey.slice(0, 7)}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Kalender
      </Link>
      <PageHeader title={event.title} subtitle={subtitle} />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <NotesCard event={event} editable={editable} hasProject={facts.some((f) => f.label === "Proyek")} />
          <FollowUpsCard event={event} editable={editable} users={options?.users ?? []} previous={previous} />
        </div>
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <EventInfoCard event={event} when={when} participants={participants} facts={facts} options={options} />
          <PhotoCard eventId={event.id} photoUrl={photoUrl} editable={editable} post={event.kind === "konten"} />
        </div>
      </div>
    </div>
  );
}
