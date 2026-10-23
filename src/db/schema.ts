// FILE: db/schema.ts
// The phone's own database. Everything Wayword keeps (photos read, cards, practice, talks and
// stories) lives here and never on the server. Every row carries the account it belongs to, so a
// second person signing in on the same phone sees only their own words.
import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'wayword.db';
const VERSION = 1;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= VERSION) return;
  if (current < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE snaps (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        native TEXT NOT NULL,
        target TEXT NOT NULL,
        photo TEXT NOT NULL,
        kind TEXT NOT NULL,
        title TEXT NOT NULL,
        source_text TEXT NOT NULL,
        translation TEXT NOT NULL,
        explanation TEXT NOT NULL,
        words TEXT NOT NULL
      );
      CREATE INDEX snaps_user ON snaps (user_id, created_at DESC);
      CREATE TABLE cards (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        snap_id TEXT,
        created_at INTEGER NOT NULL,
        native TEXT NOT NULL,
        target TEXT NOT NULL,
        word TEXT NOT NULL,
        meaning TEXT NOT NULL,
        part_of_speech TEXT NOT NULL DEFAULT 'other',
        pronunciation TEXT NOT NULL DEFAULT '',
        example TEXT NOT NULL DEFAULT '',
        example_meaning TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        why TEXT NOT NULL DEFAULT '',
        ease REAL NOT NULL,
        interval_days INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        lapses INTEGER NOT NULL,
        due INTEGER NOT NULL,
        reviewed_at INTEGER
      );
      CREATE UNIQUE INDEX cards_user_word ON cards (user_id, target, word);
      CREATE INDEX cards_due ON cards (user_id, target, due);
      CREATE TABLE talks (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        native TEXT NOT NULL,
        target TEXT NOT NULL,
        title TEXT NOT NULL,
        setting TEXT NOT NULL,
        turns TEXT NOT NULL,
        finished INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX talks_user ON talks (user_id, updated_at DESC);
      CREATE TABLE stories (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        native TEXT NOT NULL,
        target TEXT NOT NULL,
        title TEXT NOT NULL,
        title_meaning TEXT NOT NULL,
        paragraphs TEXT NOT NULL,
        used TEXT NOT NULL
      );
      CREATE INDEX stories_user ON stories (user_id, created_at DESC);
    `);
  }
  await db.execAsync(`PRAGMA user_version = ${VERSION}`);
}
