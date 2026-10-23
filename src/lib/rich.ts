// FILE: lib/rich.ts
// The little formatting Claude's answers use (paragraphs, dash lists, **bold**, *italics*) turned
// into plain blocks the app draws itself. Anything else stays as written text.

export type Span = { text: string; bold?: boolean; italic?: boolean };
export type Block = { kind: 'paragraph' | 'item'; spans: Span[] };

export function spans(line: string): Span[] {
  const out: Span[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|_([^_\s][^_]*)_/g;
  let last = 0;
  for (let m = pattern.exec(line); m; m = pattern.exec(line)) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], bold: true });
    else out.push({ text: m[2] ?? m[3], italic: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out;
}

export function blocks(text: string): Block[] {
  const out: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) out.push({ kind: 'paragraph', spans: spans(paragraph.join(' ')) });
    paragraph = [];
  };
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    const item = /^[-*•]\s+(.*)$/.exec(line);
    if (!line) flush();
    else if (item) {
      flush();
      out.push({ kind: 'item', spans: spans(item[1]) });
    } else paragraph.push(line.replace(/^#+\s*/, ''));
  }
  flush();
  return out;
}
