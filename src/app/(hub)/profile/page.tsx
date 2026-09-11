import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { roleLabel, unitLabel } from "@/lib/options";
import { Avatar } from "@/components/hub/Avatar";
import { PageHeader } from "@/components/hub/PageHeader";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Profil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const scope = user.role === "admin" || user.role === "viewer" ? "semua unit" : user.units.map((u) => unitLabel.get(u) ?? u).join(", ") || "belum ada unit";
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
      <p className="text-xs text-muted">Peran, jabatan, dan unit diatur oleh admin di halaman Tim.</p>
    </div>
  );
}
