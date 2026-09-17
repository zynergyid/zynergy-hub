import { splitLinks, shortUrl } from "@/lib/research";

/** Plain text with URLs turned into links, line breaks kept. */
export function Linkify({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className ?? "whitespace-pre-wrap text-sm leading-relaxed"}>
      {splitLinks(text).map((part, i) =>
        part.kind === "link" ? (
          <a key={i} href={part.value} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-primary hover:underline">
            {shortUrl(part.value)}
          </a>
        ) : (
          <span key={i}>{part.value}</span>
        ),
      )}
    </p>
  );
}
