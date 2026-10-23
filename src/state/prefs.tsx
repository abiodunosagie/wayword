// FILE: state/prefs.tsx
// The language pair and level, chosen on the welcome screen and changed in Account. Kept on the
// phone (not per account), so the welcome screen shows once per install.
import Storage from 'expo-sqlite/kv-store';
import { createContext, type ReactNode, use, useCallback, useMemo, useState } from 'react';

import { isLanguage } from '@/lib/languages';
import type { Prefs } from '@/lib/types';

const KEY = 'wayword.prefs.v1';
const LEVELS = ['beginner', 'intermediate', 'advanced'];

/** The saved prefs, or null when they are missing or no longer valid (first run). */
export function readPrefs(raw: string | null): Prefs | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (isLanguage(p?.native) && isLanguage(p?.target) && p.native !== p.target && LEVELS.includes(p?.level)) {
      return { native: p.native, target: p.target, level: p.level };
    }
  } catch {
    // Unreadable: treat as first run.
  }
  return null;
}

type Value = { prefs: Prefs | null; save: (prefs: Prefs) => void };

const PrefsContext = createContext<Value | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs | null>(() => readPrefs(Storage.getItemSync(KEY)));
  const save = useCallback((next: Prefs) => {
    Storage.setItemSync(KEY, JSON.stringify(next));
    setPrefs(next);
  }, []);
  const value = useMemo(() => ({ prefs, save }), [prefs, save]);
  return <PrefsContext value={value}>{children}</PrefsContext>;
}

export function usePrefs(): Value {
  const value = use(PrefsContext);
  if (!value) throw new Error('usePrefs outside PrefsProvider');
  return value;
}

/** For screens behind the welcome screen, where prefs always exist. */
export function useLanguagePair(): Prefs {
  const { prefs } = usePrefs();
  if (!prefs) throw new Error('No language pair yet');
  return prefs;
}
