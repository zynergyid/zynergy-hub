/** Small helpers for reading FormData in server actions. */

export const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export const digits = (v: string) => v.replace(/\D/g, "");

/** Keep a value only when it is one of the allowed options. */
export const pick = <T extends readonly { value: string }[]>(opts: T, v: string) =>
  opts.some((o) => o.value === v) ? (v as T[number]["value"]) : undefined;

/** YYYY-MM-DD from a date input to an ISO string at local noon, or null. */
export const dateOrNull = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`).toISOString() : null);
