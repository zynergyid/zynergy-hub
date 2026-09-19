/**
 * Upload ceiling shared by the browser check and the server actions.
 * Vercel serverless functions reject request bodies over 4.5 MB, so the Hub
 * stops at 4 MB with a clear message instead of a bare 500.
 */
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_UPLOAD_MESSAGE = `Berkas maksimal ${MAX_UPLOAD_MB} MB. Kompres PDF atau foto dulu kalau lebih besar.`;

/**
 * What the `documents` collection (PO and project files) accepts. Office
 * files are here because clients send briefs, price lists, and decks as
 * Excel, Word, and PowerPoint; the collection config and the file pickers
 * read the same list so they never drift apart.
 */
export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/*",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "text/csv",
  "text/plain",
] as const;
export const DOCUMENT_ACCEPT = [...DOCUMENT_MIME_TYPES, ".xlsx", ".xls", ".docx", ".doc", ".pptx", ".ppt", ".csv", ".txt"].join(",");
export const DOCUMENT_TYPES_LABEL = "PDF, gambar, Excel, Word, PowerPoint, CSV";
