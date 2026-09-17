/**
 * Turns the plain-text research the /outreach skill writes into sections and
 * a source list for display. Tolerant: unknown headings still become
 * sections, and text without headings renders as one block.
 */

export interface ResearchSection {
  title: string;
  body: string;
}

export interface ParsedResearch {
  sections: ResearchSection[];
  sources: string[];
}

const URL_RE = /https?:\/\/[^\s|<>"')\]]+/g;
const HEADING_RE = /^([A-Za-z][^:\n]{2,60}):\s*(.*)$/;
const SOURCE_TITLES = new Set(["sumber", "sources", "referensi"]);

export function parseResearch(text: string): ParsedResearch {
  const sections: ResearchSection[] = [];
  let current: ResearchSection | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const m = line.match(HEADING_RE);
    // A heading is a short label followed by a colon; URLs also contain colons, so exclude those.
    if (m && !/^https?:/i.test(line) && !m[1].includes("http")) {
      current = { title: m[1].trim(), body: m[2].trim() };
      sections.push(current);
    } else if (current) {
      current.body = current.body ? `${current.body}\n${line}` : line;
    } else if (line.trim()) {
      current = { title: "", body: line };
      sections.push(current);
    }
  }
  const sourceSections = sections.filter((s) => SOURCE_TITLES.has(s.title.toLowerCase()));
  const sources = [...new Set(sourceSections.flatMap((s) => s.body.match(URL_RE) ?? []))];
  return {
    sections: sections.filter((s) => !SOURCE_TITLES.has(s.title.toLowerCase())).map((s) => ({ ...s, body: s.body.trim() })),
    sources,
  };
}

/** Split text into plain and link parts so URLs can be rendered as anchors. */
export function splitLinks(text: string): { kind: "text" | "link"; value: string }[] {
  const parts: { kind: "text" | "link"; value: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ kind: "text", value: text.slice(last, start) });
    parts.push({ kind: "link", value: m[0] });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

/** "trakindo.co.id/mining-indonesia-expo-2026" style label for a URL. */
export function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    const label = `${u.hostname.replace(/^www\./, "")}${path}`;
    return label.length > 48 ? `${label.slice(0, 45)}...` : label;
  } catch {
    return url;
  }
}
