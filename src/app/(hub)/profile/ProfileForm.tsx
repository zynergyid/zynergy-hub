"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { ErrorText, Input, Label } from "@/components/hub/form";
import { saveProfile, type ProfileState } from "./actions";

const initial: ProfileState = { status: "idle" };

export function ProfileForm({ name, email, whatsapp, bio }: { name: string; email: string; whatsapp: string; bio: string }) {
  const [state, formAction, pending] = useActionState(saveProfile, initial);
  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-name">Nama</Label>
          <Input id="pf-name" name="name" required defaultValue={name} />
        </div>
        <div>
          <Label htmlFor="pf-email">Email</Label>
          <Input id="pf-email" name="email" type="email" required defaultValue={email} />
        </div>
        <div>
          <Label htmlFor="pf-wa">WhatsApp</Label>
          <Input id="pf-wa" name="whatsapp" inputMode="tel" defaultValue={whatsapp} placeholder="08xxxxxxxxxx" />
        </div>
        <div>
          <Label htmlFor="pf-bio">Tentang saya</Label>
          <Input id="pf-bio" name="bio" maxLength={120} defaultValue={bio} placeholder="Satu kalimat: apa yang Anda pegang" />
        </div>
        <div>
          <Label htmlFor="pf-password">Password baru</Label>
          <Input id="pf-password" name="password" type="password" autoComplete="new-password" minLength={8} placeholder="kosongkan kalau tidak diganti" />
        </div>
        <div>
          <Label htmlFor="pf-confirm">Ulangi password baru</Label>
          <Input id="pf-confirm" name="confirm" type="password" autoComplete="new-password" />
        </div>
      </div>
      <ErrorText>{state.status === "error" ? state.message : null}</ErrorText>
      {state.status === "success" && <p className="text-sm font-medium text-secondary-dark">{state.message}</p>}
      <div className="border-t border-line pt-4">
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Simpan
        </button>
      </div>
    </form>
  );
}
