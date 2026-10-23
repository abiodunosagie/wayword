// FILE: state/session.tsx
// Who is signed in. Follows Supabase's auth events, so signing in, signing out, a refreshed token
// and a deleted account all move the app to the right screen by themselves.
import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Account = { id: string; email: string; firstName: string; lastName: string };

type Value = { loading: boolean; account: Account | null; last: Account | null };

const SessionContext = createContext<Value | null>(null);

const MAX_NAME = 50;

/** Names come from account metadata, which can be written past the app's form rules, so they are
 * trimmed and capped again here. */
export function accountFrom(session: Session | null): Account | null {
  const user = session?.user;
  if (!user) return null;
  const name = (key: string) => {
    const v = user.user_metadata?.[key];
    return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME) : '';
  };
  return { id: user.id, email: user.email ?? '', firstName: name('first_name'), lastName: name('last_name') };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<Value, 'last'>>({ loading: true, account: null });
  // The last signed-in account, so screens closing after a sign-out can finish rendering.
  const [last, setLast] = useState<Account | null>(null);
  if (state.account && state.account !== last) setLast(state.account);

  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => alive && setState({ loading: false, account: accountFrom(data.session) }))
      .catch(() => alive && setState({ loading: false, account: null }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setState({ loading: false, account: accountFrom(session) });
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ ...state, last }), [state, last]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): Value {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession outside SessionProvider');
  return value;
}

/** For screens behind sign-in. Right after signing out, while those screens close, it is the
 * account that was signed in. */
export function useAccount(): Account {
  const { account, last } = useSession();
  const value = account ?? last;
  if (!value) throw new Error('Not signed in');
  return value;
}
