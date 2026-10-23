// FILE: hooks/use-record.ts
// Loads one thing from the phone's database for a detail screen, with the three states every
// such screen needs: loading, not there (deleted elsewhere), and failed, with a way to retry.
import { useCallback, useEffect, useState } from 'react';

export type Loaded<T> = { state: 'loading' } | { state: 'missing' } | { state: 'error' } | { state: 'ready'; value: T };

export function useRecord<T>(load: () => Promise<T | null>): [Loaded<T>, () => void] {
  const [result, setResult] = useState<Loaded<T>>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    load().then(
      (value) => alive && setResult(value === null ? { state: 'missing' } : { state: 'ready', value }),
      () => alive && setResult({ state: 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [load, attempt]);

  const retry = useCallback(() => {
    setResult({ state: 'loading' });
    setAttempt((n) => n + 1);
  }, []);
  return [result, retry];
}
