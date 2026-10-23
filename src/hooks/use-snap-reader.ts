// FILE: hooks/use-snap-reader.ts
// The Snap flow as one state machine: pick or take a photo, shrink it, send it to Claude, keep it
// with what Claude read, then open the result. One read at a time; leaving the screen or tapping
// Cancel stops the request, and a failed read keeps the photo so Try again needs no new photo.
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { addSnap } from '@/db/snaps';
import { ApiError, readPhoto } from '@/lib/api';
import { keepPhoto, PhotoError, pickPhoto, type Prepared, preparePhoto } from '@/lib/photos';
import type { Prefs } from '@/lib/types';

export type SnapState =
  | { step: 'idle' }
  | { step: 'reading'; uri: string }
  | { step: 'failed'; message: string; photo: Prepared | null };

export function useSnapReader(userId: string, prefs: Prefs) {
  const db = useSQLiteContext();
  const [state, setState] = useState<SnapState>({ step: 'idle' });
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const read = useCallback(
    async (photo: Prepared) => {
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setState({ step: 'reading', uri: photo.uri });
      try {
        const reading = await readPhoto(prefs, photo.base64, controller.signal);
        if (controller.signal.aborted) return;
        if (!reading.readable || !reading.source_text.trim()) {
          setState({
            step: 'failed',
            photo: null,
            message: 'Claude could not find text to read in that photo. Try a closer, sharper one.',
          });
          return;
        }
        const id = Crypto.randomUUID();
        const { readable: _readable, ...fields } = reading;
        await addSnap(db, userId, {
          ...fields,
          id,
          created_at: Date.now(),
          native: prefs.native,
          target: prefs.target,
          photo: keepPhoto(photo.uri, id),
        });
        setState({ step: 'idle' });
        router.push({ pathname: '/snap/[id]', params: { id } });
      } catch (error) {
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
      if (state.step === 'reading') return;
      try {
        const asset = await pickPhoto(source);
        if (!asset) return;
        await read(await preparePhoto(asset));
      } catch (error) {
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
    abort.current?.abort();
    setState({ step: 'idle' });
  }, []);

  const retry = useCallback(() => {
    if (state.step === 'failed' && state.photo) read(state.photo);
  }, [read, state]);

  return { state, start, cancel, retry, dismiss: cancel };
}
