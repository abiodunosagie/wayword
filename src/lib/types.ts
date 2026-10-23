// FILE: lib/types.ts
// What the server sends back (the shapes in supabase/functions/wayword/schemas.ts) and what the
// app keeps on the phone.
import type { Level } from './languages';

export type Prefs = { native: string; target: string; level: Level };

export type SnapWord = {
  word: string;
  meaning: string;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  pronunciation: string;
  example: string;
  example_meaning: string;
  note: string;
};

export type SnapKind = 'sign' | 'menu' | 'letter' | 'label' | 'screen' | 'note' | 'other';

export type SnapReading = {
  readable: boolean;
  kind: SnapKind;
  title: string;
  source_text: string;
  translation: string;
  explanation: string;
  words: SnapWord[];
};

export type Snap = Omit<SnapReading, 'readable'> & {
  id: string;
  created_at: number;
  native: string;
  target: string;
  /** File name inside the photos folder. */
  photo: string;
};

export type Card = SnapWord & {
  id: string;
  snap_id: string | null;
  created_at: number;
  native: string;
  target: string;
  why: string;
  ease: number;
  interval_days: number;
  reps: number;
  lapses: number;
  due: number;
  reviewed_at: number | null;
};

export type TalkTurn = {
  role: 'assistant' | 'user';
  text: string;
  /** The other person's line in the learner's language. */
  meaning?: string;
  /** The learner's line said naturally, and why, when it needed fixing. */
  corrected?: string;
  why?: string;
  words?: { word: string; meaning: string }[];
};

export type TalkReply = {
  reply: string;
  reply_meaning: string;
  correction: { corrected: string; why: string };
  words: { word: string; meaning: string }[];
  finished: boolean;
};

export type Talk = {
  id: string;
  created_at: number;
  updated_at: number;
  native: string;
  target: string;
  title: string;
  setting: string;
  turns: TalkTurn[];
  finished: boolean;
};

export type StoryReply = {
  title: string;
  title_meaning: string;
  paragraphs: { text: string; meaning: string }[];
  used: string[];
};

export type Story = StoryReply & { id: string; created_at: number; native: string; target: string };
