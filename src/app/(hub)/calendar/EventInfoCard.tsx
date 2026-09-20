"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import type { HubEvent } from "@/payload-types";
import type { EventFormOptions } from "@/lib/calendar";
import { Card } from "@/components/hub/Card";
import { buttonOutline } from "@/components/hub/form";
import { EventForm } from "./EventForm";

/** One row of the info list; with `href` it renders as a link (Hub pages relative, outside links absolute). */
export interface EventFact {
  label: string;
  name: string;
  href?: string;
}

/** Who, when, where, and what it is tied to; flips into the edit form. Display strings come from the server so the clock is WIB everywhere. */
export function EventInfoCard({ event, when, participants, facts, options }: { event: HubEvent; when: string; participants: string[]; facts: EventFact[]; options: EventFormOptions | null }) {
  const post = event.kind === "konten";
  const [editing, setEditing] = useState(false);
  if (editing && options) {
    return (
      <Card title="Ubah acara">
        <EventForm event={event} options={options} onCancel={() => setEditing(false)} />
      </Card>
    );
  }
  return (
    <Card title={post ? "Unggahan" : "Acara"}>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted">{post ? "Tayang" : "Waktu"}</dt>
          <dd className="font-semibold">{when}</dd>
        </div>
        {event.location && (
          <div>
            <dt className="text-xs text-muted">Tempat atau tautan</dt>
            <dd className="break-words">
              {/^https?:\/\//.test(event.location) ? (
                <a href={event.location} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{event.location}</a>
              ) : (
                event.location
              )}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted">{post ? "Penanggung jawab" : "Peserta"}</dt>
          <dd>{participants.length ? participants.join(", ") : <span className="text-muted">belum dipilih</span>}</dd>
        </div>
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-muted">{f.label}</dt>
            <dd className="break-words">
              {!f.href ? (
                f.name
              ) : f.href.startsWith("/") ? (
                <Link href={f.href} className="font-semibold text-primary hover:underline">{f.name}</Link>
              ) : (
                <a href={f.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{f.name}</a>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {options && (
        <button type="button" onClick={() => setEditing(true)} className={`${buttonOutline} mt-4`}>
          <Pencil className="size-4" />
          {post ? "Ubah unggahan" : "Ubah acara"}
        </button>
      )}
    </Card>
  );
}
