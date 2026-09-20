import type { CalendarItem } from "@/lib/calendar";

/**
 * Minimal iCalendar writer for the personal feed (RFC 5545). Timed items
 * become UTC instants, dated items all-day events; every line is folded at
 * 75 octets as the spec asks.
 */
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dayStamp = (key: string) => key.replace(/-/g, "");
const nextDay = (key: string) => new Date(new Date(`${key}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);

function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    let n = Math.min(out.length === 0 ? 75 : 74, bytes.length - i);
    // Never split a multibyte character.
    while (n > 1 && i + n < bytes.length && (bytes[i + n] & 0xc0) === 0x80) n--;
    out.push((out.length === 0 ? "" : " ") + bytes.subarray(i, i + n).toString("utf8"));
    i += n;
  }
  return out.join("\r\n");
}

export function buildIcs(items: CalendarItem[], opts: { name: string; baseUrl: string; now?: Date }): string {
  const now = stamp(opts.now ?? new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zynergy Hub//Kalender//ID", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escape(opts.name)}`, "X-WR-TIMEZONE:Asia/Jakarta"];
  for (const it of items) {
    lines.push("BEGIN:VEVENT", `UID:${it.id}@hub.zynergy.co.id`, `DTSTAMP:${now}`);
    if (it.time) {
      const start = new Date(it.start ?? `${it.date}T${it.time}:00+07:00`);
      const end = it.end ? new Date(it.end) : new Date(start.getTime() + 3600000);
      lines.push(`DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dayStamp(it.date)}`, `DTEND;VALUE=DATE:${dayStamp(nextDay(it.date))}`);
    }
    lines.push(`SUMMARY:${escape(it.title)}`);
    if (it.detail) lines.push(`DESCRIPTION:${escape(it.detail)}`);
    lines.push(`URL:${opts.baseUrl}${it.href}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
