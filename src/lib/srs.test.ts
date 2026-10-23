import { describe, expect, it } from '@jest/globals';
import { fresh, review, whenNext } from './srs';

const NOW = Date.UTC(2026, 9, 23, 9);
const DAY = 86_400_000;

describe('spaced repetition', () => {
  it('a new card is due now and grows 1, 3, then ease times the gap', () => {
    let card = fresh(NOW);
    expect(card.due).toBe(NOW);
    card = review(card, 'good', NOW);
    expect([card.interval_days, card.due]).toEqual([1, NOW + DAY]);
    card = review(card, 'good', NOW);
    expect(card.interval_days).toBe(3);
    card = review(card, 'good', NOW);
    expect(card.interval_days).toBe(8); // 3 x 2.5, rounded
    expect(card.reps).toBe(3);
  });

  it('missing a card brings it back in ten minutes, counts a lapse and lowers ease', () => {
    const known = { ease: 2.5, interval_days: 20, reps: 5, lapses: 0, due: NOW };
    const missed = review(known, 'again', NOW);
    expect(missed).toEqual({ ease: 2.3, interval_days: 0, reps: 0, lapses: 1, due: NOW + 10 * 60_000 });
  });

  it('ease never drops below 1.3 or climbs above 3', () => {
    let card = fresh(NOW);
    for (let i = 0; i < 20; i++) card = review(card, 'again', NOW);
    expect(card.ease).toBe(1.3);
    for (let i = 0; i < 20; i++) card = review(card, 'easy', NOW);
    expect(card.ease).toBe(3);
  });

  it('hard always moves a learned card at least one day further', () => {
    const card = { ease: 1.3, interval_days: 1, reps: 3, lapses: 2, due: NOW };
    expect(review(card, 'hard', NOW).interval_days).toBe(2);
  });

  it('labels what each button will do', () => {
    const card = fresh(NOW);
    expect(whenNext(card, 'again', NOW)).toBe('in 10 min');
    expect(whenNext(card, 'good', NOW)).toBe('tomorrow');
    expect(whenNext(card, 'easy', NOW)).toBe('in 3 days');
    expect(whenNext({ ease: 2.5, interval_days: 40, reps: 6, lapses: 0, due: NOW }, 'good', NOW)).toBe('in 3 months');
  });
});
