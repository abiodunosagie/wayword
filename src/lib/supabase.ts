// FILE: lib/supabase.ts
// The one Supabase client. Sessions refresh only while the app is in the foreground, as Supabase
// recommends for mobile, so a phone in a pocket never wakes up to refresh tokens.
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { SUPABASE_KEY, SUPABASE_URL } from './config';
import { secureSession } from './secure-session';

export const supabase = createClient(SUPABASE_URL || 'https://not-configured.invalid', SUPABASE_KEY || 'missing', {
  auth: { storage: secureSession, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
