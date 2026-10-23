import { describe, expect, it } from '@jest/globals';
import { SseParser } from './sse';

describe('server-sent events', () => {
  it('waits for whole events across chunks that split lines anywhere', () => {
    const parser = new SseParser();
    expect(parser.push('data: {"type":"te')).toEqual([]);
    expect(parser.push('xt","text":"Olá"}\n')).toEqual([]);
    expect(parser.push('\ndata: {"type":"done","stop_reason":"end_turn"}\n\n')).toEqual([
      { type: 'text', text: 'Olá' },
      { type: 'done', stop_reason: 'end_turn' },
    ]);
  });

  it('skips broken lines and lines that are not data', () => {
    const parser = new SseParser();
    expect(parser.push(': ping\n\ndata: {oops\n\ndata: {"type":"text","text":"a"}\n\n')).toEqual([
      { type: 'text', text: 'a' },
    ]);
  });
});
