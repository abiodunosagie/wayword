// FILE: lib/validate.ts
// Form rules for sign-in and account. Null means valid; text says what to fix.

export const validateEmail = (email: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) ? null : 'Enter a valid email address.';

/** Matches the server's rule (supabase/config.toml: minimum_password_length = 8). */
export const validateNewPassword = (password: string) => (password.length >= 8 ? null : 'Use at least 8 characters.');

export const validatePassword = (password: string) => (password ? null : 'Enter your password.');

export const MAX_NAME = 50;

// Letters from any alphabet, with the spaces, hyphens, apostrophes and full stops real names use.
const NAME = /^\p{L}[\p{L}\p{M} '’.\-‌‍]*$/u;

export const cleanName = (value: string) => value.trim().replace(/\s+/g, ' ');

export function validateName(value: string, part: 'first' | 'last'): string | null {
  const name = cleanName(value);
  if (!name) return `Enter your ${part} name.`;
  if (name.length > MAX_NAME) return `Keep it under ${MAX_NAME} characters.`;
  if (!NAME.test(name)) return "Use letters only, plus - or ' if your name has them.";
  return null;
}
