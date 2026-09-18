/**
 * Shown the moment a navigation starts, before the new page has rendered on
 * the server. Without it a click on a tab or menu shows nothing for a second
 * or two on production and feels ignored.
 */
export default function HubLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-label="Memuat">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-line" />
        <div className="h-4 w-72 rounded bg-line/70" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-64 rounded-xl bg-line/70" />
        <div className="h-9 w-40 rounded-xl bg-line/70" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl border border-line bg-white" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-line bg-white" />
    </div>
  );
}
