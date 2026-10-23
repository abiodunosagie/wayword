// FILE: lib/api.ts
// The app's only door to Claude: POST /functions/v1/wayword with the signed-in session. The app
// sends typed fields; the server builds every prompt. Failures become ApiError with words a
// person can act on, never a stack trace or a server detail.
import { fetch } from 'expo/fetch';

import { SUPABASE_KEY, SUPABASE_URL, configured } from './config';
import { SseParser } from './sse';
import { supabase } from './supabase';
import type { Prefs, SnapReading, StoryReply, TalkReply, TalkTurn } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
  }
}

const OFFLINE = 'You seem to be offline. Check your connection and try again.';

async function token(fresh: boolean): Promise<string> {
  const { data } = fresh ? await supabase.auth.refreshSession() : await supabase.auth.getSession();
  const access = data.session?.access_token;
  if (!access) throw new ApiError('Sign in again to continue.', 401);
  return access;
}

async function send(body: object, signal?: AbortSignal, fresh = false): Promise<Response> {
  if (!configured) throw new ApiError('Wayword is not connected to its server yet.');
  let response: Response;
  try {
    response = (await fetch(`${SUPABASE_URL}/functions/v1/wayword`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await token(fresh)}`,
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    })) as unknown as Response;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError(OFFLINE);
  }
  // An expired session gets one refresh and one retry before the person is asked to sign in.
  if (response.status === 401 && !fresh) return send(body, signal, true);
  if (!response.ok) {
    let message = 'Something went wrong. Try again.';
    try {
      const data = await response.json();
      if (typeof data?.error === 'string') message = data.error;
    } catch {
      // Not JSON: keep the general message.
    }
    throw new ApiError(message, response.status);
  }
  return response;
}

async function structured<T>(body: object, signal?: AbortSignal): Promise<T> {
  const response = await send(body, signal);
  const data = (await response.json()) as { fields: T | null; stop_reason: string | null };
  if (!data.fields) {
    throw new ApiError(
      data.stop_reason === 'refusal' ? 'Claude would not answer that one.' : 'Claude could not finish. Try again.',
    );
  }
  return data.fields;
}

const pair = (p: Prefs) => ({ native: p.native, target: p.target, level: p.level });

export function readPhoto(prefs: Prefs, base64: string, signal?: AbortSignal) {
  return structured<SnapReading>(
    { mode: 'snap', ...pair(prefs), image: { media_type: 'image/jpeg', data: base64 } },
    signal,
  );
}

export function talkTurn(
  prefs: Prefs,
  scenario: { title: string; setting: string },
  turns: TalkTurn[],
  signal?: AbortSignal,
) {
  return structured<TalkReply>(
    { mode: 'talk', ...pair(prefs), scenario, turns: turns.map((t) => ({ role: t.role, text: t.text })) },
    signal,
  );
}

export function writeStory(prefs: Prefs, words: { word: string; meaning: string }[], signal?: AbortSignal) {
  return structured<StoryReply>({ mode: 'story', ...pair(prefs), words }, signal);
}

/** Streams Claude's answer to "why?" about a word; [onText] gets each piece as it is written. */
export async function explain(
  prefs: Prefs,
  ask: { phrase: string; context: string; question: string },
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await send({ mode: 'explain', ...pair(prefs), ...ask }, signal);
  if (!response.body) throw new ApiError('Claude could not finish. Try again.');
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  const parser = new SseParser();
  for (;;) {
    let chunk: ReadableStreamReadResult<string>;
    try {
      chunk = await reader.read();
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ApiError('The connection dropped. Try again.');
    }
    if (chunk.done) return;
    for (const event of parser.push(chunk.value)) {
      if (event.type === 'text') onText(event.text);
      else if (event.type === 'error') throw new ApiError(event.message);
      else if (event.type === 'done') return;
    }
  }
}
