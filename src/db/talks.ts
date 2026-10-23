// FILE: db/talks.ts
// Role-play conversations, kept so you can come back to one or read it again.
import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Talk, TalkTurn } from '@/lib/types';

type Row = Omit<Talk, 'turns' | 'finished'> & { turns: string; finished: number };

const toTalk = (r: Row): Talk => ({ ...r, turns: JSON.parse(r.turns) as TalkTurn[], finished: r.finished === 1 });

export async function saveTalk(db: SQLiteDatabase, userId: string, talk: Talk): Promise<void> {
  await db.runAsync(
    `INSERT INTO talks (id, user_id, created_at, updated_at, native, target, title, setting, turns, finished)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at, turns = excluded.turns, finished = excluded.finished
     WHERE talks.user_id = excluded.user_id`,
    talk.id,
    userId,
    talk.created_at,
    talk.updated_at,
    talk.native,
    talk.target,
    talk.title,
    talk.setting,
    JSON.stringify(talk.turns),
    talk.finished ? 1 : 0,
  );
}

export async function getTalk(db: SQLiteDatabase, userId: string, id: string): Promise<Talk | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM talks WHERE user_id = ? AND id = ?', userId, id);
  return row ? toTalk(row) : null;
}

export async function listTalks(db: SQLiteDatabase, userId: string, target: string, limit = 20): Promise<Talk[]> {
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM talks WHERE user_id = ? AND target = ? ORDER BY updated_at DESC LIMIT ?',
    userId,
    target,
    limit,
  );
  return rows.map(toTalk);
}

export async function deleteTalk(db: SQLiteDatabase, userId: string, id: string): Promise<void> {
  await db.runAsync('DELETE FROM talks WHERE user_id = ? AND id = ?', userId, id);
}

/** Starts a conversation for [scenario]; Claude's opening line comes when it is opened. */
export async function createTalk(
  db: SQLiteDatabase,
  userId: string,
  pair: { native: string; target: string },
  scenario: { title: string; setting: string },
): Promise<string> {
  const now = Date.now();
  const talk: Talk = {
    id: Crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    native: pair.native,
    target: pair.target,
    title: scenario.title,
    setting: scenario.setting,
    turns: [],
    finished: false,
  };
  await saveTalk(db, userId, talk);
  return talk.id;
}
