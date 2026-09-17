import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import { canEditClients, canEditMoney, canSeeMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { getOrders, nextDate, orderTotal } from "@/lib/orders";
import { nextAction } from "@/lib/outreach";
import { openProspectStatuses } from "@/lib/options";
import { daysLabel, formatDate, formatIDR } from "@/lib/format";
import { clientStatuses } from "@/lib/options";
import { first, type Search } from "@/lib/search";
import { Avatar } from "@/components/hub/Avatar";
import { Card } from "@/components/hub/Card";
import { ErrorText } from "@/components/hub/form";
import { OrderStatusPill } from "@/components/hub/OrderStatusPill";
import { ProspectStatusPill } from "@/components/hub/ProspectStatusPill";
import { buttonOutline } from "@/components/hub/form";
import { startOutreachFromClient } from "../../outreach/actions";
import { TxList } from "@/components/hub/TxList";
import { ClientForm } from "../ClientForm";

export const metadata: Metadata = { title: "Detail klien" };
export const dynamic = "force-dynamic";

export default async function KlienDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const clientId = Number(id);
  if (!clientId) notFound();
  const sp = await searchParams;

  const payload = await getPayloadClient();
  const client = await payload.findByID({ collection: "clients", id: clientId, disableErrors: true });
  if (!client || !user.units.includes(client.unit)) notFound();
  const money = canSeeMoney(user);
  const isSupply = client.unit === "supply";
  const [tx, orders, prospects] = await Promise.all([
    money ? payload.find({ collection: "transactions", where: { client: { equals: clientId } }, sort: "-date", limit: 8 }) : null,
    money && isSupply ? getOrders({ unit: client.unit, allowed: user.units, filter: "semua", clientId }) : null,
    payload.find({ collection: "prospects", where: { client: { equals: clientId } }, sort: "-updatedAt", limit: 5, depth: 0 }),
  ]);
  const hasOpenOutreach = prospects.docs.some((p) => openProspectStatuses.includes(p.status));
  const statusLabel = clientStatuses.find((s) => s.value === client.status)?.label;
  const blocked = Number(first(sp.blocked) || 0);

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
        <div className="flex flex-wrap gap-2">
          {isSupply && canEditMoney(user) && (
            <Link href={`/orders/new?client=${client.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
              <Plus className="size-4" />
              PO baru
            </Link>
          )}
          {client.whatsapp && (
            <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-white hover:bg-secondary-dark">
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <ErrorText>{blocked ? `Klien ini punya ${blocked} PO, jadi tidak bisa dihapus. Hapus atau pindahkan PO-nya dulu.` : null}</ErrorText>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ClientForm client={client} canDelete={user.role === "admin"} readOnly={!canEditClients(user)} units={user.units} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <Card title="Outreach" action={prospects.docs.length ? { label: "Semua outreach", href: `/outreach?status=semua&q=${encodeURIComponent(client.name)}` } : undefined}>
            {prospects.docs.length === 0 ? (
              <p className="text-sm text-muted">Belum pernah didekati lewat Outreach.</p>
            ) : (
              <ul className="divide-y divide-line">
                {prospects.docs.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <Link href={`/outreach/${p.id}`} className="block truncate font-semibold hover:text-primary">{nextAction(p) || "target"}</Link>
                      <p className="text-xs text-muted">{p.lastSentAt ? `dikirim ${formatDate(p.lastSentAt)}` : `dibuat ${formatDate(p.createdAt)}`}</p>
                    </div>
                    <ProspectStatusPill status={p.status} />
                  </li>
                ))}
              </ul>
            )}
            {canEditClients(user) && !hasOpenOutreach && (
              <form action={startOutreachFromClient} className="mt-3 border-t border-line pt-3">
                <input type="hidden" name="clientId" value={client.id} />
                <button type="submit" className={buttonOutline}>Mulai outreach</button>
                <p className="mt-1 text-xs text-muted">Membuat target terisi dari data klien ini, tertaut, dengan sumber klien lama.</p>
              </form>
            )}
          </Card>
          {orders && (
            <Card title="PO klien ini" action={{ label: "Semua pesanan", href: `/orders?unit=${client.unit}&filter=semua&q=${encodeURIComponent(client.name)}` }}>
              {orders.length === 0 ? (
                <p className="text-sm text-muted">Belum ada PO.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {orders.slice(0, 6).map((o) => {
                    const next = nextDate(o);
                    return (
                      <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <div className="min-w-0">
                          <Link href={`/orders/${o.id}`} className="block truncate font-semibold hover:text-primary">{o.number}</Link>
                          <p className="truncate text-xs text-muted">
                            {formatDate(o.orderDate)}
                            {next ? ` · ${next.label} ${daysLabel(next.iso)}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-extrabold">{formatIDR(orderTotal(o))}</span>
                          <OrderStatusPill status={o.status} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          )}
          {tx && (
            <Card title="Transaksi klien ini" action={{ label: "Arus kas", href: `/cash-flow?unit=${client.unit}&q=${encodeURIComponent(client.name)}` }}>
              <TxList rows={tx.docs} editable={canEditMoney(user)} empty="Belum ada transaksi." />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
