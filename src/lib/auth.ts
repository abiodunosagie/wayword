// FILE: lib/auth.ts
// Signing in, creating an account, the name, and deleting the account, with Supabase errors turned
// into words a person can act on. Passwords go straight to Supabase over HTTPS and are never kept.
import { SUPABASE_KEY, SUPABASE_URL } from './config';
import { supabase } from './supabase';
import { cleanName } from './validate';

export class AuthError extends Error {}

function friendly(error: { message?: string; status?: number; code?: string } | null | undefined): string {
  const code = error?.code ?? '';
  if (code === 'invalid_credentials') return 'That email and password do not match.';
  if (code === 'user_already_exists' || code === 'email_exists') return 'There is already an account with that email. Sign in instead.';
  if (code === 'weak_password') return 'Choose a longer password, at least 8 characters.';
  if (code === 'over_request_rate_limit' || error?.status === 429) return 'Too many tries. Wait a minute and try again.';
  if (code === 'email_not_confirmed') return 'Confirm your email first, then sign in.';
  if (!error?.status) return 'You seem to be offline. Check your connection and try again.';
  return 'Something went wrong. Try again.';
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new AuthError(friendly(error));
}

/** Creates the account. Returns true when the email must be confirmed before signing in. */
export async function signUp(email: string, password: string, firstName: string, lastName: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { first_name: cleanName(firstName), last_name: cleanName(lastName) } },
  });
  if (error) throw new AuthError(friendly(error));
  return data.session === null;
}

export async function updateName(firstName: string, lastName: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { first_name: cleanName(firstName), last_name: cleanName(lastName) } });
  if (error) throw new AuthError(friendly(error));
}

export async function signOut(): Promise<void> {
  // Local sign-out works offline; the session on the server simply expires.
  await supabase.auth.signOut({ scope: 'local' });
}

/** Deletes the account on the server. The caller clears this phone's data after it succeeds. */
export async function deleteAccount(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AuthError('Sign in again to delete your account.');
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_KEY },
    });
  } catch {
    throw new AuthError('You seem to be offline. Check your connection and try again.');
  }
  if (!response.ok) throw new AuthError('Could not delete the account. Try again.');
}
