import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDownLeft, ArrowLeft, CalendarClock, FileText, ListChecks, Wallet } from "lucide-react";
import { canEditMoney, canSeeMoney, getSessionUser } from "@/lib/session";
import { canTouchOrder } from "@/lib/access";
import { getPayloadClient } from "@/lib/payload";
import { clientOf, getClientOptions, getOrderPayments, nextDate, orderTotal } from "@/lib/orders";
import { daysLabel, formatDate, formatIDR } from "@/lib/format";
import { first, type Search } from "@/lib/search";
import { Card } from "@/components/hub/Card";
import { KpiCard } from "@/components/hub/KpiCard";
import { OrderStatusPill } from "@/components/hub/OrderStatusPill";
import { TxList } from "@/components/hub/TxList";
import { DocumentsCard } from "../DocumentsCard";
import { OrderForm } from "../OrderForm";
import { StatusCard } from "../StatusCard";

export const metadata: Metadata = { title: "Detail PO" };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) notFound();
  const sp = await searchParams;

  const payload = await getPayloadClient();
  const order = await payload.findByID({ collection: "orders", id: orderId, depth: 1, disableErrors: true });
  if (!order || !user.units.includes(order.unit)) notFound();
  const money = canSeeMoney(user);
  const editable = canEditMoney(user);
  const canTouch = canTouchOrder(user, order.unit);
  const [clients, payments] = await Promise.all([
    getClientOptions(user.units),
    money ? getOrderPayments(orderId) : Promise.resolve({ rows: [], paid: 0, cost: 0 }),
  ]);
  const client = clientOf(order);
  const total = orderTotal(order);
  const remaining = Math.max(total - payments.paid, 0);
  const next = nextDate(order);
  const addPaymentHref = `/cash-flow?unit=${order.unit}&add=1&order=${order.id}`;
  const canPay = editable && remaining > 0 && order.status !== "batal";
  const deadlineCard = (
    <KpiCard
      icon={CalendarClock}
      label={next ? `Tenggat ${next.label}` : "Tenggat"}
      value={next ? formatDate(next.iso) : "-"}
      hint={next ? daysLabel(next.iso) : order.status === "dibayar" ? "selesai" : "tidak ada tenggat"}
      tone={next ? "primary" : "neutral"}
    />
  );

  return (
    <div className="space-y-5">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Semua pesanan
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">PO {order.number}</h1>
            {order.revision ? <span className="rounded bg-surface-soft px-1.5 py-0.5 text-[11px] font-bold text-muted">rev {order.revision}</span> : null}
            <OrderStatusPill status={order.status} />
          </div>
          <p className="text-sm text-muted">
            {client ? (
              <Link href={`/clients/${client.id}`} className="font-semibold hover:text-primary">{client.name}</Link>
            ) : (
              "klien terhapus"
            )}{" "}
            · PO tanggal {formatDate(order.orderDate)}
            {order.incoterm ? ` · ${order.incoterm}` : ""}
          </p>
          {(order.buyerName || order.buyerEmail) && (
            <p className="text-sm text-muted">
              Buyer: <span className="font-semibold">{order.buyerName ?? "-"}</span>
              {order.buyerEmail && (
                <>
                  {" "}· <a href={`mailto:${order.buyerEmail}`} className="hover:text-primary">{order.buyerEmail}</a>
                </>
              )}
            </p>
          )}
        </div>
        {canPay && (
          <Link href={addPaymentHref} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-white hover:bg-secondary-dark">
            <ArrowDownLeft className="size-4" />
            Catat pembayaran
          </Link>
        )}
      </div>

      {money ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard icon={FileText} label="Nilai PO" value={formatIDR(total)} hint="belum termasuk PPN" tone="primary" />
          <KpiCard icon={ArrowDownLeft} label="Sudah dibayar" value={formatIDR(payments.paid)} hint={payments.cost ? `biaya terkait ${formatIDR(payments.cost)}` : undefined} tone="in" />
          <KpiCard icon={Wallet} label="Sisa tagihan" value={formatIDR(remaining)} tone={remaining ? "out" : "neutral"} hint={order.invoiceNumber ? `invoice ${order.invoiceNumber}` : "belum ada invoice"} />
          {deadlineCard}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <KpiCard icon={ListChecks} label="Item" value={String(order.items?.length ?? 0)} hint="baris di PO" tone="primary" />
          {deadlineCard}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <OrderForm order={order} units={user.units} clients={clients} canDelete={editable} readOnly={!editable} showMoney={money} />
        </div>
        <div className="space-y-5 lg:col-span-2">
          {canTouch && !editable && <StatusCard order={order} />}
          <DocumentsCard order={order} editable={canTouch} error={first(sp.error)} />
          {money && (
            <Card title="Transaksi PO ini" action={canPay ? { label: "Catat pembayaran", href: addPaymentHref } : undefined}>
              <TxList rows={payments.rows} editable={editable} empty="Belum ada uang masuk atau biaya yang ditautkan ke PO ini." />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
