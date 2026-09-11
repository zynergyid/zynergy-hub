import { Trash2, Upload } from "lucide-react";
import type { Order } from "@/payload-types";
import { documentKindLabel, documentKinds } from "@/lib/options";
import { Card } from "@/components/hub/Card";
import { ConfirmButton } from "@/components/hub/ConfirmButton";
import { ErrorText, buttonOutline, fieldClass, fileInputClass } from "@/components/hub/form";
import { Select } from "@/components/hub/Select";
import { addDocument, removeDocument } from "./actions";

/** Every file that belongs to a PO: the buyer's PDF, our invoice, delivery note, tax invoice, payment proof. */
export function DocumentsCard({ order, editable, error }: { order: Order; editable: boolean; error?: string }) {
  const docs = order.documents ?? [];
  return (
    <Card title="Dokumen">
      {docs.length === 0 ? (
        <p className="text-sm text-muted">Belum ada dokumen. Unggah PDF PO dari pembeli dulu.</p>
      ) : (
        <ul className="divide-y divide-line">
          {docs.map((d) => {
            const f = typeof d.file === "object" && d.file ? d.file : null;
            return (
              <li key={d.id ?? String(d.file)} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-muted">{documentKindLabel.get(d.kind)}</span>
                <div className="min-w-0 flex-1">
                  {f?.url ? (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold text-primary hover:underline">
                      {f.filename}
                    </a>
                  ) : (
                    <span className="text-muted">berkas hilang</span>
                  )}
                  {d.note && <p className="truncate text-xs text-muted">{d.note}</p>}
                </div>
                {editable && d.id && (
                  <form action={removeDocument}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="rowId" value={d.id} />
                    <ConfirmButton message="Hapus dokumen ini?" aria-label="Hapus dokumen" className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </ConfirmButton>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {editable && (
        <form action={addDocument} className="mt-4 space-y-2 border-t border-line pt-4">
          <input type="hidden" name="orderId" value={order.id} />
          <div className="grid grid-cols-2 gap-2">
            <Select name="kind" defaultValue="po" options={documentKinds} size="compact" />
            <input name="note" placeholder="Keterangan (opsional)" className={`${fieldClass} px-2.5 py-1.5 text-xs`} />
          </div>
          <input name="file" type="file" required accept="application/pdf,image/*" className={fileInputClass} />
          <ErrorText>{error === "berkas" ? "Berkas gagal diunggah. Pastikan PDF atau gambar yang utuh, maksimal 8MB." : null}</ErrorText>
          <button type="submit" className={buttonOutline}>
            <Upload className="size-4" />
            Unggah
          </button>
        </form>
      )}
    </Card>
  );
}
