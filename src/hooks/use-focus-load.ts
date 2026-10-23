// FILE: hooks/use-focus-load.ts
// Loads a tab's list each time the tab comes into view, so it shows what other screens changed.
// Keeps the last list on screen while it refreshes, and reports a failed load as an error
// instead of an empty list.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Loaded } from './use-record';

export function useFocusLoad<T>(load: () => Promise<T>): [Loaded<T>, () => void] {
  const [result, setResult] = useState<Loaded<T>>({ state: 'loading' });

  const run = useCallback(() => {
    let alive = true;
    load().then(
      (value) => alive && setResult({ state: 'ready', value }),
      () => alive && setResult({ state: 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [load]);

  useFocusEffect(run);
  const retry = useCallback(() => {
    setResult({ state: 'loading' });
    run();
  }, [run]);
  return [result, retry];
}
