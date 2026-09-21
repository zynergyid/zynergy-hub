import type { CollectionConfig } from "payload";
import { createWith, isLoggedIn } from "@/lib/access";
import { accountPlatforms, accountStatuses } from "@/lib/options";
import { auditHooks } from "@/lib/audit";

/**
 * Registry of the company's digital accounts (social profiles, email,
 * domain, hosting): who holds them, which email and phone they are tied
 * to, how 2FA works, and where the password is kept. Never the password
 * itself; the Hub is not a password manager.
 */
export const Accounts: CollectionConfig = {
  slug: "accounts",
  labels: { singular: "Akun digital", plural: "Akun digital" },
  admin: { useAsTitle: "name", group: "Operasional" },
  access: {
    read: isLoggedIn,
    create: createWith("editVault"),
    update: createWith("editVault"),
    delete: createWith("editVault"),
  },
  defaultSort: "platform",
  hooks: auditHooks({ title: (d) => String(d.name) }),
  fields: [
    {
      type: "row",
      fields: [
        { name: "platform", type: "select", required: true, defaultValue: "lainnya", label: "Platform", options: [...accountPlatforms] },
        { name: "status", type: "select", required: true, defaultValue: "belum", label: "Status", options: [...accountStatuses] },
      ],
    },
    { name: "name", type: "text", required: true, label: "Nama akun", admin: { description: "Contoh: @zynergyid, admin@zynergy.co.id, zynergy.co.id" } },
    { name: "url", type: "text", label: "Tautan" },
    { name: "holder", type: "relationship", relationTo: "users", label: "Pemegang" },
    {
      type: "row",
      fields: [
        { name: "loginEmail", type: "text", label: "Email login" },
        { name: "phone", type: "text", label: "Nomor HP terkait" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "twoFactor", type: "text", label: "Verifikasi dua langkah", admin: { description: "Contoh: SMS ke HP kantor, Google Authenticator di HP Danish" } },
        { name: "passwordWhere", type: "text", label: "Password disimpan di", admin: { description: "Contoh: Bitwarden tim, brankas fisik. Jangan tulis password-nya." } },
      ],
    },
    { name: "notes", type: "textarea", label: "Catatan" },
  ],
};
