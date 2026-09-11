import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { canEditClients, canSeeMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { formatDate, formatIDR } from "@/lib/format";
import { categoryLabel, clientStatuses } from "@/lib/options";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/hub/Avatar";
import { Card } from "@/components/hub/Card";
import { ClientForm } from "../ClientForm";

export const metadata: Metadata = { title: "Detail klien" };
export const dynamic = "force-dynamic";

export default async function KlienDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const clientId = Number(id);
  if (!clientId) notFound();

  const payload = await getPayloadClient();
  const client = await payload.findByID({ collection: "clients", id: clientId, disableErrors: true });
  if (!client || !user.units.includes(client.unit)) notFound();
  const tx = canSeeMoney(user)
    ? await payload.find({ collection: "transactions", where: { client: { equals: clientId } }, sort: "-date", limit: 8 })
    : null;
  const statusLabel = clientStatuses.find((s) => s.value === client.status)?.label;

  return (
    <div className="space-y-5">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Semua klien
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={client.name} className="size-12 text-sm" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{client.name}</h1>
            <p className="text-sm text-muted">
              {[client.owner, client.city].filter(Boolean).join(" · ") || "detail belum lengkap"} ·{" "}
              <span className="font-semibold">{statusLabel}</span>
            </p>
          </div>
        </div>
        <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-white hover:bg-secondary-dark">
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ClientForm client={client} canDelete={user.role === "admin"} readOnly={!canEditClients(user)} units={user.units} />
        </div>
        {tx && (
          <Card title="Transaksi klien ini" action={{ label: "Arus kas", href: `/cash-flow?unit=${client.unit}&q=${encodeURIComponent(client.name)}` }} className="lg:col-span-2">
            {tx.docs.length === 0 ? (
              <p className="text-sm text-muted">Belum ada transaksi.</p>
            ) : (
              <ul className="divide-y divide-line">
                {tx.docs.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.reference || categoryLabel.get(t.category)}</p>
                      <p className="text-xs text-muted">{formatDate(t.date)} · {categoryLabel.get(t.category)}</p>
                    </div>
                    <span className={cn("shrink-0 font-extrabold", t.type === "masuk" ? "text-secondary-dark" : "text-red-600")}>
                      {t.type === "masuk" ? "+" : "-"}{formatIDR(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
