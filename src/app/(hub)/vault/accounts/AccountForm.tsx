"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import type { Account } from "@/payload-types";
import { accountPlatforms, accountStatuses, accountVisibilities } from "@/lib/options";
import type { UserOption } from "@/lib/projects";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { ErrorText, Input, Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { deleteAccount, saveAccount, type AccountFormState } from "./actions";

const initial: AccountFormState = { status: "idle" };
const relId = (v: number | { id: number } | null | undefined) => (typeof v === "object" && v ? v.id : (v ?? null));

/** The account without its ciphertext; the page strips it before handing the record to the browser. */
export type SafeAccount = Omit<Account, "passwordEnc">;

/** One company account: where it is, who holds it, how to get back in, and the password if the team keeps it here. */
export function AccountForm({ account, users, hasPassword = false, readOnly = false }: { account?: SafeAccount; users: UserOption[]; hasPassword?: boolean; readOnly?: boolean }) {
  const [show, setShow] = useState(false);
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
          <div className="space-y-3 rounded-xl border border-line bg-surface-soft/60 p-3 sm:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="ac-password">Password</Label>
                <div className="relative">
                  <Input id="ac-password" name="password" type={show ? "text" : "password"} autoComplete="new-password" className="pr-10" placeholder={hasPassword ? "Tersimpan. Isi hanya untuk mengganti." : "Kosongkan jika disimpan di tempat lain"} />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Sembunyikan" : "Tampilkan"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-ink">
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {hasPassword && (
                  <label className="mt-1.5 flex items-center gap-2 text-xs text-muted">
                    <input type="checkbox" name="clearPassword" value="1" className="size-3.5 rounded border-line" />
                    Hapus password yang tersimpan
                  </label>
                )}
              </div>
              <div>
                <Label htmlFor="ac-visibility">Siapa boleh lihat password</Label>
                <Select id="ac-visibility" name="visibility" defaultValue={account?.visibility ?? "tim"} options={accountVisibilities} />
              </div>
            </div>
            <p className="text-xs text-muted">Disimpan terenkripsi di Hub. Setiap kali ditampilkan, tercatat di Aktivitas.</p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ac-pw">Password juga disimpan di</Label>
            <Input id="ac-pw" name="passwordWhere" defaultValue={account?.passwordWhere ?? ""} placeholder="Bitwarden tim, brankas fisik" />
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
