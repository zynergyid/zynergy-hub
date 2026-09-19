import { shortUrl, splitLinks } from "@/lib/research";

/**
 * Renders the small Markdown subset people and the /brief skill actually
 * write: paragraphs, "- " bullet lists, "1. " numbered lists, **bold**, and
 * bare URLs as links. No HTML passes through, so the text is safe as is.
 */
type Block = { kind: "p"; lines: string[] } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[]; start: number };

function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  const close = () => {
    if (current) blocks.push(current);
    current = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      close();
      continue;
    }
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (bullet) {
      if (current?.kind !== "ul") {
        close();
        current = { kind: "ul", items: [] };
      }
      current.items.push(bullet[1]);
    } else if (numbered) {
      if (current?.kind !== "ol") {
        close();
        current = { kind: "ol", items: [], start: Number(numbered[1]) || 1 };
      }
      current.items.push(numbered[2]);
    } else {
      if (current?.kind !== "p") {
        close();
        current = { kind: "p", lines: [] };
      }
      current.lines.push(line);
    }
  }
  close();
  return blocks;
}

/** The "(?)" mark the /brief skill puts after a guess, shown as a chip for clients. */
const MARK = "(?)";

/** Bold and links inside one line; "(?)" becomes a chip when asked. */
function Inline({ text, marks }: { text: string; marks: "raw" | "chip" }) {
  const chunks = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const plain = (value: string, key: number) => {
    if (marks === "raw" || !value.includes(MARK)) return <span key={key}>{value}</span>;
    return (
      <span key={key}>
        {value.split(MARK).map((piece, k, all) => (
          <span key={k}>
            {piece}
            {k < all.length - 1 && <span className="mx-1 inline-block rounded-full bg-amber-50 px-1.5 py-px align-middle text-[10px] font-bold text-amber-700">perlu konfirmasi</span>}
          </span>
        ))}
      </span>
    );
  };
  return (
    <>
      {chunks.map((chunk, i) => {
        const bold = chunk.match(/^\*\*([^*]+)\*\*$/);
        const inner = bold ? bold[1] : chunk;
        const nodes = splitLinks(inner).map((part, j) =>
          part.kind === "link" ? (
            <a key={j} href={part.value} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-primary hover:underline">
              {shortUrl(part.value)}
            </a>
          ) : (
            plain(part.value, j)
          ),
        );
        return bold ? <strong key={i} className="font-semibold text-ink">{nodes}</strong> : <span key={i}>{nodes}</span>;
      })}
    </>
  );
}

export function MarkdownLite({ text, className, marks = "raw" }: { text: string; className?: string; marks?: "raw" | "chip" }) {
  const blocks = toBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className={className ?? "space-y-2 text-sm leading-relaxed"}>
      {blocks.map((b, i) => {
        if (b.kind === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {b.items.map((it, j) => (
                <li key={j}><Inline text={it} marks={marks} /></li>
              ))}
            </ul>
          );
        }
        if (b.kind === "ol") {
          return (
            <ol key={i} start={b.start} className="list-decimal space-y-1 pl-5">
              {b.items.map((it, j) => (
                <li key={j}><Inline text={it} marks={marks} /></li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i}>
            {b.lines.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                <Inline text={l} marks={marks} />
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
