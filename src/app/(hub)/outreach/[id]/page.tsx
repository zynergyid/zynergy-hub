import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, MessageCircle, Send } from "lucide-react";
import { canSeeMoney, getSessionUser } from "@/lib/session";
import { getPayloadClient } from "@/lib/payload";
import { canWriteUnit } from "@/lib/access";
import { getClientOptions, orderTotal } from "@/lib/orders";
import { clientOfProspect, followUpDue, nextAction, ownerOf, primaryContact } from "@/lib/outreach";
import { daysLabel, formatDate, formatIDR, todayLocal } from "@/lib/format";
import { outreachChannels, outreachLogLabel, prospectSectors, prospectStatuses } from "@/lib/options";
import { cn } from "@/lib/cn";
import { Card } from "@/components/hub/Card";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { CopyButton } from "@/components/hub/CopyButton";
import { OrderStatusPill } from "@/components/hub/OrderStatusPill";
import { ProspectStatusPill } from "@/components/hub/ProspectStatusPill";
import { Select } from "@/components/hub/Select";
import { deadlineText, deadlineTone } from "@/components/hub/deadline";
import { Label, buttonOutline, buttonPrimary, fieldClass } from "@/components/hub/form";
import { ProspectForm } from "../ProspectForm";
import { ResearchCard } from "../ResearchCard";
import { addNote, convertToClient, logFollowUp, logReply, markSent, saveDraft, setProspectStatus } from "../actions";

export const metadata: Metadata = { title: "Detail target" };
export const dynamic = "force-dynamic";

const sectorLabel = new Map<string, string>(prospectSectors.map((s) => [s.value, s.label]));
const channelLabel = new Map<string, string>(outreachChannels.map((c) => [c.value, c.label]));

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const prospectId = Number(id);
  if (!prospectId) notFound();
  const payload = await getPayloadClient();
  const p = await payload.findByID({ collection: "prospects", id: prospectId, depth: 1, disableErrors: true });
  if (!p || !user.units.includes(p.unit)) notFound();
  const editable = canWriteUnit(user, p.unit, "editClients");
  const contact = primaryContact(p);
  const owner = ownerOf(p);
  const client = clientOfProspect(p);
  const money = canSeeMoney(user);
  const [clients, clientOrders] = await Promise.all([
    getClientOptions(user.units),
    client ? payload.find({ collection: "orders", where: { client: { equals: client.id } }, sort: "-orderDate", limit: 5, depth: 0 }) : null,
  ]);
  const draft = p.draft ?? "";
  const waHref = contact?.phone ? `https://wa.me/${contact.phone.replace(/\D/g, "")}?text=${encodeURIComponent(draft)}` : null;
  const mailHref = contact?.email ? `mailto:${contact.email}?subject=${encodeURIComponent(p.draftSubject ?? "")}&body=${encodeURIComponent(draft)}` : null;
  const beforeSend = p.status === "baru" || p.status === "riset" || p.status === "draf";
  const log = [...(p.log ?? [])].reverse();

  return (
    <div className="space-y-5">
      <Link href="/outreach" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Semua target
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">{p.company}</h1>
            <ProspectStatusPill status={p.status} />
          </div>
          <p className="text-sm text-muted">
            {[p.sector ? sectorLabel.get(p.sector) : null, p.city, owner ? `PJ ${owner.name}` : null].filter(Boolean).join(" · ") || "detail belum lengkap"}
            {p.website && (
              <>
                {" "}·{" "}
                <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                  website <ExternalLink className="size-3" />
                </a>
              </>
            )}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">Langkah berikutnya: {nextAction(p)}</p>
        </div>
        {client && (
          <Link href={`/clients/${client.id}`} className={buttonOutline}>
            Buka klien
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <Card title="Draf pesan">
            {editable ? (
              <form action={saveDraft} className="space-y-3">
                <input type="hidden" name="id" value={p.id} />
                <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
                  <div>
                    <Label htmlFor="dr-subject">Subjek (email)</Label>
                    <input id="dr-subject" name="draftSubject" defaultValue={p.draftSubject ?? ""} className={fieldClass} placeholder="Perkenalan singkat" />
                  </div>
                  <div>
                    <Label htmlFor="dr-channel">Kanal</Label>
                    <Select id="dr-channel" name="draftChannel" defaultValue={p.draftChannel ?? (contact?.email ? "email" : "whatsapp")} options={outreachChannels} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="dr-body">Isi pesan</Label>
                  <textarea id="dr-body" name="draft" rows={11} defaultValue={draft} className={fieldClass} placeholder="Kosong. Jalankan /outreach di Claude Code untuk membuat draf, atau tulis sendiri." />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="submit" className={buttonPrimary}>Simpan draf</button>
                  {draft && <CopyButton text={draft} label="Salin isi" />}
                  {draft && waHref && (
                    <a href={waHref} target="_blank" rel="noopener noreferrer" className={buttonOutline}>
                      <MessageCircle className="size-4" /> Buka WhatsApp
                    </a>
                  )}
                  {draft && mailHref && (
                    <a href={mailHref} className={buttonOutline}>
                      <Mail className="size-4" /> Buka email
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted">Tombol WhatsApp dan email memakai draf yang tersimpan. Setelah mengirim, tandai di kartu Progres.</p>
              </form>
            ) : draft ? (
              <pre className="whitespace-pre-wrap font-sans text-sm">{draft}</pre>
            ) : (
              <p className="text-sm text-muted">Belum ada draf.</p>
            )}
          </Card>

          <Card title="Progres">
            {editable && beforeSend && (
              <form action={markSent} className="space-y-3">
                <input type="hidden" name="id" value={p.id} />
                <p className="text-sm text-muted">Sudah mengirim pesannya? Catat di sini; pengingat tindak lanjut dijadwalkan 7 hari kemudian.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="ms-channel">Kanal</Label>
                    <Select id="ms-channel" name="channel" defaultValue={p.draftChannel ?? (contact?.email ? "email" : "whatsapp")} options={outreachChannels} />
                  </div>
                  <div>
                    <Label htmlFor="ms-date">Tanggal kirim</Label>
                    <input id="ms-date" name="date" type="date" defaultValue={todayLocal()} className={fieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="ms-note">Catatan</Label>
                    <input id="ms-note" name="note" className={fieldClass} placeholder="opsional" />
                  </div>
                </div>
                <button type="submit" className={buttonPrimary}>
                  <Send className="size-4" /> Tandai terkirim
                </button>
              </form>
            )}
            {p.status === "terkirim" && (
              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                  <div>
                    <dt className="text-muted">Dikirim</dt>
                    <dd className="font-semibold">{p.lastSentAt ? formatDate(p.lastSentAt) : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Kanal</dt>
                    <dd className="font-semibold">{p.sentChannel ? channelLabel.get(p.sentChannel) : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Tindak lanjut berikutnya</dt>
                    <dd className={cn("font-semibold", p.nextFollowUpAt && deadlineText[deadlineTone(p.nextFollowUpAt, 2)])}>{p.nextFollowUpAt ? `${formatDate(p.nextFollowUpAt)} (${daysLabel(p.nextFollowUpAt)})` : "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Sudah ditindaklanjuti</dt>
                    <dd className="font-semibold">{p.followUpCount ?? 0} kali</dd>
                  </div>
                </dl>
                {editable && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <form action={logFollowUp} className="space-y-2 rounded-xl border border-line p-3">
                      <input type="hidden" name="id" value={p.id} />
                      <Label htmlFor="fu-note">{followUpDue(p) ? "Tindak lanjut jatuh tempo" : "Catat tindak lanjut"}</Label>
                      <input id="fu-note" name="note" className={fieldClass} placeholder="Misal: WA ulang, ditanya PIC baru" />
                      <button type="submit" className={buttonOutline}>Catat, jadwalkan 7 hari lagi</button>
                    </form>
                    <form action={logReply} className="space-y-2 rounded-xl border border-secondary/40 bg-secondary-soft/30 p-3">
                      <input type="hidden" name="id" value={p.id} />
                      <Label htmlFor="rp-note">Ada balasan</Label>
                      <input id="rp-note" name="note" className={fieldClass} placeholder="Inti balasannya" />
                      <button type="submit" className={buttonPrimary}>Catat balasan</button>
                    </form>
                  </div>
                )}
              </div>
            )}
            {(p.status === "dibalas" || p.status === "pertemuan") && (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  {p.repliedAt ? `Dibalas ${formatDate(p.repliedAt)}. ` : ""}Lanjutkan percakapan di kanalnya. Kalau sudah ada kesepakatan, jadikan klien supaya PO dan invoice bisa dicatat.
                </p>
                {editable && (
                  <form action={convertToClient}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message={client ? `Tandai ${p.company} aktif kembali sebagai klien?` : `Jadikan ${p.company} klien Supply? Data perusahaan dan kontak disalin ke Klien.`} className={buttonPrimary}>
                      {client ? "Tandai jadi klien lagi" : "Jadikan klien"}
                    </ConfirmButton>
                  </form>
                )}
              </div>
            )}
            {p.status === "klien" && <p className="text-sm text-muted">Sudah jadi klien{client ? "" : ", tetapi tautan kliennya kosong"}.</p>}
            {p.status === "berhenti" && <p className="text-sm text-muted">Dihentikan. Ubah status di bawah untuk membuka lagi.</p>}
            {editable && (
              <form action={setProspectStatus} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                <input type="hidden" name="id" value={p.id} />
                <div className="min-w-44">
                  <Label htmlFor="st-status">Ubah status</Label>
                  <Select id="st-status" name="status" defaultValue={p.status} options={prospectStatuses} size="compact" />
                </div>
                <div className="min-w-0 flex-1">
                  <Label htmlFor="st-note">Alasan</Label>
                  <input id="st-note" name="note" className={`${fieldClass} py-1.5 text-xs`} placeholder="opsional" />
                </div>
                <button type="submit" className={buttonOutline}>Simpan status</button>
              </form>
            )}
          </Card>

          <ResearchCard id={p.id} research={p.research ?? ""} researchedAt={p.researchedAt ? formatDate(p.researchedAt) : null} editable={editable} />

          <Card title="Riwayat">
            {log.length === 0 ? (
              <p className="text-sm text-muted">Belum ada catatan.</p>
            ) : (
              <ul className="divide-y divide-line">
                {log.map((l) => (
                  <li key={l.id ?? `${l.date}-${l.type}`} className="flex items-start gap-3 py-2.5 text-sm">
                    <span className="mt-0.5 shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-muted">{outreachLogLabel.get(l.type) ?? l.type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap">{l.note || "-"}</p>
                      <p className="text-xs text-muted">{formatDate(l.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {editable && (
              <form action={addNote} className="mt-3 flex gap-2 border-t border-line pt-3">
                <input type="hidden" name="id" value={p.id} />
                <input name="note" required className={`${fieldClass} py-2`} placeholder="Tambah catatan" />
                <button type="submit" className={buttonOutline}>Catat</button>
              </form>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-5 lg:col-span-2">
          {client && (
            <Card title="Klien terkait" action={{ label: "Buka klien", href: `/clients/${client.id}` }}>
              <p className="text-sm">
                <span className="font-semibold">{client.name}</span>
                {client.owner ? <span className="text-muted"> · {client.owner}</span> : null}
              </p>
              {clientOrders && clientOrders.docs.length > 0 ? (
                <ul className="mt-3 divide-y divide-line">
                  {clientOrders.docs.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div className="min-w-0">
                        <Link href={`/orders/${o.id}`} className="block truncate font-semibold hover:text-primary">{o.number}</Link>
                        <p className="text-xs text-muted">{formatDate(o.orderDate)}{money ? ` · ${formatIDR(orderTotal(o))}` : ""}</p>
                      </div>
                      <OrderStatusPill status={o.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">Belum ada PO tercatat untuk klien ini di Hub.</p>
              )}
            </Card>
          )}
          <ProspectForm prospect={p} units={user.units} clients={clients} canDelete={editable} readOnly={!editable} />
        </div>
      </div>
    </div>
  );
}
