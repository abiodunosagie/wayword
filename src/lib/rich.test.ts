// FILE: lib/rich.test.ts
import { describe, expect, it } from '@jest/globals';
import { blocks, spans } from './rich';

describe('formatting in answers', () => {
  it('reads bold and italics inside a line', () => {
    expect(spans('an **on-duty pharmacy** is *de serviço*')).toEqual([
      { text: 'an ' },
      { text: 'on-duty pharmacy', bold: true },
      { text: ' is ' },
      { text: 'de serviço', italic: true },
    ]);
  });

  it('splits paragraphs and dash lists, and drops heading marks', () => {
    expect(blocks('## Meaning\nOne line\nsame paragraph\n\n- first\n- second\n\nEnd').map((b) => [b.kind, b.spans[0].text])).toEqual([
      ['paragraph', 'Meaning One line same paragraph'],
      ['item', 'first'],
      ['item', 'second'],
      ['paragraph', 'End'],
    ]);
  });

  it('leaves a lone star or a times sign alone', () => {
    expect(spans('2 * 3 = 6')).toEqual([{ text: '2 * 3 = 6' }]);
  });
});
