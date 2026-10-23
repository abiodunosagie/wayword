// FILE: db/cards.ts
// The words you keep, with their practice schedule. One card per word per language for each
// account: keeping a word twice updates nothing and keeps its progress.
import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { fresh, type Grade, review } from '@/lib/srs';
import type { Card, SnapWord } from '@/lib/types';

export type NewWord = Partial<SnapWord> & { word: string; meaning: string };

/** Keeps [words]; returns how many were new. */
export async function keepWords(
  db: SQLiteDatabase,
  userId: string,
  pair: { native: string; target: string },
  words: NewWord[],
  snapId: string | null,
  now = Date.now(),
): Promise<number> {
  let added = 0;
  const schedule = fresh(now);
  await db.withTransactionAsync(async () => {
    for (const w of words) {
      const result = await db.runAsync(
        `INSERT OR IGNORE INTO cards (id, user_id, snap_id, created_at, native, target, word, meaning, part_of_speech,
           pronunciation, example, example_meaning, note, ease, interval_days, reps, lapses, due)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Crypto.randomUUID(),
        userId,
        snapId,
        now,
        pair.native,
        pair.target,
        w.word.trim(),
        w.meaning.trim(),
        w.part_of_speech ?? 'other',
        w.pronunciation ?? '',
        w.example ?? '',
        w.example_meaning ?? '',
        w.note ?? '',
        schedule.ease,
        schedule.interval_days,
        schedule.reps,
        schedule.lapses,
        schedule.due,
      );
      added += result.changes;
    }
  });
  return added;
}

export async function listCards(db: SQLiteDatabase, userId: string, target: string): Promise<Card[]> {
  return db.getAllAsync<Card>('SELECT * FROM cards WHERE user_id = ? AND target = ? ORDER BY created_at DESC', userId, target);
}

export async function keptWords(db: SQLiteDatabase, userId: string, target: string): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ word: string }>('SELECT word FROM cards WHERE user_id = ? AND target = ?', userId, target);
  return new Set(rows.map((r) => r.word));
}

export async function getCard(db: SQLiteDatabase, userId: string, id: string): Promise<Card | null> {
  return db.getFirstAsync<Card>('SELECT * FROM cards WHERE user_id = ? AND id = ?', userId, id);
}

export async function dueCards(db: SQLiteDatabase, userId: string, target: string, now: number, limit = 20): Promise<Card[]> {
  return db.getAllAsync<Card>(
    'SELECT * FROM cards WHERE user_id = ? AND target = ? AND due <= ? ORDER BY due ASC LIMIT ?',
    userId,
    target,
    now,
    limit,
  );
}

export async function countDue(db: SQLiteDatabase, userId: string, target: string, now: number): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM cards WHERE user_id = ? AND target = ? AND due <= ?',
    userId,
    target,
    now,
  );
  return row?.n ?? 0;
}

export async function gradeCard(db: SQLiteDatabase, userId: string, card: Card, grade: Grade, now = Date.now()): Promise<Card> {
  const next = review(card, grade, now);
  await db.runAsync(
    'UPDATE cards SET ease = ?, interval_days = ?, reps = ?, lapses = ?, due = ?, reviewed_at = ? WHERE user_id = ? AND id = ?',
    next.ease,
    next.interval_days,
    next.reps,
    next.lapses,
    next.due,
    now,
    userId,
    card.id,
  );
  return { ...card, ...next, reviewed_at: now };
}

export async function saveWhy(db: SQLiteDatabase, userId: string, id: string, why: string): Promise<void> {
  await db.runAsync('UPDATE cards SET why = ? WHERE user_id = ? AND id = ?', why, userId, id);
}

export async function deleteCard(db: SQLiteDatabase, userId: string, id: string): Promise<void> {
  await db.runAsync('DELETE FROM cards WHERE user_id = ? AND id = ?', userId, id);
}

/** Words kept since [since], newest first, for the week's story. */
export async function wordsSince(db: SQLiteDatabase, userId: string, target: string, since: number, limit = 30) {
  return db.getAllAsync<{ word: string; meaning: string }>(
    'SELECT word, meaning FROM cards WHERE user_id = ? AND target = ? AND created_at >= ? ORDER BY created_at DESC LIMIT ?',
    userId,
    target,
    since,
    limit,
  );
}
