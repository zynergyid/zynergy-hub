import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { Avatar } from "@/components/hub/Avatar";
import { MemberForm } from "../MemberForm";

export const metadata: Metadata = { title: "Anggota tim" };
export const dynamic = "force-dynamic";

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  const { id } = await params;
  if (id === "new") {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link href="/team" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"><ArrowLeft className="size-4" /> Tim</Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Anggota baru</h1>
        <MemberForm isSelf={false} />
      </div>
    );
  }
  const memberId = Number(id);
  if (!memberId) notFound();
  const payload = await getPayloadClient();
  const member = await payload.findByID({ collection: "users", id: memberId, disableErrors: true });
  if (!member) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/team" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary"><ArrowLeft className="size-4" /> Tim</Link>
      <div className="flex items-center gap-3">
        <Avatar name={member.name} className="size-12 text-sm" />
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{member.name}</h1>
          <p className="text-sm text-muted">{member.email}</p>
        </div>
      </div>
      <MemberForm member={member} isSelf={member.id === user.id} />
    </div>
  );
}
