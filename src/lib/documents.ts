/** Existing document rows (on a PO or a project) as plain data, so an update keeps them. */
export const keepDocumentRows = <K extends string>(
  rows: { id?: string | null; kind: K; file: number | { id: number }; note?: string | null }[] | null | undefined,
) =>
  (rows ?? []).map((d) => ({
    id: d.id ?? undefined,
    kind: d.kind,
    file: typeof d.file === "object" && d.file ? d.file.id : d.file,
    note: d.note ?? null,
  }));
