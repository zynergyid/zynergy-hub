"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { Perinti } from "@/payload-types";
import { ErrorText, Input, Label, buttonPrimary } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { savePerintisTeam, type PerintisState } from "./actions";

const initial: PerintisState = { status: "idle" };
const unitOptions = [
  { label: "Digitalin", value: "digital" },
  { label: "Apps", value: "apps" },
  { label: "Supply", value: "supply" },
  { label: "Semua unit", value: "semua" },
];

export function TeamForm({ data }: { data: Perinti }) {
  const [state, action, pending] = useActionState(savePerintisTeam, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="pt-team">Nama kelompok</Label>
          <Input id="pt-team" name="teamName" defaultValue={data.teamName ?? "Zynergy"} />
        </div>
        <div>
          <Label htmlFor="pt-biz">Nama usaha</Label>
          <Input id="pt-biz" name="businessName" defaultValue={data.businessName ?? ""} placeholder="Yang ditulis di FORM-04" />
        </div>
        <div>
          <Label htmlFor="pt-group">Nomor kelompok</Label>
          <Input id="pt-group" name="groupNumber" inputMode="numeric" defaultValue={data.groupNumber ?? ""} placeholder="1 sampai 9" />
          <p className="mt-1 text-xs text-muted">Menentukan mentor tiap sesi.</p>
        </div>
        <div>
          <Label htmlFor="pt-leader">Ketua kelompok</Label>
          <Input id="pt-leader" name="leader" defaultValue={data.leader ?? ""} />
        </div>
        <div>
          <Label htmlFor="pt-unit">Angka usaha diambil dari</Label>
          <Select id="pt-unit" name="unit" defaultValue={data.unit ?? "digital"} options={unitOptions} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Simpan
        </button>
        {state.status === "error" && <ErrorText>{state.message}</ErrorText>}
        {state.status === "success" && <p className="text-sm text-secondary-dark">{state.message}</p>}
      </div>
    </form>
  );
}
