// FILE: hooks/use-snap-reader.ts
// The Snap flow as one state machine: pick or take a photo, shrink it, send it to Claude, keep it
// with what Claude read, then open the result. Only one photo is handled at a time, and the
// buttons are off from the moment one is picked. Leaving the screen or tapping Cancel stops the
// work at whatever step it is on, and a failed read keeps the photo so Try again needs no new one.
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { addSnap } from '@/db/snaps';
import { ApiError, readPhoto } from '@/lib/api';
import { deletePhoto, keepPhoto, PhotoError, pickPhoto, type Prepared, preparePhoto } from '@/lib/photos';
import type { Prefs } from '@/lib/types';

export type SnapState =
  | { step: 'idle' }
  | { step: 'preparing' }
  | { step: 'reading'; uri: string }
  | { step: 'failed'; message: string; photo: Prepared | null };

const NO_TEXT = 'Claude could not find text to read in that photo. Try a closer, sharper one.';

export function useSnapReader(userId: string, prefs: Prefs) {
  const db = useSQLiteContext();
  const [state, setState] = useState<SnapState>({ step: 'idle' });
  // The work in progress; replacing or aborting it stops every later step of the old one.
  const current = useRef<AbortController | null>(null);

  useEffect(() => () => current.current?.abort(), []);

  const begin = () => {
    current.current?.abort();
    const controller = new AbortController();
    current.current = controller;
    return controller;
  };

  const read = useCallback(
    async (photo: Prepared, controller: AbortController) => {
      setState({ step: 'reading', uri: photo.uri });
      let stored: string | null = null;
      try {
        const reading = await readPhoto(prefs, photo.base64, controller.signal);
        if (controller.signal.aborted) return;
        if (!reading.readable || !reading.source_text.trim()) {
          setState({ step: 'failed', photo: null, message: NO_TEXT });
          return;
        }
        const id = Crypto.randomUUID();
        const { readable: _readable, ...fields } = reading;
        stored = keepPhoto(photo.uri, id, userId);
        await addSnap(db, userId, { ...fields, id, created_at: Date.now(), native: prefs.native, target: prefs.target, photo: stored });
        setState({ step: 'idle' });
        router.push({ pathname: '/snap/[id]', params: { id } });
      } catch (error) {
        // A photo copied for a snap that was never saved would be left with nothing pointing at it.
        if (stored) deletePhoto(stored);
        if (controller.signal.aborted) return;
        setState({
          step: 'failed',
          photo,
          message: error instanceof ApiError ? error.message : 'Could not read that photo. Try again.',
        });
      }
    },
    [db, prefs, userId],
  );

  const start = useCallback(
    async (source: 'camera' | 'library') => {
      if (state.step === 'preparing' || state.step === 'reading') return;
      const controller = begin();
      setState({ step: 'preparing' });
      try {
        const asset = await pickPhoto(source);
        if (controller.signal.aborted) return;
        if (!asset) {
          setState({ step: 'idle' });
          return;
        }
        const photo = await preparePhoto(asset);
        if (controller.signal.aborted) return;
        await read(photo, controller);
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          step: 'failed',
          photo: null,
          message: error instanceof PhotoError ? error.message : 'Could not open that photo. Try another one.',
        });
      }
    },
    [read, state.step],
  );

  const cancel = useCallback(() => {
    current.current?.abort();
    setState({ step: 'idle' });
  }, []);

  const retry = useCallback(() => {
    if (state.step === 'failed' && state.photo) read(state.photo, begin());
  }, [read, state]);

  return { state, start, cancel, retry };
}
