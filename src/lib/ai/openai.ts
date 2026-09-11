import { aiModels } from "@/lib/options";

/**
 * Reads a buyer's purchase order PDF with the OpenAI Responses API and returns
 * the fields the Hub needs. Layout does not matter: the model reads by meaning
 * and the JSON schema pins the output shape. Nothing here writes to the
 * database; the caller decides what to keep.
 */

export const OPENAI_MODEL = "gpt-5-mini";

export interface ExtractedItem {
  material: string | null;
  part_number: string | null;
  description: string;
  qty: number;
  uom: string | null;
  unit_price: number | null;
}

export interface ExtractedPo {
  po_number: string | null;
  revision: number | null;
  order_date: string | null;
  delivery_date: string | null;
  buyer_company: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  vendor_number: string | null;
  payment_terms_days: number | null;
  incoterm: string | null;
  ship_to: string | null;
  total_excl_tax: number | null;
  currency: string | null;
  notes: string | null;
  items: ExtractedItem[];
}

export interface AiCallUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

const nullable = (type: string, description?: string) => ({ type: [type, "null"], ...(description ? { description } : {}) });

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    po_number: nullable("string", "The purchase order number as printed"),
    revision: nullable("integer", "Revision number if the PO says it is a revision, else null"),
    order_date: nullable("string", "PO date as YYYY-MM-DD"),
    delivery_date: nullable("string", "Requested delivery date as YYYY-MM-DD"),
    buyer_company: nullable("string", "Company that issued the PO (the customer), without internal codes"),
    buyer_name: nullable("string", "Purchasing contact person named on the PO"),
    buyer_email: nullable("string"),
    vendor_number: nullable("string", "The SUPPLIER's vendor number in the buyer's system, from labels like 'Your Vendor Number' or 'Vendor No'"),
    payment_terms_days: nullable("integer", "Payment terms in days, e.g. 30 for 'Net 30 Days'"),
    incoterm: nullable("string", "Delivery term and place, e.g. 'DDP Cakung Cilincing'"),
    ship_to: nullable("string", "Full delivery address, single line"),
    total_excl_tax: nullable("number", "Total PO value before VAT as a plain number"),
    currency: nullable("string", "ISO currency code, e.g. IDR"),
    notes: nullable("string", "Special invoicing, tax, or shipping instructions, summarized briefly in Indonesian"),
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          material: nullable("string", "Buyer's material or item number"),
          part_number: nullable("string", "Manufacturer part number"),
          description: { type: "string", description: "Short product description as printed, at most 200 characters" },
          qty: { type: "number" },
          uom: nullable("string", "Unit of measure, e.g. each, pcs, roll"),
          unit_price: nullable("number", "Price per unit before tax as a plain number"),
        },
        required: ["material", "part_number", "description", "qty", "uom", "unit_price"],
      },
    },
  },
  required: [
    "po_number", "revision", "order_date", "delivery_date", "buyer_company", "buyer_name", "buyer_email",
    "vendor_number", "payment_terms_days", "incoterm", "ship_to", "total_excl_tax", "currency", "notes", "items",
  ],
};

const instructions = [
  "This PDF is a purchase order that a buyer sent to our company. We are the supplier (vendor).",
  "Extract the fields into the JSON schema. Use null for anything not printed on the document; never guess.",
  "Dates must be YYYY-MM-DD. Amounts must be plain numbers without thousand separators or currency symbols.",
  "buyer_company is the customer issuing the PO, not the supplier. vendor_number is our number in their system.",
  "One item per line item on the PO. Combine short and long descriptions when both exist.",
].join(" ");

export const costUsd = (model: string, inputTokens: number, outputTokens: number) => {
  const price = aiModels[model];
  return price ? (inputTokens * price.input + outputTokens * price.output) / 1_000_000 : 0;
};

interface ResponsesOutputPart {
  type: string;
  text?: string;
  refusal?: string;
}
interface ResponsesBody {
  output?: { type: string; content?: ResponsesOutputPart[] }[];
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string };
}

/** Local development without a key returns a labeled sample so the screen can be exercised for free. */
function mock(): { data: ExtractedPo; usage: AiCallUsage } {
  return {
    data: {
      po_number: "PO-CONTOH-001",
      revision: 0,
      order_date: "2026-09-01",
      delivery_date: "2026-09-30",
      buyer_company: "PT Tambang Nusantara",
      buyer_name: "Bagian Pengadaan",
      buyer_email: "procurement@contoh.local",
      vendor_number: "V-000123",
      payment_terms_days: 30,
      incoterm: "DDP Cakung",
      ship_to: "Gudang Cakung Cilincing, Jakarta Utara",
      total_excl_tax: 18500000,
      currency: "IDR",
      notes: "Contoh hasil baca tanpa API (OPENAI_API_KEY belum diatur di lokal).",
      items: [{ material: "40412345", part_number: "GLC-SX-MMD", description: "Transceiver SFP 10G", qty: 20, uom: "each", unit_price: 925000 }],
    },
    usage: { model: "mock", inputTokens: 0, outputTokens: 0, costUsd: 0 },
  };
}

export async function extractPurchaseOrder(file: File): Promise<{ data: ExtractedPo; usage: AiCallUsage }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") return mock();
    throw new Error("OPENAI_API_KEY belum diatur di server.");
  }
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: [
            { type: "input_file", filename: file.name || "po.pdf", file_data: `data:application/pdf;base64,${base64}` },
            { type: "input_text", text: instructions },
          ],
        },
      ],
      text: { format: { type: "json_schema", name: "purchase_order", schema, strict: true } },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as ResponsesBody;
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${body.error?.message ?? "permintaan ditolak"}`);
  const message = body.output?.find((o) => o.type === "message");
  const part = message?.content?.find((c) => c.type === "output_text");
  const refusal = message?.content?.find((c) => c.type === "refusal");
  if (!part?.text) throw new Error(refusal?.refusal ? `Model menolak: ${refusal.refusal}` : "Model tidak mengembalikan JSON.");
  const data = JSON.parse(part.text) as ExtractedPo;
  const inputTokens = body.usage?.input_tokens ?? 0;
  const outputTokens = body.usage?.output_tokens ?? 0;
  return { data, usage: { model: OPENAI_MODEL, inputTokens, outputTokens, costUsd: costUsd(OPENAI_MODEL, inputTokens, outputTokens) } };
}
