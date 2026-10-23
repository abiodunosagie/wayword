// FILE: hooks/use-week.ts
// This week's words and stories, and writing a new story from those words.
import * as Crypto from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { wordsSince } from '@/db/cards';
import { addStory, listStories } from '@/db/stories';
import { ApiError, writeStory } from '@/lib/api';
import type { Prefs, Story } from '@/lib/types';

const WEEK = 7 * 24 * 60 * 60 * 1000;
export const MIN_STORY_WORDS = 3;

export function useWeek(userId: string, prefs: Prefs) {
  const db = useSQLiteContext();
  const [words, setWords] = useState<{ word: string; meaning: string }[] | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    const [w, s] = await Promise.all([wordsSince(db, userId, prefs.target, Date.now() - WEEK), listStories(db, userId, prefs.target)]);
    setWords(w);
    setStories(s);
  }, [db, userId, prefs.target]);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => setWords([]));
    }, [load]),
  );
  useEffect(() => () => abort.current?.abort(), []);

  const write = useCallback(async () => {
    if (busy || !words || words.length < MIN_STORY_WORDS) return;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError(null);
    try {
      const reply = await writeStory(prefs, words, controller.signal);
      const story: Story = { ...reply, id: Crypto.randomUUID(), created_at: Date.now(), native: prefs.native, target: prefs.target };
      await addStory(db, userId, story);
      setStories((prev) => [story, ...prev]);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof ApiError ? e.message : 'Could not write the story. Try again.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, [busy, db, prefs, userId, words]);

  return { words, stories, busy, error, write };
}
