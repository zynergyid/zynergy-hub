"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import type { Project } from "@/payload-types";
import { daysLabel, formatDate, formatIDR } from "@/lib/format";
import { unitLabel, type Unit } from "@/lib/options";
import type { ClientOption } from "@/lib/orders";
import type { UserOption } from "@/lib/projects";
import { clientOfProject, ownerOfProject } from "@/lib/project-rules";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { MarkdownLite } from "@/components/hub/MarkdownLite";
import { buttonOutline } from "@/components/hub/form";
import { deadlineText, deadlineTone } from "@/components/hub/deadline";
import { ProjectForm } from "./ProjectForm";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <dt className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-semibold">{children}</dd>
    </div>
  );
}

/**
 * The project's facts at a glance; the full form opens only when someone
 * presses "Ubah data". People without edit rights see the facts alone.
 */
export function ProjectInfoCard({
  project,
  open,
  units,
  clients,
  owners,
  currentUserId,
  editable,
  showMoney,
}: {
  project: Project;
  open: boolean;
  units: Unit[];
  clients: ClientOption[];
  owners: UserOption[];
  currentUserId: number;
  editable: boolean;
  showMoney: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const client = clientOfProject(project);
  const owner = ownerOfProject(project);
  const links = [
    { label: "Repo", href: project.links?.repo },
    { label: "Staging", href: project.links?.staging },
    { label: "Live", href: project.links?.live },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));
  const target = project.targetDate;

  if (editing) {
    return (
      <ProjectForm
        project={project}
        units={units}
        clients={clients}
        owners={owners}
        currentUserId={currentUserId}
        canDelete={editable}
        showMoney={showMoney}
        onCancel={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <Card title="Data proyek">
      <dl className="divide-y divide-line">
        <Row label="Klien">{client ? <Link href={`/clients/${client.id}`} className="hover:text-primary">{client.name}</Link> : "klien terhapus"}</Row>
        <Row label="Unit">{unitLabel.get(project.unit)}</Row>
        <Row label="PJ">{owner?.name ?? "-"}</Row>
        {showMoney && <Row label="Nilai">{project.value ? formatIDR(project.value) : "-"}</Row>}
        {showMoney && <Row label="DP">{project.value ? `${project.dpPercent ?? 0}%` : "-"}</Row>}
        <Row label="Mulai">{project.startDate ? formatDate(project.startDate) : "-"}</Row>
        <Row label="Target launch">
          {target ? (
            <span className={cn(open && deadlineText[deadlineTone(target, 7)])}>
              {formatDate(target)}
              {open ? ` (${daysLabel(target)})` : ""}
            </span>
          ) : (
            <span className="font-normal text-muted">belum ditentukan</span>
          )}
        </Row>
        <Row label="Tautan">
          {links.length ? (
            <span className="flex flex-wrap justify-end gap-3">
              {links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {l.label} <ExternalLink className="size-3" />
                </a>
              ))}
            </span>
          ) : (
            <span className="font-normal text-muted">-</span>
          )}
        </Row>
      </dl>
      {project.notes && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Catatan</p>
          <MarkdownLite text={project.notes} />
        </div>
      )}
      {editable && (
        <button type="button" onClick={() => setEditing(true)} className={`${buttonOutline} mt-4`}>
          <Pencil className="size-4" />
          Ubah data
        </button>
      )}
    </Card>
  );
}
