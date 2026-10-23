// FILE: lib/format.ts
// Dates and counts as people say them. Formatters are made once, not on every render.
const day = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

export function when(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) return `Today, ${time.format(d)}`;
  const yesterday = new Date(now - 86_400_000);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return day.format(d);
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
