// FILE: db/snaps.ts
// Photos Claude has read, newest first, for the signed-in account.
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Snap, SnapWord } from '@/lib/types';

type Row = Omit<Snap, 'words'> & { words: string };

const toSnap = (r: Row): Snap => ({ ...r, words: JSON.parse(r.words) as SnapWord[] });

export async function addSnap(db: SQLiteDatabase, userId: string, snap: Snap): Promise<void> {
  await db.runAsync(
    `INSERT INTO snaps (id, user_id, created_at, native, target, photo, kind, title, source_text, translation, explanation, words)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    snap.id,
    userId,
    snap.created_at,
    snap.native,
    snap.target,
    snap.photo,
    snap.kind,
    snap.title,
    snap.source_text,
    snap.translation,
    snap.explanation,
    JSON.stringify(snap.words),
  );
}

export async function listSnaps(db: SQLiteDatabase, userId: string, target: string, limit = 50): Promise<Snap[]> {
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM snaps WHERE user_id = ? AND target = ? ORDER BY created_at DESC LIMIT ?',
    userId,
    target,
    limit,
  );
  return rows.map(toSnap);
}

export async function getSnap(db: SQLiteDatabase, userId: string, id: string): Promise<Snap | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM snaps WHERE user_id = ? AND id = ?', userId, id);
  return row ? toSnap(row) : null;
}

/** Deletes the snap; its cards stay, they just no longer show the photo. Returns the photo name. */
export async function deleteSnap(db: SQLiteDatabase, userId: string, id: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ photo: string }>('SELECT photo FROM snaps WHERE user_id = ? AND id = ?', userId, id);
  if (!row) return null;
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE cards SET snap_id = NULL WHERE user_id = ? AND snap_id = ?', userId, id);
    await db.runAsync('DELETE FROM snaps WHERE user_id = ? AND id = ?', userId, id);
  });
  return row.photo;
}
