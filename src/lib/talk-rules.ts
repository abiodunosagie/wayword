// FILE: lib/talk-rules.ts
// Whose turn it is in a role play. The server accepts turns that alternate, starting with the
// other person and ending on you, and at most 40 of them, so the app follows the same rules.
import type { Talk } from './types';

export const MAX_TURNS = 40;

/** You can speak when the other person spoke last and your line plus their reply still fit. */
export function yourTurn(talk: Talk): boolean {
  const last = talk.turns[talk.turns.length - 1];
  return !talk.finished && last?.role === 'assistant' && talk.turns.length + 2 <= MAX_TURNS + 1;
}

/** The other person still owes a reply: the scene is new, or your line was not answered. */
export function needsReply(talk: Talk): boolean {
  const last = talk.turns[talk.turns.length - 1];
  return !talk.finished && (last === undefined || last.role === 'user') && talk.turns.length <= MAX_TURNS;
}

/** The scene ran out of room without reaching its natural end. */
export function outOfRoom(talk: Talk): boolean {
  return !talk.finished && !yourTurn(talk) && !needsReply(talk);
}
