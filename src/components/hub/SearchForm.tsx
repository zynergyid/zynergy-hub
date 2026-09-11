import { buttonOutline } from "./form";

/** Plain GET search that keeps the other filters as hidden fields. */
export function SearchForm({
  action,
  hidden = {},
  q,
  placeholder,
}: {
  action: string;
  hidden?: Record<string, string | undefined>;
  q: string;
  placeholder: string;
}) {
  return (
    <form className="flex gap-2" action={action}>
      {Object.entries(hidden).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <input
        name="q"
        defaultValue={q}
        placeholder={placeholder}
        className="rounded-xl border border-line bg-white px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <button type="submit" className={buttonOutline}>Cari</button>
    </form>
  );
}
