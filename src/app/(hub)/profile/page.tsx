import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { canEdit, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { roleLabel, unitLabel } from "@/lib/options";
import { Avatar } from "@/components/hub/Avatar";
import { Card } from "@/components/hub/Card";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { CopyButton } from "@/components/hub/CopyButton";
import { PageHeader } from "@/components/hub/PageHeader";
import { buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { ProfileForm } from "./ProfileForm";
import { generateApiKey, revokeApiKey } from "./actions";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const scope = user.role === "admin" || user.role === "viewer" ? "semua unit" : user.units.map((u) => unitLabel.get(u) ?? u).join(", ") || "belum ada unit";
  const payload = await getPayloadClient();
  const me = await payload.findByID({ collection: "users", id: user.id, depth: 0 });
  const apiKey = me.enableAPIKey && me.apiKey ? me.apiKey : null;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Profil" subtitle="Nama, email, dan password Anda sendiri." />
      <div className="flex items-center gap-3">
        <Avatar name={user.name} className="size-12 text-sm" />
        <div>
          <p className="font-semibold">{user.name}{user.title ? <span className="font-normal text-muted"> · {user.title}</span> : null}</p>
          <p className="text-sm text-muted">{roleLabel.get(user.role)} · {scope}</p>
        </div>
      </div>
      <ProfileForm name={user.name} email={user.email} />
      <p className="text-xs text-muted">
        Peran, jabatan, dan unit diatur oleh admin di halaman Tim.
        {user.role === "admin" && (
          <>
            {" "}
            <Link href="/team" className="font-semibold text-primary hover:underline">Kelola tim</Link>
          </>
        )}
      </p>

      {canEdit(user) && (
      <Card title="Kunci API untuk Claude Code">
        <p className="text-sm text-muted">
          Dipakai skill <span className="font-semibold">/outreach</span> di laptop Anda untuk membaca antrean target dan menulis riset serta draf ke Hub atas nama Anda. Simpan di berkas <code className="rounded bg-surface-soft px-1">~/.config/zynergy-hub/env</code> sebagai <code className="rounded bg-surface-soft px-1">HUB_API_KEY</code>. Jangan bagikan; cabut kalau bocor.
        </p>
        {apiKey ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input readOnly value={apiKey} className={`${fieldClass} font-mono text-xs sm:max-w-md`} aria-label="Kunci API" />
              <CopyButton text={apiKey} label="Salin kunci" />
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={generateApiKey}>
                <ConfirmButton message="Buat kunci baru? Kunci lama langsung tidak berlaku." className={buttonOutline}>Ganti kunci</ConfirmButton>
              </form>
              <form action={revokeApiKey}>
                <ConfirmButton message="Cabut kunci ini? Skill /outreach tidak bisa masuk sampai kunci baru dibuat." className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cabut</ConfirmButton>
              </form>
            </div>
          </div>
        ) : (
          <form action={generateApiKey} className="mt-3">
            <button type="submit" className={buttonPrimary}>Buat kunci API</button>
          </form>
        )}
      </Card>
      )}
    </div>
  );
}
