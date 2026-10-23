// FILE: hooks/use-explain.ts
// Asks Claude "why?" about one word and shows the answer as it is written. The finished answer is
// saved on the card, so it is there next time without asking again. Leaving the screen stops it.
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { saveWhy } from '@/db/cards';
import { ApiError, explain } from '@/lib/api';
import type { Card, Prefs } from '@/lib/types';

export function useExplain(userId: string, prefs: Prefs, card: Card | null, context: string) {
  const db = useSQLiteContext();
  // The answer being written now, for this card; otherwise the one saved on the card.
  const [live, setLive] = useState<{ id: string; text: string } | null>(null);
  const answer = live && live.id === card?.id ? live.text : (card?.why ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const ask = useCallback(
    async (question: string) => {
      if (!card || busy) return;
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setBusy(true);
      setError(null);
      const id = card.id;
      setLive({ id, text: '' });
      let text = '';
      try {
        await explain(
          prefs,
          { phrase: card.word, context, question },
          (piece) => {
            text += piece;
            setLive({ id, text });
          },
          controller.signal,
        );
        if (text.trim()) await saveWhy(db, userId, card.id, text);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof ApiError ? e.message : 'Could not get an answer. Try again.');
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    },
    [busy, card, context, db, prefs, userId],
  );

  return { answer, busy, error, ask };
}
