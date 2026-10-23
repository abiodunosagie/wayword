// FILE: lib/config.ts
// Where the backend lives, from .env.local (see .env.example). The publishable key is meant to
// ship in apps; it only works together with a signed-in session and the server's own checks.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '';
export const configured = SUPABASE_URL !== '' && SUPABASE_KEY !== '';
