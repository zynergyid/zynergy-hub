"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import type { Account } from "@/payload-types";
import { accountPlatforms, accountStatuses } from "@/lib/options";
import type { UserOption } from "@/lib/projects";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { ErrorText, Input, Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { deleteAccount, saveAccount, type AccountFormState } from "./actions";

const initial: AccountFormState = { status: "idle" };
const relId = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));

/** One company account: where it is, who holds it, how to get back in. Never the password. */
export function AccountForm({ account, users, readOnly = false }: { account?: Account; users: UserOption[]; readOnly?: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (prev: AccountFormState, fd: FormData) => {
    const r = await saveAccount(prev, fd);
    if (r.status === "success") {
      router.push("/vault/accounts");
      router.refresh();
    }
    return r;
  }, initial);
  const holder = relId(account?.holder);
  return (
    <form action={action} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,27,51,0.04)] sm:p-6">
      {account && <input type="hidden" name="id" value={account.id} />}
      <fieldset disabled={readOnly} className="space-y-5 disabled:opacity-90">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="ac-platform">Platform</Label>
            <Select id="ac-platform" name="platform" defaultValue={account?.platform ?? "instagram"} options={accountPlatforms} />
          </div>
          <div>
            <Label htmlFor="ac-status">Status</Label>
            <Select id="ac-status" name="status" defaultValue={account?.status ?? "belum"} options={accountStatuses} />
          </div>
          <div>
            <Label htmlFor="ac-name">Nama akun</Label>
            <Input id="ac-name" name="name" required defaultValue={account?.name} placeholder="@zynergyid, admin@zynergy.co.id, zynergy.co.id" />
          </div>
          <div>
            <Label htmlFor="ac-url">Tautan</Label>
            <Input id="ac-url" name="url" type="url" defaultValue={account?.url ?? ""} placeholder="https://" />
          </div>
          <div>
            <Label htmlFor="ac-holder">Pemegang</Label>
            <Select id="ac-holder" name="holder" defaultValue={holder ? String(holder) : undefined} placeholder="Pilih anggota" options={users.map((u) => ({ label: u.name, value: String(u.id) }))} />
          </div>
          <div>
            <Label htmlFor="ac-email">Email login</Label>
            <Input id="ac-email" name="loginEmail" defaultValue={account?.loginEmail ?? ""} placeholder="admin@zynergy.co.id" />
          </div>
          <div>
            <Label htmlFor="ac-phone">Nomor HP terkait</Label>
            <Input id="ac-phone" name="phone" defaultValue={account?.phone ?? ""} placeholder="08..." />
          </div>
          <div>
            <Label htmlFor="ac-2fa">Verifikasi dua langkah</Label>
            <Input id="ac-2fa" name="twoFactor" defaultValue={account?.twoFactor ?? ""} placeholder="SMS ke HP kantor, Authenticator di HP siapa" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ac-pw">Password disimpan di</Label>
            <Input id="ac-pw" name="passwordWhere" defaultValue={account?.passwordWhere ?? ""} placeholder="Bitwarden tim, brankas fisik. Jangan tulis password-nya di sini." />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ac-notes">Catatan</Label>
            <textarea id="ac-notes" name="notes" rows={3} defaultValue={account?.notes ?? ""} className={fieldClass} />
          </div>
        </div>
      </fieldset>
      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button type="submit" disabled={pending} className={buttonPrimary}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {account ? "Simpan perubahan" : "Simpan akun"}
          </button>
          {account && (
            <ConfirmButton message={`Hapus catatan akun ${account.name}?`} formAction={deleteAccount} formNoValidate className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
              <Trash2 className="size-4" />
              Hapus
            </ConfirmButton>
          )}
        </div>
      )}
    </form>
  );
}
