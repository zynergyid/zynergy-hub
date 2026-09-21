import type { CollectionConfig } from "payload";
import { createWith, enforceUnit, moneyFieldRead, unitRead, writeWith } from "@/lib/access";
import { documentKinds, orderStatuses, units } from "@/lib/options";
import { auditHooks } from "@/lib/audit";

/**
 * Purchase orders received from buyers (Supply). One PO holds the structured
 * data for dashboards and invoicing plus every document that belongs to it.
 * Everyone in the unit may read a PO; prices are hidden from members
 * (field-level read rule) and only editor roles change anything.
 */
const moneyHidden = { access: { read: moneyFieldRead } };
export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "Pesanan", plural: "Pesanan" },
  admin: { useAsTitle: "number", group: "Operasional" },
  access: {
    read: unitRead,
    create: createWith("editOrders"),
    update: writeWith("editOrders"),
    delete: writeWith("editOrders"),
  },
  hooks: {
    beforeChange: [
      enforceUnit,
      ({ data }) => {
        // The PO value follows the line items whenever there are any.
        const items = data?.items as { qty?: number; unitPrice?: number }[] | undefined;
        if (items && items.length > 0) {
          data.subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
        }
        // Net terms: due date defaults to invoice date plus the terms.
        if (data?.invoiceDate && !data.dueDate) {
          const due = new Date(data.invoiceDate);
          due.setDate(due.getDate() + (Number(data.paymentTermsDays) || 0));
          data.dueDate = due.toISOString();
        }
        return data;
      },
    ],
    ...auditHooks({ title: (d) => `PO ${d.number}`, unit: (d) => d.unit as string }),
  },
  defaultSort: "-orderDate",
  fields: [
    {
      name: "unit",
      type: "select",
      required: true,
      defaultValue: "supply",
      label: "Unit bisnis",
      options: [...units],
    },
    {
      type: "row",
      fields: [
        { name: "number", type: "text", required: true, label: "Nomor PO" },
        { name: "revision", type: "number", defaultValue: 0, min: 0, label: "Revisi" },
      ],
    },
    { name: "client", type: "relationship", relationTo: "clients", required: true, label: "Klien" },
    {
      // Big buyers have many purchasers; the person on this PO lives here, not on the client.
      type: "row",
      fields: [
        { name: "buyerName", type: "text", label: "Nama buyer" },
        { name: "buyerEmail", type: "email", label: "Email buyer" },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "orderDate", type: "date", required: true, label: "Tanggal PO" },
        { name: "deliveryDate", type: "date", label: "Tenggat kirim" },
      ],
    },
    { name: "shipTo", type: "textarea", label: "Tujuan kirim" },
    {
      type: "row",
      fields: [
        { name: "incoterm", type: "text", label: "Syarat kirim (Incoterm)" },
        { name: "paymentTermsDays", type: "number", defaultValue: 30, min: 0, label: "Termin (hari)" },
      ],
    },
    {
      name: "items",
      type: "array",
      label: "Item",
      fields: [
        {
          type: "row",
          fields: [
            { name: "material", type: "text", label: "Nomor material" },
            { name: "partNumber", type: "text", label: "Part number" },
          ],
        },
        { name: "description", type: "text", required: true, label: "Deskripsi" },
        {
          type: "row",
          fields: [
            { name: "qty", type: "number", required: true, min: 0, label: "Qty" },
            { name: "uom", type: "text", defaultValue: "each", label: "Satuan" },
            { name: "unitPrice", type: "number", required: true, min: 0, label: "Harga satuan", ...moneyHidden },
          ],
        },
      ],
    },
    {
      name: "subtotal",
      type: "number",
      min: 0,
      label: "Nilai PO (belum PPN)",
      ...moneyHidden,
      admin: { description: "Dihitung dari item kalau ada item." },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "diterima",
      options: [...orderStatuses],
    },
    {
      type: "row",
      fields: [
        { name: "invoiceNumber", type: "text", label: "Nomor invoice" },
        { name: "invoiceDate", type: "date", label: "Tanggal invoice" },
        { name: "dueDate", type: "date", label: "Jatuh tempo bayar" },
      ],
    },
    {
      name: "documents",
      type: "array",
      label: "Dokumen",
      fields: [
        { name: "kind", type: "select", required: true, defaultValue: "po", label: "Jenis", options: [...documentKinds] },
        { name: "file", type: "upload", relationTo: "documents", required: true, label: "Berkas" },
        { name: "note", type: "text", label: "Keterangan" },
      ],
    },
    { name: "notes", type: "textarea", label: "Catatan" },
  ],
};
