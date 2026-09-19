"use client";

import { Printer } from "lucide-react";
import { buttonPrimary } from "./form";

/** Opens the browser's print dialog; "Save as PDF" there is the download. */
export function PrintButton({ label = "Simpan sebagai PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`${buttonPrimary} print:hidden`}>
      <Printer className="size-4" />
      {label}
    </button>
  );
}
