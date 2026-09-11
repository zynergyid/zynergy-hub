/** Helpers for pages that read filters from the URL. */
export type Search = Record<string, string | string[] | undefined>;

export const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Build a path with merged query params; undefined removes a key. */
export function buildHref(path: string, base: Search, patch: Record<string, string | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...patch })) {
    const val = first(v as string | string[] | undefined);
    if (val) params.set(k, val);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
