"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Label, buttonOutline, fieldClass } from "@/components/hub/form";

interface Row {
  key: number;
}

/**
 * Follow-ups typed while creating an event, one row each: what, who, when.
 * Native selects keep every row's fields aligned in FormData (fuText, fuOwner, fuDue).
 */
export function FollowUpRows({ users, defaultOwner }: { users: { label: string; value: string }[]; defaultOwner: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [seq, setSeq] = useState(1);
  const add = () => {
    setRows((r) => [...r, { key: seq }]);
    setSeq((n) => n + 1);
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="fu-first">Tindak lanjut</Label>
      {rows.map((row, i) => (
        <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_9rem_8.5rem_auto]">
          <input id={i === 0 ? "fu-first" : undefined} name="fuText" placeholder="Apa yang dikerjakan" className={cn(fieldClass, "px-3 py-2 text-sm")} />
          <select name="fuOwner" defaultValue={defaultOwner} aria-label="Siapa" className={cn(fieldClass, "px-2.5 py-2 text-sm")}>
            <option value="">Siapa</option>
            {users.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
          <input name="fuDue" type="date" aria-label="Tenggat" className={cn(fieldClass, "px-2.5 py-2 text-sm")} />
          <button type="button" onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))} aria-label="Hapus baris" className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600">
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className={cn(buttonOutline, "text-xs")}>
        <Plus className="size-3.5" />
        {rows.length ? "Tambah baris" : "Tambah tindak lanjut"}
      </button>
    </div>
  );
}
