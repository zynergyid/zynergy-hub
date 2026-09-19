/**
 * Claude Code skills that ship with this repo (.claude/skills/<name>/SKILL.md).
 * They run on a developer's own Claude Code seat and talk to the Hub through
 * the REST API with that person's API key (Profil). Listed on the Alat page.
 */
export interface HubSkill {
  command: string;
  title: string;
  /** What it does, one sentence. */
  what: string;
  /** The moment to run it. */
  when: string;
  /** Variants, if any. */
  modes?: string[];
  /** Hard limits the skill keeps. */
  never: string;
}

export const hubSkills: HubSkill[] = [
  {
    command: "/outreach",
    title: "Riset dan draf outreach",
    what: "Membaca antrean target Outreach, meriset perusahaan lewat web, menulis hasil riset dan draf pesan perkenalan ke Hub.",
    when: "Setiap ada target berstatus Perlu riset atau Perlu draf. Target satu per hari.",
    never: "Tidak pernah mengirim pesan dan tidak mengubah status jadi Terkirim.",
  },
  {
    command: "/brief",
    title: "Brief proyek",
    what: "Menyusun brief (analisis bisnis satu halaman) sebuah proyek Digital/Apps dari catatan pertemuan dan dokumen klien, langsung tersimpan di kartu Brief.",
    when: "Setelah pertemuan discovery atau setelah menerima dokumen klien, selama proyek masih di tahap Discovery.",
    modes: ["/brief <nama proyek>: susun atau perbarui brief", "/brief pertanyaan <nama>: daftar pertanyaan discovery", "/brief arsitektur <nama>: ARCHITECTURE.md di repo aplikasi klien"],
    never: "Tidak pernah mencentang konfirmasi klien, mengubah tahap, atau mengarang fakta; dugaan ditandai (?).",
  },
];

/** Where the key goes; the file is read by every skill. */
export const skillEnvPath = "~/.config/zynergy-hub/env";
export const skillEnvExample = `HUB_URL=https://hub.zynergy.co.id\nHUB_API_KEY=<kunci dari halaman Profil>\nSENDER_NAME=<nama Anda>`;
