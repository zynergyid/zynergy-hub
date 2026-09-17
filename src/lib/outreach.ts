import type { Prospect } from "@/payload-types";
import { getPayloadClient } from "@/lib/payload";
import { scopeUnits, type UnitFilter } from "@/lib/finance";
import { daysUntil } from "@/lib/format";
import { openProspectStatuses, prospectStatusOrder, type ProspectStatus, type Unit } from "@/lib/options";

export const primaryContact = (p: Prospect) => (p.contacts ?? [])[0] ?? null;
export const ownerOf = (p: Prospect) => (typeof p.owner === "object" && p.owner ? p.owner : null);
export const clientOfProspect = (p: Prospect) => (typeof p.client === "object" && p.client ? p.client : null);

/** A sent message with no reply whose nudge date has arrived. */
export const followUpDue = (p: Prospect) => p.status === "terkirim" && Boolean(p.nextFollowUpAt) && daysUntil(p.nextFollowUpAt as string) <= 0;

/** What a person should do next with this target, in one short phrase. */
export function nextAction(p: Prospect): string {
  switch (p.status) {
    case "baru":
      return "riset dulu";
    case "riset":
      return "susun draf";
    case "draf":
      return "periksa draf, lalu kirim";
    case "terkirim":
      return p.nextFollowUpAt ? (daysUntil(p.nextFollowUpAt) <= 0 ? "tindak lanjut sekarang" : "tunggu balasan") : "tunggu balasan";
    case "dibalas":
      return "lanjutkan percakapan";
    case "pertemuan":
      return "siapkan penawaran";
    case "klien":
      return "sudah jadi klien";
    default:
      return "";
  }
}

const ts = (iso?: string | null) => (iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER);

export async function getProspects(opts: { unit: UnitFilter; allowed: Unit[]; status?: ProspectStatus | "aktif" | "semua"; q?: string }): Promise<Prospect[]> {
  const scoped = scopeUnits(opts.unit, opts.allowed);
  if (scoped.length === 0) return [];
  const q = opts.q?.trim();
  const status = opts.status ?? "aktif";
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: "prospects",
    where: {
      and: [
        { unit: { in: scoped } },
        status === "aktif" ? { status: { in: [...openProspectStatuses] } } : status === "semua" ? {} : { status: { equals: status } },
        q ? { or: [{ company: { contains: q } }, { city: { contains: q } }, { "contacts.name": { contains: q } }] } : {},
      ],
    },
    limit: 1000,
    depth: 1,
  });
  // Due follow-ups first, then by how urgently a hand is needed, then freshest.
  return docs.sort((a, b) => {
    const da = followUpDue(a);
    const db = followUpDue(b);
    if (da !== db) return da ? -1 : 1;
    if (da && db) return ts(a.nextFollowUpAt) - ts(b.nextFollowUpAt);
    const oa = prospectStatusOrder.indexOf(a.status);
    const ob = prospectStatusOrder.indexOf(b.status);
    if (oa !== ob) return oa - ob;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export interface OutreachSummary {
  perluRiset: number;
  perluDraf: number;
  drafSiap: number;
  menunggu: number;
  due: Prospect[];
  dibalas: number;
}

export async function getOutreachSummary(unit: UnitFilter, allowed: Unit[]): Promise<OutreachSummary> {
  const open = await getProspects({ unit, allowed, status: "aktif" });
  const count = (s: ProspectStatus) => open.filter((p) => p.status === s).length;
  return {
    perluRiset: count("baru"),
    perluDraf: count("riset"),
    drafSiap: count("draf"),
    menunggu: count("terkirim"),
    due: open.filter(followUpDue),
    dibalas: count("dibalas") + count("pertemuan"),
  };
}
