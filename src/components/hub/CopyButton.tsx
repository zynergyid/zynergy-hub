"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { buttonOutline } from "./form";

/** Copies text to the clipboard and confirms briefly. */
export function CopyButton({ text, label = "Salin", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={className ?? buttonOutline}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // Clipboard blocked: the text is still visible to select by hand.
        }
      }}
    >
      {done ? <Check className="size-4 text-secondary-dark" /> : <Copy className="size-4" />}
      {done ? "Tersalin" : label}
    </button>
  );
}
