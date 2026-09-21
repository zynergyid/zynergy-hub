"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { revealPassword } from "./actions";

/** Shows the stored password on request, copies it, and hides it again after half a minute. */
export function RevealSecret({ id }: { id: number }) {
  const [value, setValue] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!value) return;
    const t = setTimeout(() => setValue(null), 30_000);
    return () => clearTimeout(t);
  }, [value]);
  const reveal = () =>
    start(async () => {
      const r = await revealPassword(id);
      if (r.status === "ok") {
        setValue(r.value);
        setMessage(null);
      } else setMessage(r.message);
    });
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMessage("Tidak bisa menyalin otomatis; pilih teksnya lalu salin.");
    }
  };
  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex flex-wrap items-center gap-2">
          <code className="select-all rounded-lg bg-surface-soft px-3 py-2 font-mono text-sm">{value}</code>
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold hover:bg-surface-soft">
            {copied ? <Check className="size-3.5 text-secondary-dark" /> : <Copy className="size-3.5" />}
            {copied ? "Tersalin" : "Salin"}
          </button>
          <button type="button" onClick={() => setValue(null)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface-soft">
            <EyeOff className="size-3.5" />
            Sembunyikan
          </button>
        </div>
      ) : (
        <button type="button" onClick={reveal} disabled={pending} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-surface-soft disabled:opacity-60">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
          Tampilkan password
        </button>
      )}
      {message && <p className="text-sm text-red-600">{message}</p>}
    </div>
  );
}
