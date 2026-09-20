"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { capabilities, roleLabel, roles, type RoleGrants } from "@/lib/options";
import { ErrorText, buttonPrimary } from "@/components/hub/form";
import { saveGrants, type GrantsState } from "./actions";

const initial: GrantsState = { status: "idle" };

/** Capability grid: one checkbox per role and capability. The admin flag is shown locked, always on. */
export function GrantsForm({ grants }: { grants: RoleGrants }) {
  const [state, action, pending] = useActionState(saveGrants, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,51,0.04)]">
        <table className="w-full min-w-[64rem] text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Hak</th>
              <th className="px-3 py-3 text-center font-medium">Admin</th>
              {roles.map((r) => (
                <th key={r.value} className="px-3 py-3 text-center font-medium">{roleLabel.get(r.value)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {capabilities.map((c) => (
              <tr key={c.key} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold">{c.label}</p>
                  {"hint" in c && c.hint && <p className="text-xs text-muted">{c.hint}</p>}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="inline-grid size-5 place-items-center rounded border border-secondary bg-secondary text-white opacity-60" title="Admin selalu punya semua hak">
                    <Check className="size-3.5" />
                  </span>
                </td>
                {roles.map((r) => (
                  <td key={r.value} className="px-3 py-3 text-center">
                    <input type="checkbox" name={`${r.value}.${c.key}`} defaultChecked={grants[r.value].includes(c.key)} aria-label={`${roleLabel.get(r.value)}: ${c.label}`} className="size-5 rounded border-line accent-primary" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Simpan hak akses
        </button>
        {state.status === "error" && <ErrorText>{state.message}</ErrorText>}
        {state.status === "success" && <p className="text-sm text-secondary-dark">{state.message}</p>}
        <p className="text-xs text-muted">Berlaku untuk semua orang dengan peran itu, paling lambat 30 detik. Admin ditandai per orang di halaman Anggota dan selalu punya semua hak.</p>
      </div>
    </form>
  );
}
