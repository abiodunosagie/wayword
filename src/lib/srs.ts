// FILE: lib/srs.ts
// When each card comes back for practice: SM-2 spaced repetition, the scheme Anki grew from. A
// card you know comes back after longer and longer gaps; one you miss comes back in ten minutes
// and its gaps start again. Pure functions, so it runs offline and is covered by tests.

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export type Schedule = {
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  due: number;
};

const DAY = 24 * 60 * 60 * 1000;
const RELEARN = 10 * 60 * 1000;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

const clampEase = (e: number) => Math.min(MAX_EASE, Math.max(MIN_EASE, Math.round(e * 100) / 100));

/** A card nobody has practised yet: due straight away. */
export function fresh(now: number): Schedule {
  return { ease: 2.5, interval_days: 0, reps: 0, lapses: 0, due: now };
}

export function review(card: Schedule, grade: Grade, now: number): Schedule {
  if (grade === 'again') {
    return { ease: clampEase(card.ease - 0.2), interval_days: 0, reps: 0, lapses: card.lapses + 1, due: now + RELEARN };
  }
  let interval: number;
  let ease = card.ease;
  if (grade === 'hard') {
    interval = card.reps === 0 ? 1 : Math.max(card.interval_days + 1, Math.round(card.interval_days * 1.2));
    ease -= 0.15;
  } else if (grade === 'good') {
    interval = card.reps === 0 ? 1 : card.reps === 1 ? 3 : Math.round(card.interval_days * card.ease);
  } else {
    interval = card.reps === 0 ? 3 : Math.round(Math.max(card.interval_days, 1) * card.ease * 1.3);
    ease += 0.15;
  }
  interval = Math.max(1, interval);
  return { ease: clampEase(ease), interval_days: interval, reps: card.reps + 1, lapses: card.lapses, due: now + interval * DAY };
}

/** "in 10 minutes", "tomorrow", "in 3 days": shown on each grade button before you press it. */
export function whenNext(card: Schedule, grade: Grade, now: number): string {
  const next = review(card, grade, now);
  const minutes = Math.round((next.due - now) / 60000);
  if (minutes < 60) return `in ${minutes} min`;
  const days = next.interval_days;
  if (days === 1) return 'tomorrow';
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? 'in a month' : `in ${months} months`;
}
