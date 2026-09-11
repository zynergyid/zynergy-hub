import type { CollectionConfig } from "payload";
import { enforceUnit, moneyFieldRead, moneyFieldWrite, orderCreate, orderDelete, orderRead, orderWrite } from "@/lib/access";
import { documentKinds, orderStatuses, units } from "@/lib/options";

/**
 * Purchase orders received from buyers (Supply). One PO holds the structured
 * data for dashboards and invoicing plus every document that belongs to it.
 * Everyone in the unit may read a PO and change its status or documents;
 * prices are hidden from members and only money roles edit the PO data.
 */
const moneyOnly = { access: { update: moneyFieldWrite } };
const moneyHidden = { access: { read: moneyFieldRead, update: moneyFieldWrite } };
export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "Pesanan", plural: "Pesanan" },
  admin: { useAsTitle: "number", group: "Operasional" },
  access: {
    read: orderRead,
    create: orderCreate,
    update: orderWrite,
    delete: orderDelete,
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
  },
  defaultSort: "-orderDate",
  fields: [
    {
      name: "unit",
      type: "select",
      required: true,
      defaultValue: "supply",
      ...moneyOnly,
      label: "Unit bisnis",
      options: [...units],
    },
    {
      type: "row",
      fields: [
        { name: "number", type: "text", required: true, label: "Nomor PO", ...moneyOnly },
        { name: "revision", type: "number", defaultValue: 0, min: 0, label: "Revisi", ...moneyOnly },
      ],
    },
    { name: "client", type: "relationship", relationTo: "clients", required: true, label: "Klien", ...moneyOnly },
    {
      type: "row",
      fields: [
        { name: "orderDate", type: "date", required: true, label: "Tanggal PO", ...moneyOnly },
        { name: "deliveryDate", type: "date", label: "Tenggat kirim", ...moneyOnly },
      ],
    },
    { name: "shipTo", type: "textarea", label: "Tujuan kirim", ...moneyOnly },
    {
      type: "row",
      fields: [
        { name: "incoterm", type: "text", label: "Syarat kirim (Incoterm)", ...moneyOnly },
        { name: "paymentTermsDays", type: "number", defaultValue: 30, min: 0, label: "Termin (hari)", ...moneyOnly },
      ],
    },
    {
      name: "items",
      type: "array",
      label: "Item",
      ...moneyOnly,
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
        { name: "invoiceNumber", type: "text", label: "Nomor invoice", ...moneyOnly },
        { name: "invoiceDate", type: "date", label: "Tanggal invoice", ...moneyOnly },
        { name: "dueDate", type: "date", label: "Jatuh tempo bayar", ...moneyOnly },
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
