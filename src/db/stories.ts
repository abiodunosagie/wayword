// FILE: db/stories.ts
// The weekly stories Claude wrote from your words.
import type { SQLiteDatabase } from 'expo-sqlite';

import type { Story } from '@/lib/types';

type Row = Omit<Story, 'paragraphs' | 'used'> & { paragraphs: string; used: string };

const toStory = (r: Row): Story => ({ ...r, paragraphs: JSON.parse(r.paragraphs), used: JSON.parse(r.used) });

export async function addStory(db: SQLiteDatabase, userId: string, story: Story): Promise<void> {
  await db.runAsync(
    `INSERT INTO stories (id, user_id, created_at, native, target, title, title_meaning, paragraphs, used)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    story.id,
    userId,
    story.created_at,
    story.native,
    story.target,
    story.title,
    story.title_meaning,
    JSON.stringify(story.paragraphs),
    JSON.stringify(story.used),
  );
}

export async function listStories(db: SQLiteDatabase, userId: string, target: string, limit = 20): Promise<Story[]> {
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM stories WHERE user_id = ? AND target = ? ORDER BY created_at DESC LIMIT ?',
    userId,
    target,
    limit,
  );
  return rows.map(toStory);
}

export async function getStory(db: SQLiteDatabase, userId: string, id: string): Promise<Story | null> {
  const row = await db.getFirstAsync<Row>('SELECT * FROM stories WHERE user_id = ? AND id = ?', userId, id);
  return row ? toStory(row) : null;
}

export async function deleteStory(db: SQLiteDatabase, userId: string, id: string): Promise<void> {
  await db.runAsync('DELETE FROM stories WHERE user_id = ? AND id = ?', userId, id);
}

/** Everything one account kept on this phone, for account deletion. Returns the photo names. */
export async function deleteAccountData(db: SQLiteDatabase, userId: string): Promise<string[]> {
  const photos = await db.getAllAsync<{ photo: string }>('SELECT photo FROM snaps WHERE user_id = ?', userId);
  await db.withTransactionAsync(async () => {
    for (const table of ['cards', 'snaps', 'talks', 'stories']) {
      await db.runAsync(`DELETE FROM ${table} WHERE user_id = ?`, userId);
    }
  });
  return photos.map((p) => p.photo);
}
