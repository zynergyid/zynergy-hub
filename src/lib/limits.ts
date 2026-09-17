/**
 * Upload ceiling shared by the browser check and the server actions.
 * Vercel serverless functions reject request bodies over 4.5 MB, so the Hub
 * stops at 4 MB with a clear message instead of a bare 500.
 */
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_UPLOAD_MESSAGE = `Berkas maksimal ${MAX_UPLOAD_MB} MB. Kompres PDF atau foto dulu kalau lebih besar.`;
