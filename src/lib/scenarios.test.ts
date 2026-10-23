// FILE: lib/scenarios.test.ts
import { describe, expect, it } from '@jest/globals';
import { fromSnaps } from './scenarios';
import type { Snap } from './types';

const snap = (over: Partial<Snap>): Snap => ({
  id: 'a',
  created_at: 0,
  native: 'en',
  target: 'pt-PT',
  photo: 'a.jpg',
  kind: 'menu',
  title: 'Café menu',
  source_text: 'Galão 1,20',
  translation: '',
  explanation: '',
  words: [],
  ...over,
});

describe('situations from photos', () => {
  it('turns a menu into ordering from it, with the menu text as the setting', () => {
    expect(fromSnaps([snap({})])).toEqual([
      { key: 'snap:a', title: 'Ordering from this menu (Café menu)', setting: 'Galão 1,20', from: 'a' },
    ]);
  });

  it('skips photos with no text or no fitting situation, and stops at the maximum', () => {
    const snaps = [
      snap({ id: '1', source_text: '  ' }),
      snap({ id: '2', kind: 'other' }),
      ...['3', '4', '5'].map((id) => snap({ id, kind: 'sign' })),
    ];
    expect(fromSnaps(snaps, 2).map((s) => s.key)).toEqual(['snap:3', 'snap:4']);
  });

  it('keeps the title within the server limit however long the photo title is', () => {
    const title = fromSnaps([snap({ kind: 'letter', title: 'x'.repeat(300) })])[0].title;
    expect(title.length).toBeLessThanOrEqual(120);
  });

  it('caps a long text so the request stays small', () => {
    expect(fromSnaps([snap({ source_text: 'x'.repeat(5000) })])[0].setting).toHaveLength(2500);
  });
});
