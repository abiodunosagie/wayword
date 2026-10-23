// FILE: hooks/use-talk.ts
// One role-play conversation: loads it, asks Claude for the opening line when it is new, sends
// your lines, and saves every turn on the phone. Turns always alternate, as the server requires:
// you can only speak after the other person has, and a reply that failed is asked for again
// instead of stacking a second line of yours. A conversation you open and leave without a single
// line is removed, so the list only shows real ones.
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { deleteTalk, getTalk, saveTalk } from '@/db/talks';
import { ApiError, talkTurn } from '@/lib/api';
import { needsReply, yourTurn } from '@/lib/talk-rules';
import type { Prefs, Talk, TalkTurn } from '@/lib/types';

export function useTalk(userId: string, prefs: Prefs, id: string) {
  const db = useSQLiteContext();
  const [talk, setTalk] = useState<Talk | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const latest = useRef<Talk | null>(null);
  // Set synchronously, so two taps in the same frame cannot both send.
  const sending = useRef(false);

  const step = useCallback(
    async (current: Talk) => {
      if (sending.current) return;
      sending.current = true;
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setBusy(true);
      setError(null);
      try {
        const reply = await talkTurn(prefs, { title: current.title, setting: current.setting }, current.turns, controller.signal);
        if (controller.signal.aborted) return;
        const turns = [...current.turns];
        const last = turns[turns.length - 1];
        if (last?.role === 'user' && reply.correction.corrected.trim()) {
          turns[turns.length - 1] = { ...last, corrected: reply.correction.corrected, why: reply.correction.why };
        }
        turns.push({ role: 'assistant', text: reply.reply, meaning: reply.reply_meaning, words: reply.words });
        const next: Talk = { ...current, turns, finished: reply.finished, updated_at: Date.now() };
        latest.current = next;
        setTalk(next);
        await saveTalk(db, userId, next);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof ApiError ? e.message : 'Could not get a reply. Try again.');
      } finally {
        sending.current = false;
        if (!controller.signal.aborted) setBusy(false);
      }
    },
    [db, prefs, userId],
  );

  useEffect(() => {
    let alive = true;
    getTalk(db, userId, id).then(
      (found) => {
        if (!alive) return;
        latest.current = found;
        setTalk(found);
        if (found && found.turns.length === 0) step(found);
      },
      () => alive && setTalk(null),
    );
    return () => {
      alive = false;
      abort.current?.abort();
      const last = latest.current;
      if (last && !last.turns.some((turn) => turn.role === 'user')) deleteTalk(db, userId, last.id).catch(() => {});
    };
  }, [db, userId, id]); // eslint-disable-line react-hooks/exhaustive-deps -- runs once per conversation

  const send = useCallback(
    async (text: string) => {
      const current = latest.current;
      const line = text.trim();
      if (!current || !line || sending.current || !yourTurn(current)) return;
      const turn: TalkTurn = { role: 'user', text: line };
      const next = { ...current, turns: [...current.turns, turn], updated_at: Date.now() };
      latest.current = next;
      setTalk(next);
      await saveTalk(db, userId, next);
      await step(next);
    },
    [db, step, userId],
  );

  // After a failed reply, ask again for the same turn without resending anything.
  const retry = useCallback(() => {
    const current = latest.current;
    if (current && needsReply(current)) step(current);
  }, [step]);

  return { talk, busy, error, send, retry };
}
