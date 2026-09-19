import { Trash2, Upload } from "lucide-react";
import { DOCUMENT_ACCEPT, DOCUMENT_TYPES_LABEL, MAX_UPLOAD_MB } from "@/lib/limits";
import { Card } from "./Card";
import { ConfirmButton } from "./ConfirmButton";
import { ErrorText, buttonOutline, fieldClass } from "./form";
import { FileInput } from "./FileInput";
import { Select } from "./Select";

export interface DocumentRow {
  id?: string | null;
  kind: string;
  file: number | { id: number; url?: string | null; filename?: string | null } | null;
  note?: string | null;
}

/**
 * Files that belong to one record (a PO, a project). The owner passes its own
 * server actions and the hidden field that names it; the card is the same everywhere.
 */
export function DocumentsCard({
  rows,
  kinds,
  defaultKind,
  editable,
  error,
  ownerField,
  ownerId,
  addAction,
  removeAction,
  empty,
}: {
  rows: DocumentRow[];
  kinds: readonly { label: string; value: string }[];
  defaultKind: string;
  editable: boolean;
  error?: string;
  ownerField: string;
  ownerId: number;
  addAction: (formData: FormData) => void | Promise<void>;
  removeAction: (formData: FormData) => void | Promise<void>;
  empty: string;
}) {
  const kindLabel = new Map(kinds.map((k) => [k.value, k.label]));
  return (
    <Card title="Dokumen">
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((d) => {
            const f = typeof d.file === "object" && d.file ? d.file : null;
            return (
              <li key={d.id ?? String(d.file)} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-muted">{kindLabel.get(d.kind) ?? d.kind}</span>
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
                  <form action={removeAction}>
                    <input type="hidden" name={ownerField} value={ownerId} />
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
        <form action={addAction} className="mt-4 space-y-2 border-t border-line pt-4">
          <input type="hidden" name={ownerField} value={ownerId} />
          <div className="grid grid-cols-2 gap-2">
            <Select name="kind" defaultValue={defaultKind} options={kinds} size="compact" />
            <input name="note" placeholder="Keterangan (opsional)" className={`${fieldClass} px-2.5 py-1.5 text-xs`} />
          </div>
          <FileInput name="file" required accept={DOCUMENT_ACCEPT} hint={false} />
          <p className="text-xs text-muted">{DOCUMENT_TYPES_LABEL}, maksimal {MAX_UPLOAD_MB} MB. Berkas lebih besar: taruh tautan Drive di keterangan.</p>
          <ErrorText>{error === "berkas" ? `Berkas gagal diunggah. Pastikan jenisnya ${DOCUMENT_TYPES_LABEL} dan ukurannya di bawah ${MAX_UPLOAD_MB} MB.` : null}</ErrorText>
          <button type="submit" className={buttonOutline}>
            <Upload className="size-4" />
            Unggah
          </button>
        </form>
      )}
    </Card>
  );
}
