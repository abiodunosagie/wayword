// FILE: lib/sse.ts
// Splits a server-sent event stream into events. Network chunks can end anywhere, even inside a
// multi-byte letter or halfway through a line, so text is decoded as a stream and only whole
// "data:" lines are parsed.

export type ServerEvent =
  | { type: 'text'; text: string }
  | { type: 'done'; stop_reason: string | null }
  | { type: 'error'; message: string };

export class SseParser {
  private buffer = '';

  /** Feeds decoded text; returns every event completed by it. */
  push(text: string): ServerEvent[] {
    this.buffer += text;
    const events: ServerEvent[] = [];
    let end: number;
    while ((end = this.buffer.indexOf('\n\n')) >= 0) {
      const block = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 2);
      for (const line of block.split('\n')) {
        if (!line.startsWith('data:')) continue;
        try {
          const event = JSON.parse(line.slice(5).trim());
          if (event && typeof event.type === 'string') events.push(event as ServerEvent);
        } catch {
          // A malformed line is skipped rather than ending the whole answer.
        }
      }
    }
    return events;
  }
}
