// FILE: lib/talk-rules.test.ts
import { describe, expect, it } from '@jest/globals';

import { MAX_TURNS, needsReply, outOfRoom, yourTurn } from './talk-rules';
import type { Talk, TalkTurn } from './types';

const talk = (turns: TalkTurn['role'][], finished = false): Talk => ({
  id: 't',
  created_at: 0,
  updated_at: 0,
  native: 'en',
  target: 'pt-PT',
  title: 'Coffee',
  setting: '',
  turns: turns.map((role) => ({ role, text: 'x' })),
  finished,
});

describe('whose turn it is', () => {
  it('a new scene waits for the other person, then it is yours', () => {
    expect(needsReply(talk([]))).toBe(true);
    expect(yourTurn(talk([]))).toBe(false);
    expect(yourTurn(talk(['assistant']))).toBe(true);
  });

  it('after an unanswered line of yours, you cannot add another; the reply is asked for again', () => {
    const t = talk(['assistant', 'user']);
    expect(yourTurn(t)).toBe(false);
    expect(needsReply(t)).toBe(true);
  });

  it('a finished scene takes no more lines', () => {
    const t = talk(['assistant'], true);
    expect(yourTurn(t)).toBe(false);
    expect(needsReply(t)).toBe(false);
  });

  it('stops before the server limit and says the scene ran out of room', () => {
    const full = talk(Array.from({ length: MAX_TURNS - 1 }, (_, i) => (i % 2 === 0 ? 'assistant' : 'user')));
    expect(full.turns.at(-1)?.role).toBe('assistant');
    expect(yourTurn(full)).toBe(true);
    const fuller = talk(Array.from({ length: MAX_TURNS + 1 }, (_, i) => (i % 2 === 0 ? 'assistant' : 'user')));
    expect(yourTurn(fuller)).toBe(false);
    expect(outOfRoom(fuller)).toBe(true);
  });
});
