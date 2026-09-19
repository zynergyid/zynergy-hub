"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import { DESCRIPTION_IDEAL, DESCRIPTION_MAX, TITLE_IDEAL, TITLE_MAX, siteSeoPages, type SeoPair, type SiteSeo } from "@/lib/site-seo";
import { AutoTextarea } from "@/components/hub/AutoTextarea";
import { ErrorText, Input, Label, buttonPrimary, fieldClass } from "@/components/hub/form";
import { updateSiteSeo, type SeoFormState } from "./actions";

const initial: SeoFormState = { status: "idle" };
const EMPTY_HINT = "Kosongkan untuk memakai bawaan situs";

/** Live character count; amber once Google would start cutting the text. */
function Counter({ length, ideal }: { length: number; ideal: number }) {
  return (
    <span className={cn("text-xs tabular-nums", length === 0 ? "text-muted" : length > ideal ? "text-amber-600" : "text-secondary-dark")}>
      {length}/{ideal}
    </span>
  );
}

function PairFields({ prefix, label, hint, value, current }: { prefix: string; label: string; hint?: string; value: SeoPair; current?: SeoPair }) {
  const [title, setTitle] = useState(value.title);
  const [description, setDescription] = useState(value.description);
  return (
    <fieldset className="space-y-3 rounded-xl border border-line p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      {hint && <p className="-mt-1 text-xs text-muted">{hint}</p>}
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`${prefix}.title`}>Judul</Label>
          <Counter length={title.length} ideal={TITLE_IDEAL} />
        </div>
        <Input id={`${prefix}.title`} name={`${prefix}.title`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={current?.title || EMPTY_HINT} maxLength={TITLE_MAX} />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`${prefix}.description`}>Deskripsi</Label>
          <Counter length={description.length} ideal={DESCRIPTION_IDEAL} />
        </div>
        <AutoTextarea id={`${prefix}.description`} name={`${prefix}.description`} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={fieldClass} placeholder={current?.description || EMPTY_HINT} maxLength={DESCRIPTION_MAX} />
      </div>
    </fieldset>
  );
}

/**
 * Title and description per page, saved to the site CMS. Empty = the site's
 * built-in default; `current` (what the last audit saw) is shown as the placeholder.
 */
export function SeoForm({ seo, current }: { seo: SiteSeo; current: Partial<Record<string, SeoPair>> }) {
  const [state, action, pending] = useActionState(updateSiteSeo, initial);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="businessProfileUrl">Tautan Google Business Profile</Label>
        <Input id="businessProfileUrl" name="businessProfileUrl" type="url" defaultValue={seo.businessProfileUrl} placeholder="https://g.page/... atau https://maps.app.goo.gl/..." />
        <p className="mt-1 text-xs text-muted">Diisi setelah profil dibuat di business.google.com. Situs menautkannya di footer dan structured data.</p>
      </div>
      <PairFields prefix="share" label="Saat dibagikan (WhatsApp, LinkedIn)" hint="Pratinjau tautan; berlaku untuk semua halaman yang tidak punya pratinjau sendiri." value={seo.share} />
      {siteSeoPages.map((p) => (
        <PairFields key={p.key} prefix={`pages.${p.key}`} label={`${p.label} (${p.path})`} value={seo.pages[p.key]} current={current[p.path]} />
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Menyimpan..." : "Simpan ke situs"}
        </button>
        {state.status === "error" && <ErrorText>{state.message}</ErrorText>}
        {state.status === "success" && <p className="text-sm text-secondary-dark">{state.message}</p>}
      </div>
    </form>
  );
}
