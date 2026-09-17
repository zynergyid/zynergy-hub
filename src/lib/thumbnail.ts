/**
 * Browser-only: turn the first page of a PDF, or an image, into a small PNG
 * so the vault can show a preview without rendering anything on the server.
 * pdf.js is loaded only when a PDF is actually picked.
 */

const THUMB_WIDTH = 320;

async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

async function pdfThumbnail(file: File): Promise<Blob | null> {
  const pdfjs = await import("pdfjs-dist");
  // Served from public/, copied there on postinstall (scripts/copy-pdf-worker.mjs).
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const pdf = await task.promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport }).promise;
  await task.destroy();
  return canvasToPng(canvas);
}

async function imageThumbnail(file: File): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, THUMB_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bitmap.width * scale);
  canvas.height = Math.ceil(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasToPng(canvas);
}

/** Null when the file type is unsupported or rendering fails; the document still saves without a preview. */
export async function makeThumbnail(file: File): Promise<Blob | null> {
  try {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return await pdfThumbnail(file);
    if (file.type.startsWith("image/")) return await imageThumbnail(file);
    return null;
  } catch (error) {
    console.warn("thumbnail failed:", error);
    return null;
  }
}
