"use client";

import { useState } from "react";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MESSAGE, MAX_UPLOAD_MB } from "@/lib/limits";
import { ErrorText, fileInputClass } from "./form";

/**
 * File picker that refuses oversized files before the form is sent. A server
 * action never runs when the request body is too large, so the check has to
 * live here to produce a readable message.
 */
export function FileInput({ hint = true, ...props }: React.ComponentProps<"input"> & { hint?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <input
        type="file"
        {...props}
        className={props.className ?? fileInputClass}
        onChange={(e) => {
          // One request carries every selected file, so the total counts too.
          const files = [...(e.target.files ?? [])];
          const biggest = files.reduce((m, f) => Math.max(m, f.size), 0);
          const total = files.reduce((sum, f) => sum + f.size, 0);
          const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
          const message =
            biggest > MAX_UPLOAD_BYTES
              ? `${MAX_UPLOAD_MESSAGE} (berkas terbesar ${mb(biggest)} MB)`
              : total > MAX_UPLOAD_BYTES
                ? `Total berkas ${mb(total)} MB melebihi ${MAX_UPLOAD_MB} MB sekali unggah. Pilih lebih sedikit, sisanya unggah setelah tersimpan.`
                : null;
          e.target.setCustomValidity(message ? MAX_UPLOAD_MESSAGE : "");
          setError(message);
          props.onChange?.(e);
        }}
      />
      {hint && !error && <p className="mt-1 text-xs text-muted">PDF atau gambar, maksimal {MAX_UPLOAD_MB} MB.</p>}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
