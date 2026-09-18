"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { Project } from "@/payload-types";
import { units, type Unit } from "@/lib/options";
import type { ClientOption } from "@/lib/orders";
import type { UserOption } from "@/lib/projects";
import { ErrorText, Label, RupiahInput, buttonPrimary, fieldClass, groupDigits } from "@/components/hub/form";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { Select } from "@/components/hub/Select";
import { deleteProject, saveProject, type ProjectFormState } from "./actions";

const initial: ProjectFormState = { status: "idle" };
const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");

/** Project details and money. Stage, status, deliverables, and log live in their own cards. */
export function ProjectForm({
  project,
  units: allowedUnits,
  clients,
  owners,
  currentUserId,
  canDelete,
  readOnly = false,
  showMoney = true,
  defaultClientId,
}: {
  project?: Project;
  /** Units the person may see that work in projects (Digital, Apps). */
  units: Unit[];
  clients: ClientOption[];
  owners: UserOption[];
  currentUserId: number;
  canDelete: boolean;
  readOnly?: boolean;
  showMoney?: boolean;
  defaultClientId?: number;
}) {
  const router = useRouter();
  const defaultClient = defaultClientId ? clients.find((c) => c.id === defaultClientId) : undefined;
  const [unit, setUnit] = useState<Unit>(project?.unit ?? defaultClient?.unit ?? allowedUnits[0] ?? "digital");
  const [value, setValue] = useState(project?.value ? groupDigits(String(project.value)) : "");
  const [state, formAction, pending] = useActionState(
    async (prev: ProjectFormState, fd: FormData) => {
      const r = await saveProject(prev, fd);
      if (r.status === "success" && r.id) {
        router.push(`/projects/${r.id}`);
        router.refresh();
      }
      return r;
    },
    initial,
  );
  const clientOptions = clients.filter((c) => c.unit === unit).map((c) => ({ label: c.name, value: String(c.id) }));
  const ownerId = project ? (typeof project.owner === "object" && project.owner ? project.owner.id : project.owner) : currentUserId;

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      <fieldset disabled={readOnly} className="space-y-5 disabled:opacity-90">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pf-unit">Unit bisnis</Label>
            <Select id="pf-unit" name="unit" value={unit} onValueChange={(v) => setUnit(v as Unit)} options={units.filter((u) => allowedUnits.includes(u.value) || project?.unit === u.value)} />
          </div>
          <div>
            <Label htmlFor="pf-client">Klien</Label>
            <Select key={unit} id="pf-client" name="client" required defaultValue={project ? String(typeof project.client === "object" ? project.client.id : project.client) : defaultClient ? String(defaultClient.id) : undefined} placeholder={clientOptions.length ? "Pilih klien" : "Belum ada klien di unit ini"} options={clientOptions} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="pf-name">Nama proyek</Label>
            <input id="pf-name" name="name" required defaultValue={project?.name ?? ""} className={fieldClass} placeholder="Contoh: Website klinik + booking WhatsApp" />
          </div>
          <div>
            <Label htmlFor="pf-owner">Penanggung jawab</Label>
            <Select id="pf-owner" name="owner" defaultValue={ownerId ? String(ownerId) : undefined} placeholder="Pilih orang" options={owners.map((o) => ({ label: o.name, value: String(o.id) }))} />
          </div>
          {showMoney && (
            <div>
              <Label htmlFor="pf-value">Nilai proyek</Label>
              <RupiahInput id="pf-value" name="value" value={value} onChange={setValue} />
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {showMoney && (
            <div>
              <Label htmlFor="pf-dp">DP (%)</Label>
              <input id="pf-dp" name="dpPercent" type="number" min={0} max={100} defaultValue={project?.dpPercent ?? 50} className={fieldClass} />
            </div>
          )}
          <div>
            <Label htmlFor="pf-start">Mulai</Label>
            <input id="pf-start" name="startDate" type="date" defaultValue={day(project?.startDate)} className={fieldClass} />
          </div>
          <div>
            <Label htmlFor="pf-target">Target launch</Label>
            <input id="pf-target" name="targetDate" type="date" defaultValue={day(project?.targetDate)} className={fieldClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="pf-repo">Repo</Label>
            <input id="pf-repo" name="repo" defaultValue={project?.links?.repo ?? ""} className={fieldClass} placeholder="https://github.com/…" />
          </div>
          <div>
            <Label htmlFor="pf-staging">Staging</Label>
            <input id="pf-staging" name="staging" defaultValue={project?.links?.staging ?? ""} className={fieldClass} placeholder="https://" />
          </div>
          <div>
            <Label htmlFor="pf-live">Live</Label>
            <input id="pf-live" name="live" defaultValue={project?.links?.live ?? ""} className={fieldClass} placeholder="https://" />
          </div>
        </div>

        <div>
          <Label htmlFor="pf-notes">Catatan</Label>
          <textarea id="pf-notes" name="notes" rows={3} defaultValue={project?.notes ?? ""} className={fieldClass} placeholder="Konteks yang perlu diketahui siapa pun yang membuka proyek ini." />
        </div>
      </fieldset>

      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {project ? "Simpan perubahan" : "Simpan proyek"}
          </button>
          {project && canDelete && (
            <ConfirmButton
              message={`Hapus proyek ${project.name} beserta dokumennya? Transaksi terkait tetap tersimpan.`}
              formAction={deleteProject}
              formNoValidate
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
              Hapus
            </ConfirmButton>
          )}
        </div>
      )}
    </form>
  );
}
