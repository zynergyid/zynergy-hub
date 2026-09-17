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
          const file = e.target.files?.[0];
          const tooBig = Boolean(file && file.size > MAX_UPLOAD_BYTES);
          e.target.setCustomValidity(tooBig ? MAX_UPLOAD_MESSAGE : "");
          setError(tooBig ? `${MAX_UPLOAD_MESSAGE} (berkas ini ${(file!.size / 1024 / 1024).toFixed(1)} MB)` : null);
          props.onChange?.(e);
        }}
      />
      {hint && !error && <p className="mt-1 text-xs text-muted">PDF atau gambar, maksimal {MAX_UPLOAD_MB} MB.</p>}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}
