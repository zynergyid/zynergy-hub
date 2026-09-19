import type { Project } from "@/payload-types";

/** Pure helpers for the client-facing brief document. */
export const MARK = "(?)";

/**
 * Two document styles. "lengkap" for companies: every section, a formal
 * signature block. "ringkas" for individuals and small businesses: only
 * what they decide on, plainer words, name and date to sign, and a
 * WhatsApp reply counts as confirmation.
 */
export type BriefStyle = "ringkas" | "lengkap";
export const briefStyles = [
  { label: "Ringkas", value: "ringkas" },
  { label: "Lengkap", value: "lengkap" },
] as const;

/** Companies get the full document by default; everyone else the short one. The page has a switch. */
export const defaultBriefStyle = (businessType?: string | null): BriefStyle => (businessType === "b2b" || businessType === "industri" ? "lengkap" : "ringkas");

export interface BriefSection {
  key: keyof NonNullable<Project["brief"]>;
  title: string;
  /** One line telling the client how to read the section. */
  lead: string;
  /** Shown in the short style too. */
  ringkas?: boolean;
}

export const briefSections: BriefSection[] = [
  { key: "goals", title: "Tujuan", lead: "Apa yang ingin dicapai usaha Anda dengan proyek ini.", ringkas: true },
  { key: "users", title: "Siapa yang memakai", lead: "Pengguna aplikasi dan bagaimana mereka memakainya." },
  { key: "currentFlow", title: "Cara kerja saat ini", lead: "Pemahaman kami tentang proses Anda hari ini." },
  { key: "targetFlow", title: "Cara kerja setelah aplikasi ada", lead: "Proses yang kami usulkan.", ringkas: true },
  { key: "successMeasure", title: "Ukuran keberhasilan", lead: "Yang akan kita cek bersama beberapa bulan setelah aplikasi dipakai." },
  { key: "constraints", title: "Hal yang perlu diputuskan bersama", lead: "Kendala yang kami lihat dan keputusan yang masih terbuka.", ringkas: true },
  { key: "references", title: "Referensi", lead: "Alat sejenis dan sumber metode yang kami jadikan pembanding." },
];

export const sectionsFor = (style: BriefStyle) => (style === "ringkas" ? briefSections.filter((s) => s.ringkas) : briefSections);

/** Lines (bullets, numbered items, sentences) that still carry a guess mark, cleaned for a checklist. */
export function confirmationItems(brief: Project["brief"], style: BriefStyle = "lengkap"): { section: string; text: string }[] {
  const out: { section: string; text: string }[] = [];
  for (const s of sectionsFor(style)) {
    const value = (brief?.[s.key] as string | null | undefined) ?? "";
    for (const raw of value.split(/\r?\n/)) {
      if (!raw.includes(MARK)) continue;
      const line = raw.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim();
      // A paragraph may hold several sentences; keep only the ones that were marked.
      // The mark usually follows the full stop ("... bekerja. (?)"), so a "(" that opens the mark never starts a new sentence.
      const sentences = line.split(/(?<=[.!?])\s+(?=[A-Z0-9"]|\((?!\?\)))/);
      for (const sentence of sentences) {
        if (!sentence.includes(MARK)) continue;
        const text = sentence.split(MARK).join("").replace(/\s{2,}/g, " ").trim();
        if (text) out.push({ section: s.title, text });
      }
    }
  }
  return out;
}
